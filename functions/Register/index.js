const sql = require('mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = async function (context, req) {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
        context.res = {
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { error: 'Email, password, and name are required' }
        };
        return;
    }

    if (password.length < 8) {
        context.res = {
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { error: 'Password must be at least 8 characters' }
        };
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        context.res = {
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { error: 'Invalid email format' }
        };
        return;
    }

    try {
        const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
        
        // Check if user already exists
        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query('SELECT UserId FROM Users WHERE Email = @email');

        if (existingUser.recordset.length > 0) {
            context.res = {
                status: 409,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: { error: 'User already exists' }
            };
            return;
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await pool.request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .input('passwordHash', sql.NVarChar, passwordHash)
            .input('name', sql.NVarChar, name)
            .input('createdAt', sql.DateTime, new Date())
            .query(`
                INSERT INTO Users (Email, PasswordHash, Name, CreatedAt, IsActive)
                OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.Name
                VALUES (@email, @passwordHash, @name, @createdAt, 1)
            `);

        const newUser = result.recordset[0];

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: newUser.UserId,
                email: newUser.Email,
                name: newUser.Name
            },
            process.env.JWT_SECRET || 'your-secret-key-change-this',
            { expiresIn: '24h' }
        );

        context.res = {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                token: token,
                user: {
                    userId: newUser.UserId,
                    email: newUser.Email,
                    name: newUser.Name
                }
            }
        };
    } catch (error) {
        context.log.error('Registration error:', error);
        context.res = {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { error: 'Registration failed' }
        };
    } finally {
        await sql.close();
    }
};
