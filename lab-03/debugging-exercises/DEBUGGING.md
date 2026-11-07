# Lab 03: Backend Debugging Guide

**Student Name:** Reddy Mahitha  
**Registration Number:** 252U1R3079  
**Section:** CSE-DS-2B  
**Lab Number:** 03  

---

## Overview

This guide explains four common, high-frequency backend errors encountered when building Node.js, Express.js, and SQLite applications. For each error, this document details:
1. Exact Error Message
2. Why the Error Happens
3. How to Identify It in Logs/Terminal
4. Corrected Code or Command
5. How to Prevent It in the Future

The runnable test cases for these errors are provided in [`broken-server.js`](./broken-server.js).

---

## Problem 1: `EADDRINUSE` – Port Already in Use

### 1. Error Message
```text
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1904:16)
    at listenInCluster (node:net:1961:12)
    at Server.listen (node:net:2063:7)
    ...
code: 'EADDRINUSE',
errno: -4091,
syscall: 'listen',
address: '::',
port: 3000
```

### 2. Why the Error Happens
Operating systems allow only one active process to bind and listen to a specific TCP port (e.g., port 3000) at any given time. This error occurs when:
- An earlier instance of your Node.js or nodemon server is still running in the background.
- Another application (e.g., Lab 2 server, React development server, or a background process) is already listening on the same port.
- A previous server crashed unexpectedly without cleanly terminating its socket handle.

### 3. How to Identify It
- Look for `code: 'EADDRINUSE'` in the terminal console output.
- Check which process is occupying the port using terminal commands:
  - **Windows (PowerShell / CMD):**
    ```powershell
    netstat -ano | findstr :3000
    ```
  - **macOS / Linux:**
    ```bash
    lsof -i :3000
    ```

### 4. Corrected Code and Command
**Solution A: Terminate the blocking process**
- **Windows:** Find the PID (Process ID) from `netstat` and terminate it:
  ```powershell
  taskkill /PID <PID> /F
  ```
- **macOS / Linux:**
  ```bash
  kill -9 <PID>
  ```

**Solution B: Dynamic Port Assignment in Code**
Allow the port to be specified dynamically via environment variables with a fallback:
```javascript
// In server.js:
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```
To run on a different port without modifying code:
```bash
# Windows PowerShell
$env:PORT=3001; node server.js

# Linux / macOS
PORT=3001 node server.js
```

### 5. How to Prevent It
- Always stop running servers cleanly using `Ctrl + C` before starting a new terminal instance.
- Avoid hardcoding fixed port numbers; always use `process.env.PORT || 3000`.
- If using `nodemon`, make sure multiple terminal tabs are not running conflicting nodemon processes.

---

## Problem 2: Wrong Import Path – `MODULE_NOT_FOUND`

### 1. Error Message
```text
node:internal/modules/cjs/loader:1252
  throw err;
  ^

Error: Cannot find module './non-existent-db-helper.js'
Require stack:
- C:\Users\...\lab-03\debugging-exercises\broken-server.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1249:15)
    at defaultLoadImpl (node:internal/modules/cjs/loader:1243:17)
    at Module._load (node:internal/modules/cjs/loader:1443:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:261:19)
    at Module.require (node:internal/modules/cjs/loader:1474:12)
    at require (node:internal/modules/helpers:177:18)
code: 'MODULE_NOT_FOUND'
```

### 2. Why the Error Happens
Node.js CommonJS `require()` searches for modules according to specific rules:
- Relative paths starting with `./` or `../` must point to an exact existing file on disk.
- Package names without `./` or `../` (like `'express'` or `'sqlite3'`) are searched inside `node_modules/`.
This error occurs when:
- There is a typographical error in the filename or directory name (e.g. `require('./helper')` instead of `require('./helpers')`).
- File casing mismatch (e.g. `Server.js` vs `server.js` on Linux/macOS).
- The required npm package has not been installed yet (`npm install` was omitted).

### 3. How to Identify It
- Look for `Error: Cannot find module '...'` and `code: 'MODULE_NOT_FOUND'`.
- Look at the `Require stack:` lines to find the exact file and line number triggering the bad import.

### 4. Corrected Code and Command
**For local files:** Double check relative directory depth and spelling:
```javascript
// BROKEN: Wrong relative path or non-existent file
const dbHelper = require('./non-existent-db-helper.js');

// CORRECTED: Point to the actual relative path
const path = require('path');
const dbPath = path.join(__dirname, '..', 'books.db');
```

**For missing npm packages:**
```bash
# If express is missing:
npm install express

# If sqlite / sqlite3 are missing:
npm install sqlite sqlite3
```

