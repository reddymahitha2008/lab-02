-- ========================================================
-- Lab 03: REST API, Query Parameters, Validation and Debugging
-- Student Name: Reddy Mahitha
-- Registration Number: 252U1R3079
-- Section: CSE-DS-2B
-- ========================================================

-- Step 1: Create the 'book' table if it does not already exist
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price INTEGER NOT NULL,
    pages INTEGER
);

-- Step 2: Insert 10 realistic sample book records
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

-- Verification queries:
-- SELECT * FROM book;
-- SELECT COUNT(*) FROM book;
