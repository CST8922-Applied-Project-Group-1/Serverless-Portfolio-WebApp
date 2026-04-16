const { validateToken, unauthorizedResponse } = require('../shared/auth');
const { sql, getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  const auth = validateToken(req);
  if (!auth.valid) {
    context.res = unauthorizedResponse(auth.error);
    return;
  }

  const { name, bio, skills, experience } = req.body || {};

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('userId', sql.Int, auth.user.userId)
      .input('name', sql.NVarChar, name || '')
      .input('bio', sql.NVarChar(sql.MAX), bio || '')
      .input('skills', sql.NVarChar(sql.MAX), JSON.stringify(skills || []))
      .input('experience', sql.NVarChar(sql.MAX), experience || '')
      .query(`
        UPDATE Profiles
        SET
          Name = @name,
          Bio = @bio,
          Skills = @skills,
          Experience = @experience,
          UpdatedAt = GETDATE()
        WHERE UserId = @userId;

        SELECT TOP 1 *
        FROM Profiles
        WHERE UserId = @userId;
      `);

    if (result.recordset.length === 0) {
      context.res = {
        status: 404,
        body: { error: 'Profile not found' }
      };
      return;
    }

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: result.recordset[0]
    };
  } catch (error) {
    context.log.error('UpdateProfile error:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to update profile' }
    };
  }
};