### 5. How to Prevent It
- Use code editors with auto-completion (like VS Code / Antigravity) that automatically suggest paths when typing `require('./...')`.
- Ensure all required packages are saved in `package.json` under `"dependencies"`.
- Verify file extensions and casing match exactly.

---

## Problem 3: Table-Name Typo – `SQLITE_ERROR: no such table`

### 1. Error Message
```text
CAUGHT ERROR: SQLITE_ERROR: no such table: books
--> Execution failed on query: SELECT * FROM books;
```

### 2. Why the Error Happens
SQL databases are strictly relational and schema-based. When an SQL query references a table identifier that does not exist in the database catalog:
- The table was created with singular naming (`CREATE TABLE book ...`), but the API route queries plural naming (`SELECT * FROM books ...`).
- The database connection was opened to a completely fresh or wrong database file before running the schema creation DDL (`CREATE TABLE IF NOT EXISTS ...`).
- A spelling mistake or capitalisation discrepancy exists in the table name.

### 3. How to Identify It
- Inspect the error message: `SQLITE_ERROR: no such table: <tablename>`.
- Compare the table name defined in `database.sql` / `CREATE TABLE` with the query inside your route handler in `server.js`.

### 4. Corrected Code
```javascript
// BROKEN: Table created as 'book', but queried as 'books'
await db.exec(`CREATE TABLE IF NOT EXISTS book (id INTEGER PRIMARY KEY, title TEXT);`);
const result = await db.all('SELECT * FROM books;'); // FAILS!

// CORRECTED: Ensure table name matches definition exactly
const result = await db.all('SELECT * FROM book;'); // SUCCEEDS!
```

### 5. How to Prevent It
- Maintain consistent naming conventions across your project (e.g., singular `book` throughout).
- Keep a single source of truth for your SQL schema in `database.sql`.
- Verify the table schema in SQLite CLI using `.schema book` or `.tables`.

---

## Problem 4: Missing `await` – Calling Method on Pending Promise

### 1. Error Message
```text
Database variable without await: Promise { <pending> }
CAUGHT ERROR: TypeError: db.all is not a function
    at runBuggyCode (C:\Users\...\broken-server.js:106:10)
```
or in route handlers:
```text
TypeError: Cannot read properties of null (reading 'all')
```

### 2. Why the Error Happens
In the modern `sqlite` wrapper library, database operations (such as `open()`, `db.all()`, `db.get()`, and `db.run()`) return **Promises**.
- If you omit `await` when calling `open()`:
  ```javascript
  const db = open({ filename: 'books.db', driver: sqlite3.Database });
  ```
  The variable `db` stores an unresolved `Promise` object rather than the database connection object.
- Because a Promise does not have methods like `.all()`, `.get()`, or `.run()`, calling `db.all(...)` immediately crashes with `TypeError: db.all is not a function`.
- If an endpoint executes before an asynchronous connection completes, `db` remains `null`.

### 3. How to Identify It
- Look for `TypeError: db.all is not a function` or `TypeError: Cannot read properties of null (reading 'get')`.
- Printing `console.log(db)` outputs `Promise { <pending> }` or `null` instead of an active `Database` instance.

### 4. Corrected Code
Always use `async/await` when establishing database connections and executing queries:
```javascript
// BROKEN:
const initializeDB = () => {
  db = open({ filename: 'books.db', driver: sqlite3.Database }); // Missing await!
};

// CORRECTED:
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, 'books.db'),
      driver: sqlite3.Database,
    });
    console.log('Connected to SQLite');
    
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Initialization failed:', error.message);
  }
};
```
And in route handlers:
```javascript
// BROKEN:
app.get('/books', (req, res) => {
  const books = db.all('SELECT * FROM book;'); // Returns Promise, sends incomplete response
  res.json(books);
});

// CORRECTED:
app.get('/books', async (req, res) => {
  try {
    const books = await db.all('SELECT * FROM book;');
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

### 5. How to Prevent It
- Mark any route handler or function interacting with the database as `async`.
- Always precede database calls with `await`.
- Wrap all `await` database operations in `try...catch` blocks to handle errors gracefully.

---

## Summary Reference Table

| Error | Common Root Cause | Quick Fix |
| :--- | :--- | :--- |
| **`EADDRINUSE`** | Port 3000 occupied by previous node process | Kill process via `taskkill /PID <PID> /F` or use dynamic `PORT` |
| **`MODULE_NOT_FOUND`** | Path typo or missing `npm install` | Check filename spelling or run `npm install <package>` |
| **`no such table`** | Singular vs plural mismatch in SQL query | Match table name with `CREATE TABLE` definition (`book`) |
| **`db.all is not a function`** | Missing `await` before `open(...)` | Add `await` before asynchronous DB operations |

