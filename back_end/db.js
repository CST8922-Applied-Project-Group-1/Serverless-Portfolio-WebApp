require('dotenv').config();

async function connectDB() {
  try {
    console.log('Mock database connection ready');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

module.exports = { connectDB };