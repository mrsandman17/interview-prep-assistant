/**
 * Migration: Add topics system with many-to-many relationship
 *
 * This migration adds:
 * - topics table for topic definitions
 * - problem_topics junction table for many-to-many relationship
 * - Indexes for efficient lookups
 * - Seed data with common LeetCode topics
 */

import type Database from 'better-sqlite3';

const DEFAULT_TOPICS = [
  'Arrays',
  'Hash Table',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Sorting',
  'Greedy',
  'Backtracking',
  'Dynamic Programming',
  'Graph',
  'Tree',
  'DFS',
  'BFS',
  'Stack',
  'Queue',
  'Heap',
  'Linked List',
  'String',
  'Bit Manipulation',
  'Math',
  'Design',
  'Trie',
  'Union Find',
];

export function migrateAddTopics(db: Database.Database): void {
  // Check if topics table already exists
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='topics'"
    )
    .all() as Array<{ name: string }>;

  if (tables.length > 0) {
    console.log('Migration 002: topics tables already exist, skipping');
    return;
  }

  console.log('Migration 002: Adding topics system...');

  // Use transaction for atomicity
  const migrationTransaction = db.transaction(() => {
    // Create topics table
    db.exec(`
      CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create problem_topics junction table
    db.exec(`
      CREATE TABLE IF NOT EXISTS problem_topics (
        problem_id INTEGER NOT NULL,
        topic_id INTEGER NOT NULL,
        PRIMARY KEY (problem_id, topic_id),
        FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for efficient lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_problem_topics_problem
      ON problem_topics(problem_id)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_problem_topics_topic
      ON problem_topics(topic_id)
    `);

    // Insert seed topics
    const insertTopic = db.prepare('INSERT INTO topics (name) VALUES (?)');
    for (const topic of DEFAULT_TOPICS) {
      insertTopic.run(topic);
    }
  });

  migrationTransaction();

  console.log(
    `Migration 002: Successfully added topics system with ${DEFAULT_TOPICS.length} seed topics`
  );
}
