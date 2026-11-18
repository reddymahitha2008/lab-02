// ==============================================================================
// database.js - SQLite Database Configuration & Initialization
// ==============================================================================
// This file initializes a SQLite database connection and sets up the 'users' table.
// ==============================================================================

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Define the file path for the SQLite database (users.db in the same directory)
const dbPath = path.join(__dirname, 'users.db');

// Connect to SQLite database. If users.db doesn't exist, SQLite creates it automatically.
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database: users.db');
  }
});

// SQL query to create the 'users' table if it doesn't already exist.
// Table Schema:
// - id: Auto-incrementing primary key
// - username: Unique username, cannot be null
// - name: Full name of the user, cannot be null
// - password: Stored bcrypt hashed password (NEVER store plain-text), cannot be null
const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL
  );
`;

// Execute table creation
db.run(createUsersTableQuery, (err) => {
  if (err) {
    console.error('❌ Error creating users table:', err.message);
  } else {
    console.log('✅ Users table ready in users.db');
  }
});

// Export the db connection instance so server.js can query the database
module.exports = db;
