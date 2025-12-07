const express = require('express');
const router = express.Router();
const initDB = require('../db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middle_wares/auth_middleware.js');
let db;
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; 


router.use(async (req, res, next) => {
  if (!db) db = await initDB();
  next();
});


router.post('/signup', async (req, res) => {
  try {
    const {
      Username, Password, Firstname, Lastname,
      Birthdate, Gender, City, Address, Role, Email
    } = req.body;

    if (!Username || !Password || !Email || !Firstname || !Lastname|| !Birthdate|| !Gender|| !City|| !Role) {
      return res.status(400).json({ error: "required field is missing" });
    }


    const [existing] = await db.query(
      "SELECT * FROM Users WHERE Username = ? OR Email = ?",
      [Username, Email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Username or Email already exists" });
    }


    const hashedPassword = await bcrypt.hash(Password, SALT_ROUNDS);


    const query = `
      INSERT INTO Users
      (Username, Password, Firstname, Lastname, Birthdate, Gender, City, Address, Role, Email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      Username, hashedPassword, Firstname, Lastname, Birthdate,
      Gender, City, Address, Role, Email
    ]);


    const token = jwt.sign({ id: result.insertId, Username }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ success: true, insertedId: result.insertId, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
      return res.status(400).json({ error: "Username and Password are required" });
    }

    const query = "SELECT * FROM Users WHERE Username = ?";
    const [rows] = await db.query(query, [Username]);
    console.log(rows);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const user = rows[0];
    if (user  .isAuthorized === 0) {
      return res.status(403).json({ success: false, message: "User not authorized" });
    }

    const match = await bcrypt.compare(Password, user.Password);
    console.log(match)
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    delete user.Password; 


    const token = jwt.sign({ id: user.id, Username: user.Username,role:user.Role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ success: true, user, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
router.put("/updateData", authMiddleware, async (req, res) => {
  let { Password, Firstname, Lastname, Birthdate, Gender, City, Address } = req.body;
  const userId = req.user.Username;

  try {
    
    const [rows] = await db.query("SELECT * FROM Users WHERE Username = ?", [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    
    if (!Password) {
      Password = user.Password;
    } else {
      Password = await bcrypt.hash(Password, SALT_ROUNDS);
    }

    Firstname = Firstname || user.Firstname;
    Lastname = Lastname || user.Lastname;
    Birthdate = Birthdate || user.Birthdate;
    Gender = Gender || user.Gender;
    City = City || user.City;
    Address = Address || user.Address;

    const updateQuery = `
      UPDATE Users 
      SET Password = ?, Firstname = ?, Lastname = ?, Birthdate = ?, Gender = ?, City = ?, Address = ?
      WHERE Username = ?
    `;

    const [result] = await db.query(updateQuery, [
      Password,
      Firstname,
      Lastname,
      Birthdate,
      Gender,
      City,
      Address,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});

router.get("/userDetails", authMiddleware, async (req, res) => {
  try {
    const username = req.user.Username; 

    const [rows] = await db.query(
      "SELECT Username, Firstname, Lastname, Birthdate, Gender, City, Address, Role, Email FROM Users WHERE Username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      user: rows[0]
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});


module.exports = router;