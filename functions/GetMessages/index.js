const { validateToken, unauthorizedResponse } = require('../shared/auth');
const { sql, getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const otherUserId = parseInt(context.bindingData.otherUserId, 10);

    if (Number.isNaN(otherUserId)) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'Invalid user id' }
      };
      return;
    }

    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', sql.Int, auth.user.userId)
      .input('otherUserId', sql.Int, otherUserId)
      .query(`
        SELECT
          MessageId,
          FromUserId,
          ToUserId,
          Content,
          SentAt,
          IsRead,
          ReadAt
        FROM dbo.Messages
        WHERE (
                (FromUserId = @userId AND ToUserId = @otherUserId)
             OR (FromUserId = @otherUserId AND ToUserId = @userId)
              )
          AND IsDeleted = 0
        ORDER BY SentAt ASC;
      `);

    await pool.request()
      .input('userId', sql.Int, auth.user.userId)
      .input('otherUserId', sql.Int, otherUserId)
      .query(`
        UPDATE dbo.Messages
        SET IsRead = 1,
            ReadAt = GETDATE()
        WHERE FromUserId = @otherUserId
          AND ToUserId = @userId
          AND IsRead = 0
          AND IsDeleted = 0;
      `);

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: result.recordset
    };
  } catch (error) {
    context.log.error('GetMessages error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to fetch messages',
        details: error.message
      }
    };
  }
};