const mysql = require("mysql2/promise");
require("dotenv").config();

let connection;

async function initDB() {
  if (!connection) {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("Connected to MySQL");
  }
  return connection;
}

module.exports = initDB; 
