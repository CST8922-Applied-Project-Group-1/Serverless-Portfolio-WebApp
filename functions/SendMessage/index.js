const { validateToken, unauthorizedResponse } = require('../shared/auth');
const { sql, getConnection } = require('../shared/db');

module.exports = async function (context, req) {
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

  const auth = validateToken(req);
  if (!auth.valid) {
    context.res = {
      ...unauthorizedResponse(auth.error),
      headers: corsHeaders
    };
    return;
  }

  try {
    const { toUserId, content } = req.body || {};

    if (!toUserId || !content || !content.trim()) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'toUserId and content are required' }
      };
      return;
    }

    const pool = await getConnection();

    const result = await pool.request()
      .input('fromUserId', sql.Int, auth.user.userId)
      .input('toUserId', sql.Int, parseInt(toUserId, 10))
      .input('content', sql.NVarChar(sql.MAX), content.trim())
      .query(`
        INSERT INTO dbo.Messages (
          FromUserId,
          ToUserId,
          Content,
          SentAt,
          IsRead,
          IsDeleted
        )
        OUTPUT INSERTED.MessageId, INSERTED.FromUserId, INSERTED.ToUserId, INSERTED.Content, INSERTED.SentAt, INSERTED.IsRead
        VALUES (
          @fromUserId,
          @toUserId,
          @content,
          GETDATE(),
          0,
          0
        );
      `);

    context.res = {
      status: 201,
      headers: corsHeaders,
      body: {
        success: true,
        ...result.recordset[0]
      }
    };
  } catch (error) {
    context.log.error('SendMessage error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to send message',
        details: error.message
      }
    };
  }
};