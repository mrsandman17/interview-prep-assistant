import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { initializeDatabase, getDatabase, closeDatabase } from '../index';
import type { Problem, Attempt, DailySelection, Settings } from '../types';

/**
 * Database tests using TDD approach
 *
 * Testing strategy:
 * 1. Database initialization and schema creation
 * 2. Table existence validation
 * 3. Schema constraints validation
 * 4. Settings table default initialization
 * 5. Connection management
 */

describe('Database Initialization', () => {
  const testDbPath = path.join(__dirname, '../../data/test-leetcode.db');

  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    // Close database connection and clean up
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should create database file when initialized', () => {
    initializeDatabase(testDbPath);
    expect(fs.existsSync(testDbPath)).toBe(true);
  });

  it('should create problems table with correct schema', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Query sqlite_master to check table exists
    const table = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='problems'"
    ).get();

    expect(table).toBeDefined();
    expect(table).toHaveProperty('name', 'problems');

    // Check table structure
    const columns = db.prepare('PRAGMA table_info(problems)').all();
    const columnNames = columns.map((col: any) => col.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('link');
    expect(columnNames).toContain('color');
    expect(columnNames).toContain('key_insight');
    expect(columnNames).toContain('last_reviewed');
    expect(columnNames).toContain('created_at');
  });

  it('should create attempts table with correct schema', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    const table = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='attempts'"
    ).get();

    expect(table).toBeDefined();

    const columns = db.prepare('PRAGMA table_info(attempts)').all();
    const columnNames = columns.map((col: any) => col.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('problem_id');
    expect(columnNames).toContain('attempted_at');
    expect(columnNames).toContain('color_result');
  });

  it('should create daily_selections table with correct schema', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    const table = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_selections'"
    ).get();

    expect(table).toBeDefined();

    const columns = db.prepare('PRAGMA table_info(daily_selections)').all();
    const columnNames = columns.map((col: any) => col.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('problem_id');
    expect(columnNames).toContain('selected_date');
    expect(columnNames).toContain('completed');
  });

  it('should create settings table with correct schema', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    const table = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'"
    ).get();

    expect(table).toBeDefined();

    const columns = db.prepare('PRAGMA table_info(settings)').all();
    const columnNames = columns.map((col: any) => col.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('daily_problem_count');
    expect(columnNames).toContain('theme');
  });

  it('should initialize settings table with default values', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as Settings;

    expect(settings).toBeDefined();
    expect(settings.id).toBe(1);
    expect(settings.daily_problem_count).toBe(5);
    expect(settings.theme).toBe('light');
  });

  it('should enforce unique constraint on problem link', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Insert first problem
    db.prepare(
      'INSERT INTO problems (name, link) VALUES (?, ?)'
    ).run('Two Sum', 'https://leetcode.com/problems/two-sum');

    // Attempt to insert duplicate link should throw
    expect(() => {
      db.prepare(
        'INSERT INTO problems (name, link) VALUES (?, ?)'
      ).run('Two Sum Copy', 'https://leetcode.com/problems/two-sum');
    }).toThrow();
  });

  it('should enforce color CHECK constraint on problems table', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Valid colors should work
    expect(() => {
      db.prepare(
        "INSERT INTO problems (name, link, color) VALUES (?, ?, ?)"
      ).run('Test 1', 'https://leetcode.com/test1', 'gray');
    }).not.toThrow();

    expect(() => {
      db.prepare(
        "INSERT INTO problems (name, link, color) VALUES (?, ?, ?)"
      ).run('Test 2', 'https://leetcode.com/test2', 'orange');
    }).not.toThrow();

    // Invalid color should throw
    expect(() => {
      db.prepare(
        "INSERT INTO problems (name, link, color) VALUES (?, ?, ?)"
      ).run('Test 3', 'https://leetcode.com/test3', 'red');
    }).toThrow();
  });

  it('should enforce color_result CHECK constraint on attempts table', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Insert a problem first
    const result = db.prepare(
      'INSERT INTO problems (name, link) VALUES (?, ?)'
    ).run('Two Sum', 'https://leetcode.com/problems/two-sum');
    const problemId = result.lastInsertRowid;

    // Valid color results should work
    expect(() => {
      db.prepare(
        'INSERT INTO attempts (problem_id, color_result) VALUES (?, ?)'
      ).run(problemId, 'orange');
    }).not.toThrow();

    expect(() => {
      db.prepare(
        'INSERT INTO attempts (problem_id, color_result) VALUES (?, ?)'
      ).run(problemId, 'yellow');
    }).not.toThrow();

    expect(() => {
      db.prepare(
        'INSERT INTO attempts (problem_id, color_result) VALUES (?, ?)'
      ).run(problemId, 'green');
    }).not.toThrow();

    // Invalid color results should throw
    expect(() => {
      db.prepare(
        'INSERT INTO attempts (problem_id, color_result) VALUES (?, ?)'
      ).run(problemId, 'gray');
    }).toThrow();

    expect(() => {
      db.prepare(
        'INSERT INTO attempts (problem_id, color_result) VALUES (?, ?)'
      ).run(problemId, 'blue');
    }).toThrow();
  });

  it('should enforce UNIQUE constraint on (problem_id, selected_date) in daily_selections', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Insert a problem first
    const result = db.prepare(
      'INSERT INTO problems (name, link) VALUES (?, ?)'
    ).run('Two Sum', 'https://leetcode.com/problems/two-sum');
    const problemId = result.lastInsertRowid;

    const today = '2024-01-15';

    // First insertion should work
    expect(() => {
      db.prepare(
        'INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)'
      ).run(problemId, today);
    }).not.toThrow();

    // Duplicate (problem_id, selected_date) should throw
    expect(() => {
      db.prepare(
        'INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)'
      ).run(problemId, today);
    }).toThrow();
  });

  it('should enforce daily_problem_count CHECK constraint (3-10)', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Valid values (3-10) should work
    expect(() => {
      db.prepare('UPDATE settings SET daily_problem_count = ? WHERE id = 1').run(3);
    }).not.toThrow();

    expect(() => {
      db.prepare('UPDATE settings SET daily_problem_count = ? WHERE id = 1').run(5);
    }).not.toThrow();

    expect(() => {
      db.prepare('UPDATE settings SET daily_problem_count = ? WHERE id = 1').run(6);
    }).not.toThrow();

    expect(() => {
      db.prepare('UPDATE settings SET daily_problem_count = ? WHERE id = 1').run(10);
    }).not.toThrow();

    // Invalid values should throw
    expect(() => {
      db.prepare('UPDATE settings SET daily_problem_count = ? WHERE id = 1').run(2);
    }).toThrow();

    expect(() => {
      db.prepare('UPDATE settings SET daily_problem_count = ? WHERE id = 1').run(11);
    }).toThrow();
  });

  it('should enforce theme CHECK constraint', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Valid themes
    expect(() => {
      db.prepare('UPDATE settings SET theme = ? WHERE id = 1').run('light');
    }).not.toThrow();

    expect(() => {
      db.prepare('UPDATE settings SET theme = ? WHERE id = 1').run('dark');
    }).not.toThrow();

    // Invalid theme should throw
    expect(() => {
      db.prepare('UPDATE settings SET theme = ? WHERE id = 1').run('blue');
    }).toThrow();
  });

  it('should enforce settings table single row constraint (id = 1)', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Attempting to insert another row should throw
    expect(() => {
      db.prepare(
        'INSERT INTO settings (id, daily_problem_count, theme) VALUES (?, ?, ?)'
      ).run(2, 5, 'light');
    }).toThrow();
  });

  it('should handle foreign key constraint on attempts.problem_id', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');

    // Attempting to insert attempt with non-existent problem_id should throw
    expect(() => {
      db.prepare(
        'INSERT INTO attempts (problem_id, color_result) VALUES (?, ?)'
      ).run(99999, 'orange');
    }).toThrow();
  });

  it('should handle foreign key constraint on daily_selections.problem_id', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');

    // Attempting to insert selection with non-existent problem_id should throw
    expect(() => {
      db.prepare(
        'INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)'
      ).run(99999, '2024-01-15');
    }).toThrow();
  });
});

