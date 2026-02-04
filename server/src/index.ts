import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import type { Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, closeDatabase } from './db/index.js';
import { problemsRouter } from './routes/problems.js';
import { dailyRouter } from './routes/daily.js';
import { statsRouter } from './routes/stats.js';
import { topicsRouter } from './routes/topics.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Express application instance
 * Configured with JSON parsing and CORS middleware
 */
export const app = express();

// Get port from environment or use default
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/**
 * Middleware Configuration
 */

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse text/csv and text/plain as strings for CSV import
app.use(express.text({ type: ['text/csv', 'text/plain'] }));

/**
 * Route Handlers
 */

/**
 * Health check endpoint
 * Returns server status and current timestamp
 *
 * @route GET /health
 * @returns {object} 200 - Server status and ISO timestamp
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */
app.use('/api/problems', problemsRouter);
app.use('/api/daily', dailyRouter);
app.use('/api/stats', statsRouter);
app.use('/api/topics', topicsRouter);

/**
 * 404 handler for unknown routes
 * Must be defined after all other routes
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
});

/**
 * Global error handler
 * Catches any errors thrown in route handlers
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  });
});

/**
 * Server instance
 * Only start server if this file is executed directly (not imported for testing)
 */
export let server: Server | undefined;

// Start server only when not imported by tests
if (import.meta.url === `file://${process.argv[1]}`) {
  // Initialize database on server startup
  const dbPath = path.join(__dirname, '../data/leetcode.db');
  initializeDatabase(dbPath);
  console.log(`Database initialized at ${dbPath}`);

  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown: close database connection on process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    closeDatabase();
    if (server) {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    closeDatabase();
    if (server) {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}
