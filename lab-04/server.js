// ==============================================================================
// server.js - Express Server with User Registration, Login & JWT Authentication
// Lab 4: Reddy Mahitha (252U1R3079)
// ==============================================================================

// 1. Import required dependencies
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

// 2. Initialize the Express application
const app = express();

// 3. Port Configuration (Default to 3000)
const PORT = process.env.PORT || 3000;

// 4. JWT Secret Configuration
// NOTE FOR LAB 8: In production, secrets must NEVER be hardcoded.
// For this Lab 4 assignment, we define a temporary development secret key.
// In Lab 8, this secret will be securely loaded from the .env environment file.
const JWT_SECRET = process.env.JWT_SECRET || 'LAB_04_TEMP_DEV_SECRET_KEY_REPLACE_IN_LAB_8';

// 5. Middleware to parse incoming JSON request bodies
app.use(express.json());

// Middleware to gracefully handle malformed JSON syntax in request bodies
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format in request body' });
  }
  next(err);
});

// ==============================================================================
// Root Route: Quick health check and endpoint documentation
// ==============================================================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Lab 4 Authentication API is running!',
    student: {
      name: 'Reddy Mahitha',
      regNo: '252U1R3079'
    },
    endpoints: {
      register: 'POST /register/ (JSON body: username, name, password)',
      login: 'POST /login/ (JSON body: username, password)'
    }
  });
});

// ==============================================================================
// 6. Registration API: POST /register/ (and POST /register)
// ==============================================================================
app.post(['/register', '/register/'], async (req, res) => {
  try {
    const { username, name, password } = req.body;

    // Step 1: Validate that all required fields are present and not empty
    if (!username || !name || !password) {
      return res.status(400).json({
        error: 'Missing required fields: username, name, and password are required'
      });
    }

    // Step 2: Check whether the username already exists in the SQLite database
    const checkUserQuery = 'SELECT * FROM users WHERE username = ?;';
    db.get(checkUserQuery, [username], async (err, existingUser) => {
      if (err) {
        console.error('Database query error during registration check:', err.message);
        return res.status(500).json({ error: 'Database error occurred' });
      }

      // Step 3: If user already exists, return HTTP 400
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      try {
        // Step 4: Hash the plain-text password using bcrypt (salt rounds = 10)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Step 5: Insert new user with the hashed password into the database
        const insertUserQuery = `
          INSERT INTO users (username, name, password)
          VALUES (?, ?, ?);
        `;
        db.run(insertUserQuery, [username, name, hashedPassword], function (insertErr) {
          if (insertErr) {
            console.error('Database insert error:', insertErr.message);
            return res.status(500).json({ error: 'Failed to register user' });
          }

          // Step 6: Return success response (HTTP 201 Created)
          // Notice: We NEVER return the password or the password hash in the response.
          return res.status(201).json({
            message: 'User registered successfully',
            userId: this.lastID,
            username: username
          });
        });
      } catch (hashError) {
        console.error('Password hashing error:', hashError.message);
        return res.status(500).json({ error: 'Error securing password' });
      }
    });
  } catch (error) {
    console.error('Unexpected error in /register:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================================================
// 7. Login API: POST /login/ (and POST /login)
// ==============================================================================
app.post(['/login', '/login/'], async (req, res) => {
  try {
    const { username, password } = req.body;

    // Step 1: Validate input fields
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields: username and password are required'
      });
    }

    // Step 2: Find the user by username in SQLite
    const getUserQuery = 'SELECT * FROM users WHERE username = ?;';
    db.get(getUserQuery, [username], async (err, user) => {
      if (err) {
        console.error('Database query error during login:', err.message);
        return res.status(500).json({ error: 'Database error occurred' });
      }

      // Step 3: If username does not exist, return HTTP 400
      if (!user) {
        return res.status(400).json({ error: 'Invalid user' });
      }

      // Step 4: Compare entered password with stored bcrypt hash
      const isPasswordMatched = await bcrypt.compare(password, user.password);

      // Step 5: If password does not match, return HTTP 400
      if (!isPasswordMatched) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      // Step 6: Credentials are valid -> Generate JWT token
      // CRITICAL SECURITY RULE: Include ONLY the username in payload.
      // NEVER include password or password hash!
      const payload = {
        username: user.username
      };

      // Step 7: Sign token with secret key and set expiration (1 hour)
      const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      // Step 8: Return HTTP 200 with jwt_token
      return res.status(200).json({
        jwt_token: jwtToken
      });
    });
  } catch (error) {
    console.error('Unexpected error in /login:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================================================
// 8. Optional Authentication Middleware & Protected Route (demonstrating jwt.verify)
// Useful for lab demonstration, testing, and viva questions.
// ==============================================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader !== undefined) {
    // Format: "Bearer <token>"
    token = authHeader.split(' ')[1];
  }

  if (token === null || token === undefined) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    // Attach user payload to request
    req.user = payload;
    next();
  });
};

// Protected test endpoint: only accessible with a valid JWT
app.get('/profile', authenticateToken, (req, res) => {
  const getUserQuery = 'SELECT id, username, name FROM users WHERE username = ?;';
  db.get(getUserQuery, [req.user.username], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
      message: 'Protected profile data accessed successfully',
      user: user
    });
  });
});

// ==============================================================================
// Start Server
// ==============================================================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Lab 4 Server is running on http://localhost:${PORT}`);
    console.log(`👤 Student: Reddy Mahitha (252U1R3079)`);
    console.log(`📌 Register: POST http://localhost:${PORT}/register/`);
    console.log(`📌 Login:    POST http://localhost:${PORT}/login/`);
    console.log(`=================================================`);
  });
}

module.exports = app;
