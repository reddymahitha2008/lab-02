/**
 * ========================================================
 * Lab 02: SQLite Database and CRUD Routes
 * ========================================================
 * Student Details:
 *   Name: Reddy Mahitha
 *   Registration Number: 252U1R3079
 *   Section: CSE-DS-2B
 *   Lab Number: 02
 *   Lab Title: SQLite Database and CRUD Routes
 * ========================================================
 */

const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Path to SQLite database file inside lab-02 folder
const dbPath = path.join(__dirname, 'books.db');

// Database connection variable accessible by all route handlers
let db = null;

/**
 * Asynchronous function to initialize SQLite database connection
 * and start the Express HTTP server only after the DB connection succeeds.
 */
const initializeDBAndServer = async () => {
  try {
    // 1. Open SQLite database connection
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log('Connected to SQLite database successfully.');

    // 2. Create the 'book' table if it does not already exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        price INTEGER,
        pages INTEGER
      );
    `);

    // 3. Populate 10 sample records if the table is currently empty
    const bookCountResult = await db.get(`SELECT COUNT(*) AS count FROM book;`);
    if (bookCountResult.count === 0) {
      await db.exec(`
        INSERT INTO book (title, author, price, pages) VALUES
        ('The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 750, 352),
        ('Clean Code', 'Robert C. Martin', 650, 464),
        ('JavaScript: The Good Parts', 'Douglas Crockford', 450, 176),
        ('You Don''t Know JS Yet', 'Kyle Simpson', 500, 142),
        ('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 850, 395),
        ('Introduction to Algorithms', 'Thomas H. Cormen', 1200, 1312),
        ('Node.js Design Patterns', 'Mario Casciaro and Luciano Mammino', 900, 664),
        ('Database System Concepts', 'Abraham Silberschatz', 950, 1376),
        ('Head First Design Patterns', 'Eric Freeman and Elisabeth Robson', 800, 694),
        ('Eloquent JavaScript', 'Marijn Haverbeke', 550, 472);
      `);
      console.log('10 initial sample book records inserted successfully.');
    }

    // 4. Start the Express server on port process.env.PORT || 3000
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`DB Initialization Error: ${error.message}`);
    process.exit(1);
  }
};

// Start the database and server initialization
initializeDBAndServer();

// ========================================================
// Helper Validation Functions
// ========================================================

const isValidPositiveInteger = (val) => {
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
};

const validateBookBody = (body) => {
  const { title, author, price, pages } = body;

  if (title === undefined || typeof title !== 'string' || title.trim().length === 0) {
    return "Field 'title' is required and must be a non-empty string.";
  }
  if (author === undefined || typeof author !== 'string' || author.trim().length === 0) {
    return "Field 'author' is required and must be a non-empty string.";
  }
  if (price === undefined || typeof price !== 'number' || isNaN(price) || price <= 0) {
    return "Field 'price' is required and must be a positive number.";
  }
  if (pages === undefined || typeof pages !== 'number' || !Number.isInteger(pages) || pages <= 0) {
    return "Field 'pages' is required and must be a positive integer.";
  }
  return null;
};

// ========================================================
// API Routes
// ========================================================

/**
 * Root Route (Information)
 * GET /
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 02: SQLite Database and CRUD Routes API',
    student: {
      name: 'Reddy Mahitha',
      regNo: '252U1R3079',
      section: 'CSE-DS-2B',
      labNumber: 2,
    },
    endpoints: {
      getAllBooks: 'GET /books/',
      getBookById: 'GET /books/:bookId/',
      addBook: 'POST /books/',
      updateBook: 'PUT /books/:bookId/',
      deleteBook: 'DELETE /books/:bookId/',
    },
  });
});

/**
 * Endpoint 1: GET /books/
 * Purpose: Retrieve all books.
 * Status: 200 OK
 */
app.get('/books/', async (req, res) => {
  try {
    const getBooksQuery = 'SELECT * FROM book ORDER BY id ASC;';
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

/**
 * Endpoint 2: GET /books/:bookId/
 * Purpose: Retrieve one book using its ID.
 * Success Status: 200 OK
 * Not Found Status: 404 Not Found
 * Invalid ID Status: 400 Bad Request
 */
app.get('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!isValidPositiveInteger(bookId)) {
      return res.status(400).json({ error: "Invalid bookId: must be a positive integer." });
    }

    const getBookQuery = 'SELECT * FROM book WHERE id = ?;';
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

/**
 * Endpoint 3: POST /books/
 * Purpose: Add a new book.
 * Success Status: 201 Created
 * Invalid Input Status: 400 Bad Request
 */
app.post('/books/', async (req, res) => {
  try {
    const validationError = validateBookBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { title, author, price, pages } = req.body;

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    const result = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
    ]);

    res.status(201).json({
      message: 'Book added successfully',
      bookId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

/**
 * Endpoint 4: PUT /books/:bookId/
 * Purpose: Update an existing book.
 * Success Status: 200 OK
 * Not Found Status: 404 Not Found
 * Invalid Input Status: 400 Bad Request
 */
app.put('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!isValidPositiveInteger(bookId)) {
      return res.status(400).json({ error: "Invalid bookId: must be a positive integer." });
    }

    const validationError = validateBookBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Check if the book exists before attempting update
    const checkBookQuery = 'SELECT * FROM book WHERE id = ?;';
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const { title, author, price, pages } = req.body;

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
      bookId,
    ]);

    res.status(200).json({
      message: 'Book updated successfully',
    });
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

/**
 * Endpoint 5: DELETE /books/:bookId/
 * Purpose: Delete a book.
 * Success Status: 200 OK
 * Not Found Status: 404 Not Found
 * Invalid ID Status: 400 Bad Request
 */
app.delete('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!isValidPositiveInteger(bookId)) {
      return res.status(400).json({ error: "Invalid bookId: must be a positive integer." });
    }

    // Check if the book exists before deletion
    const checkBookQuery = 'SELECT * FROM book WHERE id = ?;';
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const deleteBookQuery = 'DELETE FROM book WHERE id = ?;';
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({
      message: 'Book deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

module.exports = app;

