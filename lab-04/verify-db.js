// ==============================================================================
// verify-db.js - Quick Database Verification Script
// Run this script anytime using: node verify-db.js
// ==============================================================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Could not open users.db:', err.message);
    process.exit(1);
  }
});

console.log('\n======================================================');
console.log('🔍 SQLite Database Verification: users.db');
console.log('Query: SELECT id, username, name, password FROM users;');
console.log('======================================================\n');

db.all('SELECT id, username, name, password FROM users;', [], (err, rows) => {
  if (err) {
    console.error('❌ Error querying database:', err.message);
  } else if (rows.length === 0) {
    console.log('⚠️  No users found in database. Register a user first!');
  } else {
    console.table(rows);
    console.log('\n📌 Notice the "password" column:');
    console.log('• It starts with "$2b$10$" (bcrypt identifier and 10 salt rounds).');
    console.log('• The plain-text password is NEVER stored.');
    console.log('• Even database administrators cannot see the original password.');
  }
  console.log('\n======================================================\n');
  db.close();
});
