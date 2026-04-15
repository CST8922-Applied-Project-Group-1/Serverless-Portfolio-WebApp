const { validateToken, unauthorizedResponse } = require('../shared/auth');
const { sql, getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  const auth = validateToken(req);
  if (!auth.valid) {
    context.res = unauthorizedResponse(auth.error);
    return;
  }

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', sql.Int, auth.user.userId)
      .query(`
        SELECT TOP 1 ProfileId, UserId, Name, Email, Bio, Skills, Experience, CreatedAt, UpdatedAt
        FROM Profiles
        WHERE UserId = @userId
      `);

    if (result.recordset.length === 0) {
      context.res = {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: { error: 'Profile not found' }
      };
      return;
    }

    const profile = result.recordset[0];

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: profile
    };
  } catch (error) {
    context.log.error('GetMyProfile error:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to fetch profile' }
    };
  }
};