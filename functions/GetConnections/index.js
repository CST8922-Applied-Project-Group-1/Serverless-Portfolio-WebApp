const sql = require('mssql');

module.exports = async function (context, req) {
    const userId = context.bindingData.userId;

    try {
        const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    c.ConnectionId,
                    c.UserId1,
                    c.UserId2,
                    c.ConnectedAt,
                    c.Status,
                    CASE 
                        WHEN c.UserId1 = @userId THEN p2.Name
                        ELSE p1.Name
                    END as ConnectionName,
                    CASE 
                        WHEN c.UserId1 = @userId THEN p2.Email
                        ELSE p1.Email
                    END as ConnectionEmail
                FROM Connections c
                LEFT JOIN Profiles p1 ON c.UserId1 = p1.UserId
                LEFT JOIN Profiles p2 ON c.UserId2 = p2.UserId
                WHERE (c.UserId1 = @userId OR c.UserId2 = @userId)
                AND c.Status = 'accepted'
            `);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                connections: result.recordset,
                count: result.recordset.length
            }
        };
    } catch (error) {
        context.log.error('Error fetching connections:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to fetch connections' }
        };
    } finally {
        await sql.close();
    }
};
