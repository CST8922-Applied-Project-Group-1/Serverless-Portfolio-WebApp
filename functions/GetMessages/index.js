const { validateToken, unauthorizedResponse } = require('../shared/auth');
const { sql, getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  const auth = validateToken(req);
  if (!auth.valid) {
    context.res = unauthorizedResponse(auth.error);
    return;
  }

  const otherUserId = parseInt(context.bindingData.otherUserId, 10);

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', sql.Int, auth.user.userId)
      .input('otherUserId', sql.Int, otherUserId)
      .query(`
        SELECT *
        FROM Messages
        WHERE (SenderId = @userId AND ReceiverId = @otherUserId)
           OR (SenderId = @otherUserId AND ReceiverId = @userId)
        ORDER BY SentAt ASC
      `);

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: result.recordset
    };
  } catch (error) {
    context.log.error('GetMessages error:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to fetch messages' }
    };
  }
};