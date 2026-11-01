-- ========================================================
-- Lab 02: SQLite Database and CRUD Routes
-- Student Name: Reddy Mahitha
-- Registration Number: 252U1R3079
-- Section: CSE-DS-2B
-- ========================================================

-- Step 1: Create the 'book' table if it does not already exist
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);

-- Step 2: Insert 10 realistic sample book records
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

-- Verification queries:
-- SELECT * FROM book;
-- SELECT COUNT(*) FROM book;

