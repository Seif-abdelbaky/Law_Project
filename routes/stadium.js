const express = require('express');
const router = express.Router();
const initDB = require('../db.js');
const authMiddleware = require('../middle_wares/auth_middleware.js');

let db;

router.use(async (req, res, next) => {
  if (!db) db = await initDB();
  next();
});

router.post('/createStadium', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 2) {
    const name = req.body.name;
    const width = req.body.width;
    const length = req.body.length;
    const query = `INSERT INTO stadium (name, width, length) VALUES (?, ?, ?)`;
        try {
      const [result] = await db.query(query, [name, width, length]);
      const stadiumId = result.insertId;
      console
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Stadium creation failed" });
      }


    insertSeatsQuery = `INSERT INTO Seats (col, stadium_id, r,reserved) VALUES (?, ?, ?,0)`;
      for (let r = 1; r <= length; r++) {
        for (let c = 1; c <= width; c++) {
          await db.query(insertSeatsQuery, [c, stadiumId, r]);
        }
      }
      
      return res.json({ message: "User authorized successfully" });
    } catch {
      return res.status(500).json({ message: "Database error" });
    }
  }
  return res.status(403).json({ message: "Access denied" });
});


router.get  ('/getAllStadiums', authMiddleware,async (req, res) => {
  const query = "SELECT * FROM stadium";
     const [rows] = await db.query(query);
     res.json(rows);
});

module.exports = router;
