const express = require('express');
const router = express.Router();
const initDB = require('../db.js');


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
module.exports = router;
