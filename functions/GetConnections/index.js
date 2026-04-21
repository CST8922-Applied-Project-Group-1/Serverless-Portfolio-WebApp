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
    const routeUserId = Number(context.bindingData.userId);

    if (!routeUserId || Number.isNaN(routeUserId)) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'Invalid userId route parameter' }
      };
      return;
    }

    if (routeUserId !== Number(auth.user.userId)) {
      context.res = {
        status: 403,
        headers: corsHeaders,
        body: { error: 'Forbidden' }
      };
      return;
    }

    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', sql.Int, routeUserId)
      .query(`
        SELECT *
        FROM dbo.Connections
        WHERE UserId1 = @userId OR UserId2 = @userId
        ORDER BY ConnectedAt DESC
      `);

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: result.recordset
    };
  } catch (error) {
    context.log.error('Error fetching connections:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to fetch connections',
        details: error.message
      }
    };
  }
};