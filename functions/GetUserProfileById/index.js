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
    const userId = Number(context.bindingData.userId);

    if (!userId) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'Invalid user id' }
      };
      return;
    }

    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 1
          UserId,
          Name,
          Email,
          Bio,
          Skills,
          Experience,
          ProfileImageUrl,
          CreatedAt,
          UpdatedAt
        FROM dbo.Profiles
        WHERE UserId = @userId
          AND IsActive = 1;
      `);

    if (result.recordset.length === 0) {
      context.res = {
        status: 404,
        headers: corsHeaders,
        body: { error: 'Profile not found' }
      };
      return;
    }

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: result.recordset[0]
    };
  } catch (error) {
    context.log.error('GetUserProfileById error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to fetch user profile',
        details: error.message
      }
    };
  }
};