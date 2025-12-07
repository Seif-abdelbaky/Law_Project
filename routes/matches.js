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
    const query = `Select * from Matches where StadiumId=?`;
        try {
          console.log("stadiumId:", stadiumId);
      const [result] = await db.query(query, [stadiumId]);
      console.log(result);
      if (result.affectedRows !== 0) {
        return res.status(404).json({ message: "Stadium taken" });
      }

       if(Hometeam==Awayteam){
    return res.status(400).json({ message: "Hometeam and Awayteam cannot be the same" });
  }
  const insertMatchQuery = `INSERT INTO Matches (Hometeam, Awayteam, Matchvenue, Date, Mainref, Lineref1, Lineref2, stadiumId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  try {
    console.log (result[0].name);
    const [matchResult] = await db.query(insertMatchQuery, [Hometeam, Awayteam, result[0].name, date, Mainref, Lineref1, Lineref2, stadiumId]);
    console.log(matchResult);
    
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
  const query = "SELECT Matches.Hometeam,Matches.Awayteam,Matches.Matchvenue,Matches.Date,Matches.Mainref,Matches.Lineref1,Matches.Lineref2,Matches.StadiumId,Seats.id,Seats.col,Seats.r,Seats.reserved FROM Matches,Seats,stadium WHERE Matches.StadiumId=stadium.id and Seats.stadium_id=stadium.id and Matches.id=?";
  
  const [rows] = await db.query(query,[matchId]);


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

  let { Hometeam, Awayteam, Matchvenue, Date, Mainref, Lineref1, Lineref2, StadiumId } = req.body;

  try {
    
    const [rows] = await db.query("SELECT * FROM Matches WHERE id = ?", [matchId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Match not found" });
    }

    const match = rows[0];

    
    Hometeam = Hometeam || match.Hometeam;
    Awayteam = Awayteam || match.Awayteam;
    Matchvenue = Matchvenue || match.Matchvenue;
    Date = Date || match.Date;
    Mainref = Mainref || match.Mainref;
    Lineref1 = Lineref1 || match.Lineref1;
    Lineref2 = Lineref2 || match.Lineref2;
    StadiumId = StadiumId || match.StadiumId;

    
    if (Hometeam === Awayteam) {
      return res.status(400).json({ message: "Hometeam and Awayteam cannot be the same" });
    }

    
    const [stadiumCheck] = await db.query(
      "SELECT * FROM Matches WHERE StadiumId = ? AND id != ?",
      [StadiumId, matchId]
    );

    if (stadiumCheck.length > 0) {
      for (let row of stadiumCheck) {
        date1 = new Date(row.Date);
        date2 = new Date(Date);
        const threeHoursInMs = 3 * 60 * 60 * 1000;
        if (Math.abs(date1 - date2) < threeHoursInMs) {
          return res.status(400).json({ message: "This stadium is already assigned to another match at a conflicting time" });
        }
      }
      
    }

    
    const updateQuery = `
      UPDATE Matches 
      SET Hometeam = ?, Awayteam = ?, Matchvenue = ?, Date = ?, 
          Mainref = ?, Lineref1 = ?, Lineref2 = ?, StadiumId = ?
      WHERE id = ?
    `;

    const [result] = await db.query(updateQuery, [
      Hometeam,
      Awayteam,
      Matchvenue,
      Date,
      Mainref,
      Lineref1,
      Lineref2,
      StadiumId,
      matchId
    ]);

    return res.json({ message: "Match updated successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});
module.exports = router;