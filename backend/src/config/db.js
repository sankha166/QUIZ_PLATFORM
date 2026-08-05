const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Execute a parameterized query
 * @param {string} text - SQL query with $1, $2 placeholders
 * @param {Array} params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool (for transactions)
 */
const getClient = () => pool.connect();

/**
 * Test the database connection on startup
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { query, getClient, testConnection, pool };
