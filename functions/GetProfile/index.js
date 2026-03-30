const sql = require('mssql');

module.exports = async function (context, req) {
    const userId = context.bindingData.userId;

    try {
        // Connect to SQL Database
        const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM Profiles WHERE UserId = @userId');

        if (result.recordset.length === 0) {
            context.res = {
                status: 404,
                body: { error: 'Profile not found' }
            };
            return;
        }

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: result.recordset[0]
        };
    } catch (error) {
        context.log.error('Error fetching profile:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to fetch profile' }
        };
    } finally {
        await sql.close();
    }
};
