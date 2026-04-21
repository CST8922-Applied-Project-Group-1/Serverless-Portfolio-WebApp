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
    context.res = { status: 200, headers: corsHeaders };
    return;
  }

  const auth = validateToken(req);
  if (!auth.valid) {
    context.res = { ...unauthorizedResponse(auth.error), headers: corsHeaders };
    return;
  }

  try {
    const currentUserId = Number(auth.user.userId);
    const pool = await getConnection();

    const incoming = await pool.request()
      .input('currentUserId', sql.Int, currentUserId)
      .query(`
        SELECT
          c.ConnectionId,
          c.Status,
          c.ConnectedAt,
          c.RequestedBy,
          COALESCE(p.UserId, c.RequestedBy) AS UserId,
          COALESCE(p.Name, CONCAT('User #', c.RequestedBy)) AS Name,
          COALESCE(p.Email, '') AS Email,
          COALESCE(p.Bio, '') AS Bio,
          COALESCE(p.Skills, '') AS Skills,
          COALESCE(p.Experience, '') AS Experience,
          COALESCE(p.ProfileImageUrl, '') AS ProfileImageUrl
        FROM dbo.Connections c
        LEFT JOIN dbo.Profiles p
          ON p.UserId = c.RequestedBy
        WHERE c.Status = 'pending'
          AND (c.UserId1 = @currentUserId OR c.UserId2 = @currentUserId)
          AND c.RequestedBy <> @currentUserId
        ORDER BY c.ConnectedAt DESC;
      `);

    const outgoing = await pool.request()
      .input('currentUserId', sql.Int, currentUserId)
      .query(`
        SELECT
          c.ConnectionId,
          c.Status,
          c.ConnectedAt,
          c.RequestedBy,
          COALESCE(p.UserId, CASE
            WHEN c.UserId1 = @currentUserId THEN c.UserId2
            ELSE c.UserId1
          END) AS UserId,
          COALESCE(p.Name, CONCAT('User #', CASE
            WHEN c.UserId1 = @currentUserId THEN c.UserId2
            ELSE c.UserId1
          END)) AS Name,
          COALESCE(p.Email, '') AS Email,
          COALESCE(p.Bio, '') AS Bio,
          COALESCE(p.Skills, '') AS Skills,
          COALESCE(p.Experience, '') AS Experience,
          COALESCE(p.ProfileImageUrl, '') AS ProfileImageUrl
        FROM dbo.Connections c
        LEFT JOIN dbo.Profiles p
          ON p.UserId = CASE
                          WHEN c.UserId1 = @currentUserId THEN c.UserId2
                          ELSE c.UserId1
                        END
        WHERE c.Status = 'pending'
          AND c.RequestedBy = @currentUserId
          AND (c.UserId1 = @currentUserId OR c.UserId2 = @currentUserId)
        ORDER BY c.ConnectedAt DESC;
      `);

    const accepted = await pool.request()
      .input('currentUserId', sql.Int, currentUserId)
      .query(`
        SELECT
          c.ConnectionId,
          c.Status,
          c.ConnectedAt,
          c.RequestedBy,
          COALESCE(p.UserId, CASE
            WHEN c.UserId1 = @currentUserId THEN c.UserId2
            ELSE c.UserId1
          END) AS UserId,
          COALESCE(p.Name, CONCAT('User #', CASE
            WHEN c.UserId1 = @currentUserId THEN c.UserId2
            ELSE c.UserId1
          END)) AS Name,
          COALESCE(p.Email, '') AS Email,
          COALESCE(p.Bio, '') AS Bio,
          COALESCE(p.Skills, '') AS Skills,
          COALESCE(p.Experience, '') AS Experience,
          COALESCE(p.ProfileImageUrl, '') AS ProfileImageUrl
        FROM dbo.Connections c
        LEFT JOIN dbo.Profiles p
          ON p.UserId = CASE
                          WHEN c.UserId1 = @currentUserId THEN c.UserId2
                          ELSE c.UserId1
                        END
        WHERE c.Status = 'accepted'
          AND (c.UserId1 = @currentUserId OR c.UserId2 = @currentUserId)
        ORDER BY Name ASC;
      `);

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: {
        incoming: incoming.recordset,
        outgoing: outgoing.recordset,
        accepted: accepted.recordset
      }
    };
  } catch (error) {
    context.log.error('GetConnectionsSummary error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to fetch connections summary',
        details: error.message
      }
    };
  }
};