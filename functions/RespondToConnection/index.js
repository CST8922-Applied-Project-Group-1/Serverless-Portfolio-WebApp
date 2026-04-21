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
    context.res = { status: 200, headers: corsHeaders };
    return;
  }

  const auth = validateToken(req);
  if (!auth.valid) {
    context.res = { ...unauthorizedResponse(auth.error), headers: corsHeaders };
    return;
  }

  try {
    const { connectionId, action } = req.body || {};
    const currentUserId = Number(auth.user.userId);

    if (!connectionId || !action) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'connectionId and action are required' }
      };
      return;
    }

    if (!['accepted', 'rejected'].includes(action)) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'action must be accepted or rejected' }
      };
      return;
    }

    const pool = await getConnection();

    const existing = await pool.request()
      .input('connectionId', sql.Int, Number(connectionId))
      .input('currentUserId', sql.Int, currentUserId)
      .query(`
        SELECT TOP 1 *
        FROM dbo.Connections
        WHERE ConnectionId = @connectionId
          AND Status = 'pending'
          AND RequestedBy <> @currentUserId
          AND (UserId1 = @currentUserId OR UserId2 = @currentUserId);
      `);

    if (existing.recordset.length === 0) {
      context.res = {
        status: 404,
        headers: corsHeaders,
        body: { error: 'Pending connection not found' }
      };
      return;
    }

    const result = await pool.request()
      .input('connectionId', sql.Int, Number(connectionId))
      .input('status', sql.NVarChar(50), action)
      .query(`
        UPDATE dbo.Connections
        SET Status = @status
        OUTPUT INSERTED.ConnectionId, INSERTED.Status, INSERTED.ConnectedAt
        WHERE ConnectionId = @connectionId;
      `);

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: {
        success: true,
        ...result.recordset[0]
      }
    };
  } catch (error) {
    context.log.error('RespondToConnection error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to respond to connection',
        details: error.message
      }
    };
  }
};