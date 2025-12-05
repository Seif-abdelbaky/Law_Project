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
    const query = `Select name, width, length from stadium where id=?`;
        try {
          console.log("stadiumId:", stadiumId);
      const [result] = await db.query(query, [stadiumId]);
      console.log(result);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
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

router.get('/getAllMatches', async (req, res) => {
 const query = "SELECT * FROM Matches,Seats,stadium WHERE Matches.StadiumId=stadium.id and Seats.stadium_id=stadium.id";
    const [rows] = await db.query(query);
    res.json(rows);
})
router.get('/getMatch/:id', async (req, res) => {
  const matchId = req.params.id;
  console.log(matchId);
 const query = "SELECT * FROM Matches,Seats,stadium WHERE Matches.StadiumId=stadium.id and Seats.stadium_id=stadium.id and Matches.id=?";
  
 console.log(query);
    const [rows] = await db.query(query,[matchId]);
    res.json(rows);
})
module.exports = router;
