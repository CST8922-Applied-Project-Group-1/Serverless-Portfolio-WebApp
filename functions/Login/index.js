const sql = require('mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = async function (context, req) {

    console.log('LOGIN URL:', `${process.env.REACT_APP_API_URL}/login`);

    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: corsHeaders
        };
        return;
    }

    const { email, password } = req.body || {};

    if (!email || !password) {
        context.res = {
            status: 400,
            headers: corsHeaders,
            body: { error: 'Email and password are required' }
        };
        return;
    }

    if (!process.env.JWT_SECRET) {
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: { error: 'JWT_SECRET is not configured' }
        };
        return;
    }

    let pool;

    try {
        pool = await sql.connect(process.env.SQL_CONNECTION_STRING);

        const result = await pool.request()
            .input('email', sql.NVarChar(255), email.toLowerCase().trim())
            .query(`
                SELECT UserId, Email, PasswordHash, Name
                FROM dbo.Users
                WHERE Email = @email AND IsActive = 1
            `);

        if (result.recordset.length === 0) {
            context.res = {
                status: 401,
                headers: corsHeaders,
                body: { error: 'Invalid credentials' }
            };
            return;
        }

        const user = result.recordset[0];
        const isValidPassword = await bcrypt.compare(password, user.PasswordHash);

        if (!isValidPassword) {
            context.res = {
                status: 401,
                headers: corsHeaders,
                body: { error: 'Invalid credentials' }
            };
            return;
        }

        context.log('LOGIN JWT_SECRET:', process.env.JWT_SECRET);

        const token = jwt.sign(
            {
                userId: user.UserId,
                email: user.Email,
                name: user.Name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        await pool.request()
            .input('userId', sql.Int, user.UserId)
            .query(`
                UPDATE dbo.Users
                SET LastLoginAt = GETDATE()
                WHERE UserId = @userId
            `);

        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {
                success: true,
                token,
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
            headers: corsHeaders,
            body: { error: 'Login failed', details: error.message }
        };
    } finally {
        if (sql.connected) {
            await sql.close();
        }
    }
};