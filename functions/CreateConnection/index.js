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
    const { connectedUserId } = req.body || {};

    if (!connectedUserId) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'connectedUserId is required' }
      };
      return;
    }

    const currentUserId = Number(auth.user.userId);
    const targetUserId = Number(connectedUserId);

    if (currentUserId === targetUserId) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'You cannot connect with yourself' }
      };
      return;
    }

    const userId1 = Math.min(currentUserId, targetUserId);
    const userId2 = Math.max(currentUserId, targetUserId);

    const pool = await getConnection();

    const existing = await pool.request()
      .input('userId1', sql.Int, userId1)
      .input('userId2', sql.Int, userId2)
      .query(`
        SELECT TOP 1 ConnectionId, Status
        FROM dbo.Connections
        WHERE UserId1 = @userId1 AND UserId2 = @userId2;
      `);

    if (existing.recordset.length > 0) {
      context.res = {
        status: 409,
        headers: corsHeaders,
        body: { error: 'Connection already exists' }
      };
      return;
    }

    const result = await pool.request()
      .input('userId1', sql.Int, userId1)
      .input('userId2', sql.Int, userId2)
      .input('requestedBy', sql.Int, currentUserId)
      .query(`
  INSERT INTO dbo.Connections (UserId1, UserId2, ConnectedAt, Status, RequestedBy)
  OUTPUT INSERTED.ConnectionId, INSERTED.UserId1, INSERTED.UserId2, INSERTED.Status, INSERTED.ConnectedAt, INSERTED.RequestedBy
  VALUES (@userId1, @userId2, GETDATE(), 'pending', @requestedBy);
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
    context.log.error('CreateConnection error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to create connection',
        details: error.message
      }
    };
  }
};