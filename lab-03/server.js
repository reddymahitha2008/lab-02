/**
 * ========================================================
 * Lab 03: REST API, Query Parameters, Validation and Debugging
 * ========================================================
 * Student Details:
 *   Name: Reddy Mahitha
 *   Registration Number: 252U1R3079
 *   Section: CSE-DS-2B
 *   Lab Number: 03
 *   Title: REST API, Query Parameters, Validation and Debugging
 * ========================================================
 */

const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Path to SQLite database file inside lab-03 folder
const dbPath = path.join(__dirname, 'books.db');

// Global database connection reference
let db = null;

/**
 * Initializes SQLite database connection, ensures table creation,
 * seeds initial sample data if empty, and starts the Express server.
 */
const initializeDBAndServer = async () => {
  try {
    // 1. Open SQLite database connection
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log('Connected to Lab 03 SQLite database successfully.');

    // 2. Create the 'book' table if it does not already exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER
      );
    `);

    // 3. Seed 10 sample records if the table is currently empty
    const bookCount = await db.get(`SELECT COUNT(*) AS count FROM book;`);
    if (bookCount.count === 0) {
      await db.exec(`
        INSERT INTO book (title, author, price, pages) VALUES
        ('Java: The Complete Reference', 'Herbert Schildt', 650, 1248),
        ('Effective Java', 'Joshua Bloch', 550, 416),
        ('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 700, 464),
        ('The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 750, 352),
        ('JavaScript: The Good Parts', 'Douglas Crockford', 400, 176),
        ('You Don''t Know JS: Scope & Closures', 'Kyle Simpson', 450, 142),
        ('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 850, 395),
        ('Introduction to Algorithms', 'Thomas H. Cormen', 1200, 1312),
        ('Node.js Design Patterns', 'Mario Casciaro and Luciano Mammino', 900, 664),
        ('Head First Design Patterns', 'Eric Freeman and Elisabeth Robson', 800, 694);
      `);
      console.log('10 initial sample books inserted successfully into Lab 03 database.');
    }

    // 4. Start HTTP server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Lab 03 Server is running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`Database Initialization Error: ${error.message}`);
    process.exit(1);
  }
};

// Start DB and server
initializeDBAndServer();

// ========================================================
// Validation Helpers
// ========================================================

const isValidPositiveInteger = (val) => {
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
};

const validateBookInput = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a valid JSON object';
  }

  const { title, author, price, pages } = body;

  if (title === undefined || typeof title !== 'string' || title.trim() === '') {
    return 'Title is required';
  }

  if (author === undefined || typeof author !== 'string' || author.trim() === '') {
    return 'Author is required';
  }

  if (price === undefined || typeof price !== 'number' || isNaN(price) || price <= 0) {
    return 'Price is required and must be a positive number';
  }

  if (pages !== undefined && pages !== null) {
    if (typeof pages !== 'number' || !Number.isInteger(pages) || pages <= 0) {
      return 'Pages must be a positive integer';
    }
  }

  return null;
};

// Allowed sorting columns and directions (whitelisting prevents SQL injection in identifiers)
const ALLOWED_ORDER_BY = ['id', 'title', 'author', 'price', 'pages'];
const ALLOWED_ORDER = ['ASC', 'DESC'];

// ========================================================
// API Endpoints
// ========================================================

/**
 * Root Route: API Details
 * GET /
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 03: REST API, Query Parameters, Validation and Debugging',
    student: {
      name: 'Reddy Mahitha',
      regNo: '252U1R3079',
      section: 'CSE-DS-2B',
      labNumber: 3,
    },
    endpoints: {
      getBooks: 'GET /books (supports search_q, order_by, order, limit, offset, min_price, max_price)',
      getBookById: 'GET /books/:bookId',
      createBook: 'POST /books',
      updateBook: 'PUT /books/:bookId',
      deleteBook: 'DELETE /books/:bookId',
    },
  });
});

/**
 * Endpoint 1: GET /books
 * Supports query parameters:
 *   - search_q: partial title search using SQL LIKE
 *   - order_by: id | title | author | price | pages (default: id)
 *   - order: ASC | DESC (default: ASC)
 *   - limit: maximum records returned (default: 10)
 *   - offset: records skipped (default: 0)
 *   - min_price: minimum price filter
 *   - max_price: maximum price filter
 */
app.get('/books', async (req, res) => {
  try {
    const {
      search_q,
      order_by = 'id',
      order = 'ASC',
      limit = 10,
      offset = 0,
      min_price,
      max_price,
    } = req.query;

    // Validate order_by against whitelist
    const sortColumn = order_by.toLowerCase();
    if (!ALLOWED_ORDER_BY.includes(sortColumn)) {
      return res.status(400).json({
        message: `Invalid order_by column. Allowed columns: ${ALLOWED_ORDER_BY.join(', ')}`,
      });
    }

    // Validate order direction against whitelist
    const sortDirection = order.toUpperCase();
    if (!ALLOWED_ORDER.includes(sortDirection)) {
      return res.status(400).json({
        message: `Invalid order direction. Allowed values: ${ALLOWED_ORDER.join(', ')}`,
      });
    }

    // Validate limit
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: 'Invalid limit: must be a positive integer',
      });
    }

    // Validate offset
    const parsedOffset = Number(offset);
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: 'Invalid offset: must be a non-negative integer',
      });
    }

    // Validate min_price
    let parsedMinPrice = null;
    if (min_price !== undefined) {
      parsedMinPrice = Number(min_price);
      if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
        return res.status(400).json({
          message: 'Invalid min_price: must be a non-negative number',
        });
      }
    }

    // Validate max_price
    let parsedMaxPrice = null;
    if (max_price !== undefined) {
      parsedMaxPrice = Number(max_price);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
        return res.status(400).json({
          message: 'Invalid max_price: must be a non-negative number',
        });
      }
    }

    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return res.status(400).json({
        message: 'min_price cannot be greater than max_price',
      });
    }

    // Build SQL query dynamically with parameterized conditions
    let sqlQuery = 'SELECT * FROM book';
    const conditions = [];
    const queryParams = [];

    // Partial title matching with LIKE
    if (search_q !== undefined && search_q.trim() !== '') {
      conditions.push('title LIKE ?');
      queryParams.push(`%${search_q.trim()}%`);
    }

    // Minimum price filter
    if (parsedMinPrice !== null) {
      conditions.push('price >= ?');
      queryParams.push(parsedMinPrice);
    }

    // Maximum price filter
    if (parsedMaxPrice !== null) {
      conditions.push('price <= ?');
      queryParams.push(parsedMaxPrice);
    }

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // Append safe sorting & pagination
    sqlQuery += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?;`;
    queryParams.push(parsedLimit, parsedOffset);

    const books = await db.all(sqlQuery, queryParams);
    res.status(200).json(books);
  } catch (error) {
    console.error('GET /books error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Endpoint 2: GET /books/:bookId
 * Retrieves one book by ID.
 * Returns 200 when found, 404 when not found.
 */
app.get('/books/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!isValidPositiveInteger(bookId)) {
      return res.status(400).json({ message: 'Invalid bookId: must be a positive integer' });
    }

    const query = 'SELECT * FROM book WHERE id = ?;';
    const book = await db.get(query, [bookId]);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error('GET /books/:bookId error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Endpoint 3: POST /books
 * Adds a new book.
 * Validates input, inserts using parameterized SQL, returns 201 with created book.
 */
app.post('/books', async (req, res) => {
  try {
    const validationError = validateBookInput(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { title, author, price, pages } = req.body;
    const cleanPages = pages !== undefined && pages !== null ? Number(pages) : null;

    const insertQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    const result = await db.run(insertQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      cleanPages,
    ]);

    const createdBook = {
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      pages: cleanPages,
    };

    res.status(201).json({
      message: 'Book created successfully',
      book: createdBook,
    });
  } catch (error) {
    console.error('POST /books error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Endpoint 4: PUT /books/:bookId
 * Updates an existing book by ID.
 * Returns 200 on success, 404 if not found, 400 on invalid input.
 */
app.put('/books/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!isValidPositiveInteger(bookId)) {
      return res.status(400).json({ message: 'Invalid bookId: must be a positive integer' });
    }

    const validationError = validateBookInput(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Verify book exists before attempting update
    const existingBook = await db.get('SELECT * FROM book WHERE id = ?;', [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { title, author, price, pages } = req.body;
    const cleanPages = pages !== undefined && pages !== null ? Number(pages) : null;

    const updateQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    await db.run(updateQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      cleanPages,
      bookId,
    ]);

    const updatedBook = {
      id: Number(bookId),
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      pages: cleanPages,
    };

    res.status(200).json({
      message: 'Book updated successfully',
      book: updatedBook,
    });
  } catch (error) {
    console.error('PUT /books/:bookId error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Endpoint 5: DELETE /books/:bookId
 * Deletes an existing book by ID.
 * Returns 200 on success, 404 if not found.
 */
app.delete('/books/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!isValidPositiveInteger(bookId)) {
      return res.status(400).json({ message: 'Invalid bookId: must be a positive integer' });
    }

    // Verify book exists before deletion
    const existingBook = await db.get('SELECT * FROM book WHERE id = ?;', [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await db.run('DELETE FROM book WHERE id = ?;', [bookId]);

    res.status(200).json({
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /books/:bookId error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global internal error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
