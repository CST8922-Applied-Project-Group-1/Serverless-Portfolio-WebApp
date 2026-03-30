const sql = require('mssql');

module.exports = async function (context, req) {
    const { name, email, bio, skills } = req.body;

    if (!name || !email) {
        context.res = {
            status: 400,
            body: { error: 'Name and email are required' }
        };
        return;
    }

    try {
        const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
        
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('bio', sql.NVarChar, bio || '')
            .input('skills', sql.NVarChar, JSON.stringify(skills || []))
            .input('createdAt', sql.DateTime, new Date())
            .query(`
                INSERT INTO Profiles (Name, Email, Bio, Skills, CreatedAt)
                OUTPUT INSERTED.*
                VALUES (@name, @email, @bio, @skills, @createdAt)
            `);

        context.res = {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: result.recordset[0]
        };
    } catch (error) {
        context.log.error('Error creating profile:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to create profile' }
        };
    } finally {
        await sql.close();
    }
};
