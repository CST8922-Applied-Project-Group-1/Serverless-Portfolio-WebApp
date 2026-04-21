const { validateToken, unauthorizedResponse } = require('../shared/auth');
const { sql, getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
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
    const query = (req.query.query || '').trim();
    const currentUserId = Number(auth.user.userId);

    const pool = await getConnection();

    const result = await pool.request()
      .input('currentUserId', sql.Int, currentUserId)
      .input('search', sql.NVarChar(255), `%${query}%`)
      .query(`
        SELECT
          p.UserId,
          p.Name,
          p.Email,
          p.Bio,
          p.Skills,
          p.Experience,
          p.ProfileImageUrl,
          c.ConnectionId,
          c.Status AS ConnectionStatus,
          c.RequestedBy
        FROM dbo.Profiles p
        OUTER APPLY (
          SELECT TOP 1
            ConnectionId,
            Status,
            RequestedBy
          FROM dbo.Connections c
          WHERE (
                  (c.UserId1 = @currentUserId AND c.UserId2 = p.UserId)
               OR (c.UserId2 = @currentUserId AND c.UserId1 = p.UserId)
                )
          ORDER BY c.ConnectedAt DESC
        ) c
        WHERE p.UserId <> @currentUserId
          AND p.IsActive = 1
          AND (
            @search = '%%'
            OR p.Name LIKE @search
            OR p.Email LIKE @search
            OR p.Bio LIKE @search
            OR p.Skills LIKE @search
            OR p.Experience LIKE @search
          )
        ORDER BY p.Name ASC;
      `);

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: result.recordset
    };
  } catch (error) {
    context.log.error('SearchUsers error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to search users',
        details: error.message
      }
    };
  }
};