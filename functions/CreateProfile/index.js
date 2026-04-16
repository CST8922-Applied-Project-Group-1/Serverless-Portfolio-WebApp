const { validateToken, unauthorizedResponse } = require('../shared/auth');
const { sql, getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:3000',
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
      headers: {
        ...(unauthorizedResponse(auth.error).headers || {}),
        ...corsHeaders
      }
    };
    return;
  }

  const { name, bio, skills, experience, profileImageUrl } = req.body || {};

  if (!name || !name.trim()) {
    context.res = {
      status: 400,
      headers: corsHeaders,
      body: { error: 'Name is required' }
    };
    return;
  }

  try {
    const pool = await getConnection();

    const existing = await pool.request()
      .input('userId', sql.Int, auth.user.userId)
      .query(`
        SELECT TOP 1 *
        FROM dbo.Profiles
        WHERE UserId = @userId
      `);

    if (existing.recordset.length > 0) {
      context.res = {
        status: 409,
        headers: corsHeaders,
        body: { error: 'Profile already exists' }
      };
      return;
    }

    const normalizedSkills =
      Array.isArray(skills)
        ? JSON.stringify(skills)
        : typeof skills === 'string'
          ? JSON.stringify(
              skills
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
            )
          : JSON.stringify([]);

    const result = await pool.request()
      .input('userId', sql.Int, auth.user.userId)
      .input('name', sql.NVarChar(255), name.trim())
      .input('email', sql.NVarChar(255), auth.user.email)
      .input('bio', sql.NVarChar(sql.MAX), bio || '')
      .input('skills', sql.NVarChar(sql.MAX), normalizedSkills)
      .input('experience', sql.NVarChar(sql.MAX), experience || '')
      .input('profileImageUrl', sql.NVarChar(500), profileImageUrl || null)
      .query(`
        INSERT INTO dbo.Profiles
          (UserId, Name, Email, Bio, Skills, Experience, ProfileImageUrl, IsActive, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.*
        VALUES
          (@userId, @name, @email, @bio, @skills, @experience, @profileImageUrl, 1, GETDATE(), GETDATE())
      `);

    context.res = {
      status: 201,
      headers: corsHeaders,
      body: result.recordset[0]
    };
  } catch (error) {
    context.log.error('CreateProfile error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        error: 'Failed to create profile',
        details: error.message
      }
    };
  }
};