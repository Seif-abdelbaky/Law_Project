const express = require('express');
const router = express.Router();
const initDB = require('../db.js');
const authMiddleware = require('../middleware/authMiddleware');

let db;

router.use(async (req, res, next) => {
  if (!db) db = await initDB();
  next();
});

router.put('/createStadium', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 2) {
    const userId = req.params.id;
    const name = req.body.name;
    const width = req.body.width;
    const length = req.body.length;
    const query = `INSERT INTO stadium (name, width, length) VALUES (?, ?, ?)`;
        try {
      const [result] = await db.query(query, [name, width, length]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ message: "User authorized successfully" });
    } catch {
      return res.status(500).json({ message: "Database error" });
    }
  }
  return res.status(403).json({ message: "Access denied" });
});

router.get('/getAllUnauthorized', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 1) {
    const query = `SELECT id, Username, Firstname, Lastname, Email FROM Users WHERE isAuthorized = 0`;
    try {
      const [rows] = await db.query(query);
      return res.json({ unauthorizedUsers: rows });
    } catch {
      return res.status(500).json({ message: "Database error" });
    }
  }
  return res.status(403).json({ message: "Access denied" });
});

router.get('/getAllUsers', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 1) {
    const query = `SELECT id, Username, Firstname, Lastname, Email FROM Users`;
    try {
      const [rows] = await db.query(query);
      return res.json({ users: rows });
    } catch {
      return res.status(500).json({ message: "Database error" });
    }
  }
  return res.status(403).json({ message: "Access denied" });
});

router.delete('/deleteUser/:id', authMiddleware, async (req, res) => {
  if (req.user && req.user.role === 1) {
    const userId = req.params.id;
    const query = `DELETE FROM Users WHERE id = ?`;
    try {
      await db.query(query, [userId]);
      return res.json({ message: "User deleted successfully" });
    } catch {
      return res.status(500).json({ message: "Database error" });
    }
  }
  return res.status(403).json({ message: "Access denied" });
});

module.exports = router;
