const sql = require('mssql');

module.exports = async function (context, req) {
    const { fromUserId, toUserId, content } = req.body;

    if (!fromUserId || !toUserId || !content) {
        context.res = {
            status: 400,
            body: { error: 'fromUserId, toUserId, and content are required' }
        };
        return;
    }

    try {
        const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
        
        // Insert message into database
        const result = await pool.request()
            .input('fromUserId', sql.Int, fromUserId)
            .input('toUserId', sql.Int, toUserId)
            .input('content', sql.NVarChar, content)
            .input('sentAt', sql.DateTime, new Date())
            .query(`
                INSERT INTO Messages (FromUserId, ToUserId, Content, SentAt, IsRead)
                OUTPUT INSERTED.*
                VALUES (@fromUserId, @toUserId, @content, @sentAt, 0)
            `);

        const message = result.recordset[0];

        // Send to Service Bus for async processing
        context.bindings.outputMessage = {
            messageId: message.MessageId,
            fromUserId: message.FromUserId,
            toUserId: message.ToUserId,
            content: message.Content,
            sentAt: message.SentAt
        };

        context.res = {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: message
        };
    } catch (error) {
        context.log.error('Error sending message:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to send message' }
        };
    } finally {
        await sql.close();
    }
};
