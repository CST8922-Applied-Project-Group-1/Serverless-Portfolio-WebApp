const { validateToken, unauthorizedResponse } = require('../shared/auth');
const { sql, getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  const auth = validateToken(req);
  if (!auth.valid) {
    context.res = unauthorizedResponse(auth.error);
    return;
  }

  const query = (req.query.query || '').trim();

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('currentUserId', sql.Int, auth.user.userId)
      .input('search', sql.NVarChar, `%${query}%`)
      .query(`
        SELECT TOP 20 ProfileId, UserId, Name, Email, Bio, Skills, Experience
        FROM Profiles
        WHERE UserId <> @currentUserId
          AND (
            Name LIKE @search
            OR Bio LIKE @search
            OR Skills LIKE @search
            OR Experience LIKE @search
          )
        ORDER BY Name ASC
      `);

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: result.recordset
    };
  } catch (error) {
    context.log.error('SearchUsers error:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to search users' }
    };
  }
};