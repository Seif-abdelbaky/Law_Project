const express = require('express');
const router = express.Router();
const initDB = require('../db.js');
const authMiddleware = require('../middle_wares/auth_middleware.js');

let db;

router.use(async (req, res, next) => {
  if (!db) db = await initDB();
  next();
});


router.post('/createMatch', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 2) {
    const Hometeam = req.body.Hometeam;
    const Awayteam = req.body.Awayteam;
    const date = req.body.Date;
    const Mainref= req.body.Mainref;
    const Lineref1= req.body.Lineref1;
    const Lineref2= req.body.Lineref2;
    const stadiumId= req.body.stadiumId;
    const query = `Select * from Matches where StadiumId=? and Date=?`;
        try {
          console.log("stadiumId:", stadiumId);
      const [result] = await db.query(query, [stadiumId,date]);
      console.log(result);
      if (result.length !== 0) {
        return res.status(404).json({ message: "Stadium taken" });
      }

       if(Hometeam==Awayteam){
    return res.status(400).json({ message: "Hometeam and Awayteam cannot be the same" });
  }
  const query1 = `Select * from stadium where id=?`;
  const [result1] = await db.query(query1, [stadiumId]);
  console.log(result1);
  const insertMatchQuery = `INSERT INTO Matches (Hometeam, Awayteam, Matchvenue, Date, Mainref, Lineref1, Lineref2, stadiumId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  try {
    console.log (result1[0].name);
    const [matchResult] = await db.query(insertMatchQuery, [Hometeam, Awayteam, result1[0].name, date, Mainref, Lineref1, Lineref2, stadiumId]);
    console.log(matchResult);
    insertSeatsQuery = `INSERT INTO Seats (col, stadium_id, r,reserved,matchId) VALUES (?, ?, ?,0,?)`;
    const width=result1[0].width;
    const length=result1[0].length;
      for (let r = 1; r <= length; r++) {
        for (let c = 1; c <= width; c++) {
          await db.query(insertSeatsQuery, [c, stadiumId, r, matchResult.insertId]);
        }
      }
    return res.json({ message: "Match created successfully", matchId: matchResult.insertId });
  } catch (error){
    return res.status(500).json({ message:  error.message });
  }



    } catch {
      return res.status(500).json({ message: "Database error" });
    }
  
 

  }}
);

// router.get('/getAllMatches', async (req, res) => {
//  const query = "SELECT * , Matches.id FROM Matches,Seats,stadium WHERE Matches.StadiumId=stadium.id and Seats.stadium_id=stadium.id";
//     const [rows] = await db.query(query);
//     res.json(rows);
// })
router.get('/getAllMatches', async (req, res) => {
 const query = "SELECT *  FROM Matches";
    const [rows] = await db.query(query);
    res.json(rows);
})

router.get('/getMatch/:id', async (req, res) => {
  const matchId = req.params.id;
  console.log(matchId);
  const query = "SELECT Matches.Hometeam,Matches.Awayteam,Matches.Matchvenue,Matches.Date,Matches.Mainref,Matches.Lineref1,Matches.Lineref2,Matches.StadiumId,Seats.id,Seats.col,Seats.r,Seats.reserved FROM Matches,Seats,stadium WHERE Seats.matchId=? and Matches.StadiumId=stadium.id and Seats.stadium_id=stadium.id and Matches.id=?";
  
  const [rows] = await db.query(query,[matchId,matchId]);


  const match = {
    Hometeam: rows[0].Hometeam,
    Awayteam: rows[0].Awayteam,
    Matchvenue: rows[0].Matchvenue,
    Date: rows[0].Date,
    Mainref: rows[0].Mainref,
    Lineref1: rows[0].Lineref1,
    Lineref2: rows[0].Lineref2,
    StadiumId: rows[0].StadiumId,
  };

  const seats = rows.map(r => ({
    id: r.id,
    col: r.col,
    r: r.r,
    reserved: r.reserved
  }));

  return res.json({ match, seats });
});



router.put("/reserveSeat/:id", authMiddleware, async (req, res) => {
  const name=req.user.Username;
  const seatId = req.params.id;
  let alreadyReserved=await db.query("SELECT * FROM Seats WHERE id = ? and reserved=1", [seatId]);
  console.log(alreadyReserved);
  alreadyReserved=alreadyReserved[0];
  if(alreadyReserved.length>0){
    return res.status(400).json({ message: "Seat already reserved" });
  }
  const query = "UPDATE Seats SET reserved = 1, Username=? WHERE id = ?";
  try {
    const [rows] = await db.query(query,[name,seatId]);
    console .log(rows);
    return  res.json({ message: {"ticketId":seatId} });
  } catch (error) {
    return res.status(500).json({ message: "Database error" });
  }
});


router.put("/unreserveSeat/:id", authMiddleware, async (req, res) => {
  const seatId = req.params.id;
  const name  = req.user.Username;
  const query = "UPDATE Seats SET reserved = 0,Username=NULL WHERE id = ? and Username=?";  

   try {
    const [rows] = await db.query(query,[seatId,name]);
    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "Seat not found or not reserved by you" });
    }
    return  res.json({ message: {"ticketId":seatId} });
  } catch (error) {
    return res.status(500).json({ message: "Database error" });
  } 
})


router.put("/updateMatch/:id", authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 2) {
    return res.status(403).json({ message: "Access denied" });
  }

  const matchId = req.params.id;

  try {
    // Extract fields directly without destructuring to avoid Date conflict
    const Hometeam = req.body.Hometeam;
    const Awayteam = req.body.Awayteam;
    const Matchvenue = req.body.Matchvenue;
    const matchDate = req.body.Date;  // Extract as matchDate
    const Mainref = req.body.Mainref;
    const Lineref1 = req.body.Lineref1;
    const Lineref2 = req.body.Lineref2;
    const StadiumId = req.body.StadiumId;

    const [rows] = await db.query("SELECT * FROM Matches WHERE id = ?", [matchId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Match not found" });
    }

    const match = rows[0];

    // Use the extracted values with defaults from the database
    const updatedHometeam = Hometeam !== undefined ? Hometeam : match.Hometeam;
    const updatedAwayteam = Awayteam !== undefined ? Awayteam : match.Awayteam;
    const updatedMatchvenue = Matchvenue !== undefined ? Matchvenue : match.Matchvenue;
    const updatedMatchDate = matchDate !== undefined ? matchDate : match.Date;
    const updatedMainref = Mainref !== undefined ? Mainref : match.Mainref;
    const updatedLineref1 = Lineref1 !== undefined ? Lineref1 : match.Lineref1;
    const updatedLineref2 = Lineref2 !== undefined ? Lineref2 : match.Lineref2;
    const updatedStadiumId = StadiumId !== undefined ? StadiumId : match.StadiumId;

    if (updatedHometeam === updatedAwayteam) {
      return res.status(400).json({ message: "Hometeam and Awayteam cannot be the same" });
    }

    const updateQuery = `
      UPDATE Matches 
      SET Hometeam = ?, Awayteam = ?, Matchvenue = ?, Date = ?, 
          Mainref = ?, Lineref1 = ?, Lineref2 = ?, StadiumId = ?
      WHERE id = ?
    `;

    const [result] = await db.query(updateQuery, [
      updatedHometeam,
      updatedAwayteam,
      updatedMatchvenue,
      updatedMatchDate,
      updatedMainref,
      updatedLineref1,
      updatedLineref2,
      updatedStadiumId,
      matchId
    ]);

    return res.json({ message: "Match updated successfully" });

  } catch (err) {
    console.error("Error updating match:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
});
module.exports = router;