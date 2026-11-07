/**
 * ========================================================
 * Lab 03: Debugging Exercise - Intentionally Broken Examples
 * ========================================================
 * Student Details:
 *   Name: Reddy Mahitha
 *   Registration Number: 252U1R3079
 *   Section: CSE-DS-2B
 * ========================================================
 * 
 * NOTE: This file is intentionally designed for educational debugging.
 * It contains 4 common backend errors with runnable demonstrations.
 * Select a bug scenario using an argument or environment variable:
 *   node broken-server.js 1   --> Bug 1: Port Conflict (EADDRINUSE)
 *   node broken-server.js 2   --> Bug 2: Wrong Import Path (MODULE_NOT_FOUND)
 *   node broken-server.js 3   --> Bug 3: Table-Name Typo (SQLITE_ERROR: no such table)
 *   node broken-server.js 4   --> Bug 4: Missing Await (Promise <pending> / db.all is not a function)
 */

const scenario = process.argv[2] || process.env.SCENARIO || 'all';

console.log(`\n--- Running Debugging Scenario: ${scenario} ---`);

// ============================================================================
// BUG 1: EADDRINUSE - Port Already In Use
// ============================================================================
if (scenario === '1') {
  console.log('Demonstrating Bug 1: EADDRINUSE...');
  const express = require('express');
  const app1 = express();
  const app2 = express();

  const PORT = 4000;

  // First server binds successfully to port 4000
  app1.listen(PORT, () => {
    console.log(`Server 1 successfully listening on port ${PORT}`);

    // Second server attempts to bind to the SAME port 4000
    // This will trigger Error: listen EADDRINUSE: address already in use :::4000
    console.log(`Server 2 attempting to listen on already occupied port ${PORT}...`);
    app2.listen(PORT, () => {
      console.log(`Server 2 listening (will not reach here!)`);
    });
  });
}

// ============================================================================
// BUG 2: Wrong Import Path - Module Not Found
// ============================================================================
if (scenario === '2') {
  console.log('Demonstrating Bug 2: MODULE_NOT_FOUND...');
  // INTENTIONAL ERROR: Typo in the required module path or name
  // Trying to require a non-existent file path:
  console.log("Attempting to import './non-existent-db-helper.js'...");
  const dbHelper = require('./non-existent-db-helper.js');
  console.log(dbHelper);
}

// ============================================================================
// BUG 3: Table-Name Typo - SQLITE_ERROR: no such table
// ============================================================================
if (scenario === '3') {
  console.log('Demonstrating Bug 3: Table-name typo...');
  const path = require('path');
  const { open } = require('sqlite');
  const sqlite3 = require('sqlite3');

  (async () => {
    const db = await open({
      filename: path.join(__dirname, 'test.db'),
      driver: sqlite3.Database,
    });

    // Created table is 'book' (singular)
    await db.exec(`CREATE TABLE IF NOT EXISTS book (id INTEGER PRIMARY KEY, title TEXT);`);
    console.log("Table 'book' created.");

    // INTENTIONAL ERROR: Querying 'books' (plural typo) instead of 'book'
    console.log("Executing faulty query: 'SELECT * FROM books;'");
    try {
      await db.all('SELECT * FROM books;');
    } catch (err) {
      console.error('CAUGHT ERROR:', err.message);
    } finally {
      await db.close();
    }
  })();
}

// ============================================================================
// BUG 4: Missing Await - Calling method on pending Promise
// ============================================================================
if (scenario === '4') {
  console.log('Demonstrating Bug 4: Missing await...');
  const path = require('path');
  const { open } = require('sqlite');
  const sqlite3 = require('sqlite3');

  const runBuggyCode = () => {
    // INTENTIONAL ERROR: Missing 'await' before open()
    // db holds Promise { <pending> } rather than the resolved Database instance!
    const db = open({
      filename: path.join(__dirname, 'test.db'),
      driver: sqlite3.Database,
    });

    console.log('Database variable without await:', db);

    try {
      // Calling db.all() on a Promise causes TypeError: db.all is not a function
      db.all('SELECT * FROM book;');
    } catch (err) {
      console.error('CAUGHT ERROR:', err.name + ':', err.message);
    }
  };

  runBuggyCode();
}

if (scenario === 'all') {
  console.log('Please specify a scenario number (1, 2, 3, or 4):');
  console.log('  node broken-server.js 1  -> EADDRINUSE demo');
  console.log('  node broken-server.js 2  -> MODULE_NOT_FOUND demo');
  console.log('  node broken-server.js 3  -> SQLITE_ERROR no such table demo');
  console.log('  node broken-server.js 4  -> Missing await demo');
}

