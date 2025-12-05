const express = require('express');
const router = express.Router();
const initDB = require('../db.js');
const authMiddleware = require('../middle_wares/auth_middleware.js');

let db;

router.use(async (req, res, next) => {
  if (!db) db = await initDB();
  next();
});

router.get('/getAllMatches', async (req, res) => {
 const query = "SELECT * FROM Matches,Seats WHERE Matches.id=Seats.matchId";
    const [rows] = await db.query(query);
    res.json(rows);
})

router.get('/getMatch/:id', async (req, res) => {
  const matchId = req.params.id;
  console.log(matchId);
 const query = `SELECT *
FROM Matches
JOIN Seats ON Matches.id = Seats.matchId
WHERE Matches.id = ${matchId};
`;
 console.log(query);
    const [rows] = await db.query(query);
    res.json(rows);
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
      "SELECT id FROM Matches WHERE StadiumId = ? AND id != ?",
      [StadiumId, matchId]
    );

    if (stadiumCheck.length > 0) {
      return res.status(400).json({ message: "This stadium is already assigned to another match" });
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