describe('Database Connection Management', () => {
  const testDbPath = path.join(__dirname, '../../data/test-connection.db');

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should return the same database instance on multiple getDatabase calls', () => {
    initializeDatabase(testDbPath);
    const db1 = getDatabase();
    const db2 = getDatabase();

    expect(db1).toBe(db2);
  });

  it('should throw error when getting database before initialization', () => {
    expect(() => {
      getDatabase();
    }).toThrow();
  });

  it('should close database connection successfully', () => {
    initializeDatabase(testDbPath);

    expect(() => {
      closeDatabase();
    }).not.toThrow();
  });

  it('should allow reinitialization after closing', () => {
    initializeDatabase(testDbPath);
    closeDatabase();

    expect(() => {
      initializeDatabase(testDbPath);
      const db = getDatabase();
      expect(db).toBeDefined();
    }).not.toThrow();
  });
});

describe('Database Schema Defaults', () => {
  const testDbPath = path.join(__dirname, '../../data/test-defaults.db');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should set default color to gray for new problems', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    db.prepare(
      'INSERT INTO problems (name, link) VALUES (?, ?)'
    ).run('Two Sum', 'https://leetcode.com/problems/two-sum');

    const problem = db.prepare('SELECT * FROM problems WHERE name = ?').get('Two Sum') as Problem;

    expect(problem.color).toBe('gray');
  });

  it('should set default completed to false for daily selections', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    const result = db.prepare(
      'INSERT INTO problems (name, link) VALUES (?, ?)'
    ).run('Two Sum', 'https://leetcode.com/problems/two-sum');
    const problemId = result.lastInsertRowid;

    db.prepare(
      'INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)'
    ).run(problemId, '2024-01-15');

    const selection = db.prepare(
      'SELECT * FROM daily_selections WHERE problem_id = ?'
    ).get(problemId) as DailySelection;

    expect(selection.completed).toBe(0); // SQLite stores boolean as 0/1
  });

  it('should auto-set created_at timestamp for new problems', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    db.prepare(
      'INSERT INTO problems (name, link) VALUES (?, ?)'
    ).run('Two Sum', 'https://leetcode.com/problems/two-sum');

    const problem = db.prepare('SELECT * FROM problems WHERE name = ?').get('Two Sum') as Problem;

    expect(problem.created_at).toBeDefined();
    expect(problem.created_at).toBeTruthy();
  });

  it('should auto-set attempted_at timestamp for new attempts', () => {
    initializeDatabase(testDbPath);
    const db = getDatabase();

    const result = db.prepare(
      'INSERT INTO problems (name, link) VALUES (?, ?)'
    ).run('Two Sum', 'https://leetcode.com/problems/two-sum');
    const problemId = result.lastInsertRowid;

    db.prepare(
      'INSERT INTO attempts (problem_id, color_result) VALUES (?, ?)'
    ).run(problemId, 'orange');

    const attempt = db.prepare(
      'SELECT * FROM attempts WHERE problem_id = ?'
    ).get(problemId) as Attempt;

    expect(attempt.attempted_at).toBeDefined();
    expect(attempt.attempted_at).toBeTruthy();
  });
});
