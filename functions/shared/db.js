const sql = require('mssql');

let pool;

async function getConnection() {
  if (pool) return pool;

  pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
  return pool;
}

module.exports = {
  sql,
  getConnection
};