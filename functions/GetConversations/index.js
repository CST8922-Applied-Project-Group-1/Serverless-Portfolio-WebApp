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
    const routeUserId = parseInt(context.bindingData.userId, 10);

    if (Number.isNaN(routeUserId) || routeUserId !== auth.user.userId) {
      context.res = {
        status: 403,
        headers: corsHeaders,
        body: { error: 'Forbidden' }
      };
      return;
    }

    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', sql.Int, auth.user.userId)
      .query(`
        WITH ConversationPartners AS (
            SELECT DISTINCT
                CASE
                    WHEN FromUserId = @userId THEN ToUserId
                    ELSE FromUserId
                END AS OtherUserId
            FROM dbo.Messages
            WHERE (FromUserId = @userId OR ToUserId = @userId)
              AND IsDeleted = 0
        )
        SELECT
            cp.OtherUserId,
            p.Name AS OtherUserName,
            p.Email AS OtherUserEmail,
            p.ProfileImageUrl,
            lm.Content AS LastMessage,
            lm.SentAt AS LastMessageTime,
            (
                SELECT COUNT(*)
                FROM dbo.Messages um
                WHERE um.FromUserId = cp.OtherUserId
                  AND um.ToUserId = @userId
                  AND um.IsRead = 0
                  AND um.IsDeleted = 0
            ) AS UnreadCount
        FROM ConversationPartners cp
        INNER JOIN dbo.Profiles p
            ON p.UserId = cp.OtherUserId
        OUTER APPLY (
            SELECT TOP 1 Content, SentAt
            FROM dbo.Messages m2
            WHERE (
                    (m2.FromUserId = @userId AND m2.ToUserId = cp.OtherUserId)
                 OR (m2.FromUserId = cp.OtherUserId AND m2.ToUserId = @userId)
                  )
              AND m2.IsDeleted = 0
            ORDER BY m2.SentAt DESC
        ) lm
        ORDER BY lm.SentAt DESC;
      `);

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: result.recordset
    };
  } catch (error) {
    context.log.error('GetConversations error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to fetch conversations',
        details: error.message
      }
    };
  }
};