import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'civic_connect',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true // Keep datetime formatted consistently as ISO/SQL strings
});

/**
 * Execute parameterized query with automatic connection management
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<[Array, Object]>}
 */
export async function query(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (error) {
    console.error(`[DB Query Error] SQL: ${sql} | Error:`, error.message);
    throw error;
  }
}

/**
 * Acquire a connection for transactions
 */
export async function getConnection() {
  return await pool.getConnection();
}

/**
 * Health check helper
 */
export async function testConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  return true;
}

export default pool;
