/**
 * Database initialization and connection management
 *
 * This module provides the core database functionality using better-sqlite3.
 * It handles:
 * - Database file creation and initialization
 * - Schema execution from schema.sql
 * - Connection lifecycle management
 * - Safe connection access with error handling
 *
 * Usage:
 *   import { initializeDatabase, getDatabase } from './db';
 *
 *   // Initialize on app startup
 *   initializeDatabase('./data/leetcode.db');
 *
 *   // Use in services/routes
 *   const db = getDatabase();
 *   const problems = db.prepare('SELECT * FROM problems').all();
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Singleton database instance
 * Ensures only one connection exists throughout the application lifecycle
 */
let dbInstance: Database.Database | null = null;

/**
 * Initializes the SQLite database with schema
 *
 * This function:
 * 1. Creates the database file if it doesn't exist
 * 2. Reads and executes the SQL schema file
 * 3. Enables foreign key constraints
 * 4. Stores the database instance for reuse
 *
 * @param dbPath - Absolute or relative path to the database file
 * @throws Error if schema.sql cannot be read or database creation fails
 *
 * @example
 * ```typescript
 * initializeDatabase('./data/leetcode.db');
 * ```
 */
export function initializeDatabase(dbPath: string): void {
  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Close existing connection if any
  if (dbInstance) {
    dbInstance.close();
  }

  // Create or open database
  dbInstance = new Database(dbPath);

  // Enable foreign key constraints (disabled by default in SQLite)
  dbInstance.pragma('foreign_keys = ON');

  // Read schema file
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Execute schema
  // Use exec() for multiple statements (better-sqlite3 handles this safely)
  dbInstance.exec(schema);
}

/**
 * Returns the initialized database instance
 *
 * This function provides access to the singleton database connection.
 * It should be called after initializeDatabase() has been invoked.
 *
 * @returns The Database instance
 * @throws Error if database has not been initialized
 *
 * @example
 * ```typescript
 * const db = getDatabase();
 * const problems = db.prepare('SELECT * FROM problems').all();
 * ```
 */
export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first.'
    );
  }
  return dbInstance;
}

/**
 * Closes the database connection
 *
 * This should be called on application shutdown to ensure
 * proper cleanup and prevent database lock issues.
 *
 * Safe to call multiple times - will only close if database is open.
 *
 * @example
 * ```typescript
 * // On app shutdown
 * closeDatabase();
 * ```
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Re-export types for convenience
 * This allows consumers to import types from the same module as the database functions
 */
export type {
  Problem,
  NewProblem,
  UpdateProblem,
  Attempt,
  NewAttempt,
  DailySelection,
  NewDailySelection,
  Settings,
  UpdateSettings,
  ProblemColor,
  AttemptColorResult,
  Theme,
} from './types';
