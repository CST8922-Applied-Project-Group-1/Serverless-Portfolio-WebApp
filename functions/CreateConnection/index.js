const { validateToken, unauthorizedResponse } = require('../shared/auth');
const { sql, getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  const auth = validateToken(req);
  if (!auth.valid) {
    context.res = unauthorizedResponse(auth.error);
    return;
  }

  const { connectedUserId } = req.body || {};

  if (!connectedUserId) {
    context.res = {
      status: 400,
      body: { error: 'connectedUserId is required' }
    };
    return;
  }

  try {
    const pool = await getConnection();

    await pool.request()
      .input('userId', sql.Int, auth.user.userId)
      .input('connectedUserId', sql.Int, connectedUserId)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM Connections
          WHERE UserId = @userId AND ConnectedUserId = @connectedUserId
        )
        BEGIN
          INSERT INTO Connections (UserId, ConnectedUserId, ConnectedAt)
          VALUES (@userId, @connectedUserId, GETDATE())
        END
      `);

    context.res = {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Connection added successfully' }
    };
  } catch (error) {
    context.log.error('CreateConnection error:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to add connection' }
    };
  }
};