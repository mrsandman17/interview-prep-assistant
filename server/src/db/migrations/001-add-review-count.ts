/**
 * Migration: Add review_count column to problems table
 *
 * This migration adds a denormalized review_count column for performance.
 * The column tracks the total number of reviews (attempts) for each problem.
 *
 * Backfills existing data by counting rows in the attempts table.
 */

import type Database from 'better-sqlite3';

export function migrateAddReviewCount(db: Database.Database): void {
  // Check if review_count column already exists
  const columns = db.prepare('PRAGMA table_info(problems)').all() as Array<{ name: string }>;
  const hasReviewCount = columns.some(col => col.name === 'review_count');

  if (hasReviewCount) {
    console.log('Migration 001: review_count column already exists, skipping');
    return;
  }

  console.log('Migration 001: Adding review_count column and backfilling data...');

  // Use transaction for atomicity
  const migrationTransaction = db.transaction(() => {
    // Add column with default value
    db.exec('ALTER TABLE problems ADD COLUMN review_count INTEGER DEFAULT 0');

    // Backfill from attempts table
    db.exec(`
      UPDATE problems
      SET review_count = (
        SELECT COUNT(*) FROM attempts WHERE problem_id = problems.id
      )
    `);
  });

  migrationTransaction();

  console.log('Migration 001: Successfully added review_count column');
}
