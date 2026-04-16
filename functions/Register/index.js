const sql = require('mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = async function (context, req) {
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3000',
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

    const { email, password, name } = req.body || {};

    if (!email || !password || !name) {
        context.res = {
            status: 400,
            headers: corsHeaders,
            body: { error: 'Email, password, and name are required' }
        };
        return;
    }

    if (password.length < 8) {
        context.res = {
            status: 400,
            headers: corsHeaders,
            body: { error: 'Password must be at least 8 characters' }
        };
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        context.res = {
            status: 400,
            headers: corsHeaders,
            body: { error: 'Invalid email format' }
        };
        return;
    }

    if (!process.env.JWT_SECRET) {
        context.log.error('JWT_SECRET is missing');
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: { error: 'JWT_SECRET is not configured' }
        };
        return;
    }

    let pool;
    let transaction;

    try {
        pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedName = name.trim();

        const existingUser = await new sql.Request(transaction)
            .input('email', sql.NVarChar(255), normalizedEmail)
            .query(`
                SELECT UserId
                FROM dbo.Users
                WHERE Email = @email
            `);

        if (existingUser.recordset.length > 0) {
            await transaction.rollback();

            context.res = {
                status: 409,
                headers: corsHeaders,
                body: { error: 'User already exists' }
            };
            return;
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const userResult = await new sql.Request(transaction)
            .input('email', sql.NVarChar(255), normalizedEmail)
            .input('passwordHash', sql.NVarChar(255), passwordHash)
            .input('name', sql.NVarChar(255), normalizedName)
            .query(`
                INSERT INTO dbo.Users (Email, PasswordHash, Name, CreatedAt, IsActive)
                OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.Name
                VALUES (@email, @passwordHash, @name, GETDATE(), 1)
            `);

        const newUser = userResult.recordset[0];

        await new sql.Request(transaction)
            .input('userId', sql.Int, newUser.UserId)
            .input('name', sql.NVarChar(255), newUser.Name)
            .input('email', sql.NVarChar(255), newUser.Email)
            .input('bio', sql.NVarChar(sql.MAX), 'This user has not added a bio yet.')
            .input('skills', sql.NVarChar(sql.MAX), '[]')
            .input('experience', sql.NVarChar(sql.MAX), '')
            .query(`
                INSERT INTO dbo.Profiles (
                    UserId,
                    Name,
                    Email,
                    Bio,
                    Skills,
                    Experience,
                    ProfileImageUrl,
                    IsActive,
                    CreatedAt,
                    UpdatedAt
                )
                VALUES (
                    @userId,
                    @name,
                    @email,
                    @bio,
                    @skills,
                    @experience,
                    NULL,
                    1,
                    GETDATE(),
                    GETDATE()
                )
            `);

        await transaction.commit();

        context.log('REGISTER JWT_SECRET:', process.env.JWT_SECRET);

        const token = jwt.sign(
            {
                userId: newUser.UserId,
                email: newUser.Email,
                name: newUser.Name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        context.res = {
            status: 201,
            headers: corsHeaders,
            body: {
                success: true,
                token,
                user: {
                    userId: newUser.UserId,
                    email: newUser.Email,
                    name: newUser.Name
                }
            }
        };
    } catch (error) {
        if (transaction && transaction._aborted !== true) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                context.log.error('Registration rollback error:', rollbackError);
            }
        }

        context.log.error('Registration error:', error);
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                error: 'Registration failed',
                details: error.message
            }
        };
    } finally {
        if (sql.connected) {
            await sql.close();
        }
    }
};