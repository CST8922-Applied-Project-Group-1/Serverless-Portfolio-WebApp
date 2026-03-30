const sql = require('mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = async function (context, req) {
    const { email, password } = req.body;

    if (!email || !password) {
        context.res = {
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { error: 'Email and password are required' }
        };
        return;
    }

    try {
        const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
        
        // Get user from database
        const result = await pool.request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query('SELECT UserId, Email, PasswordHash, Name FROM Users WHERE Email = @email AND IsActive = 1');

        if (result.recordset.length === 0) {
            context.res = {
                status: 401,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: { error: 'Invalid credentials' }
            };
            return;
        }

        const user = result.recordset[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
        
        if (!isValidPassword) {
            context.res = {
                status: 401,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: { error: 'Invalid credentials' }
            };
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.UserId,
                email: user.Email,
                name: user.Name
            },
            process.env.JWT_SECRET || 'your-secret-key-change-this',
            { expiresIn: '24h' }
        );

        // Update last login
        await pool.request()
            .input('userId', sql.Int, user.UserId)
            .query('UPDATE Users SET LastLoginAt = GETDATE() WHERE UserId = @userId');

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                token: token,
                user: {
                    userId: user.UserId,
                    email: user.Email,
                    name: user.Name
                }
            }
        };
    } catch (error) {
        context.log.error('Login error:', error);
        context.res = {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { error: 'Login failed' }
        };
    } finally {
        await sql.close();
    }
};
