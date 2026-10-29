import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import pool, { testConnection } from './config/db.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    // Verify database connectivity before opening HTTP listener
    await testConnection();
    console.log(`[CivicConnect] Connected to MySQL database '${process.env.DB_NAME || 'civic_connect'}'.`);

    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(` CivicConnect — Municipal Complaint Backend API`);
      console.log(`======================================================`);
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(` Health check:    http://localhost:${PORT}/api/health`);
      console.log(` API Base:        http://localhost:${PORT}/api`);
      console.log(` Environment:     ${process.env.NODE_ENV || 'development'}`);
      console.log(`======================================================\n`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await pool.end();
          console.log('MySQL pool closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error closing MySQL pool:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Fatal error starting server:', error.message);
    process.exit(1);
  }
}

startServer();
