# Screenshots Checklist for Lab 4

Take actual screenshots of your Postman requests and terminal database verification, then save them into this folder (`screenshots/`) with these exact file names:

1. `register-success.png`
   - POST http://localhost:3000/register/
   - Body: {"username": "mahitha", "name": "Mahitha", "password": "mahitha123"}
   - Status: 201 Created

2. `register-duplicate.png`
   - POST http://localhost:3000/register/
   - Body: {"username": "mahitha", "name": "Mahitha", "password": "mahitha123"}
   - Status: 400 Bad Request ({"error": "User already exists"})

3. `login-success.png`
   - POST http://localhost:3000/login/
   - Body: {"username": "mahitha", "password": "mahitha123"}
   - Status: 200 OK ({"jwt_token": "..."})

4. `login-unknown-user.png`
   - POST http://localhost:3000/login/
   - Body: {"username": "unknown_user", "password": "password123"}
   - Status: 400 Bad Request ({"error": "Invalid user"})

5. `login-wrong-password.png`
   - POST http://localhost:3000/login/
   - Body: {"username": "mahitha", "password": "wrongpassword"}
   - Status: 400 Bad Request ({"error": "Invalid password"})

6. `database-hash.png`
   - Terminal screenshot after running: `npm run verify-db`
   - Shows the users table with the bcrypt password hash (`$2b$10$...`)
