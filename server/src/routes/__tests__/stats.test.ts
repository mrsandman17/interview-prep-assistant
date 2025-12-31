/**
 * Tests for Statistics Routes
 *
 * This test suite validates the stats endpoint:
 *
 * GET /api/stats:
 * - Returns correct totalProblems count
 * - Returns correct greenProblems count (mastered)
 * - Calculates currentStreak correctly:
 *   - Returns 0 when no selections exist
 *   - Returns 0 when today's selection is incomplete
 *   - Returns 1 when only today is completed
 *   - Returns N for N consecutive days completed
 *   - Breaks streak when a day is skipped
 *   - Breaks streak when a day has incomplete problems
 * - Calculates readyForReview correctly:
 *   - Counts orange problems >= 3 days since last review
 *   - Counts yellow problems >= 7 days since last review
 *   - Counts green problems >= 14 days since last review
 *   - Includes problems never reviewed (last_reviewed IS NULL)
 *   - Excludes gray problems from review count
 *   - Excludes problems reviewed too recently
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index.js';
import { initializeDatabase, closeDatabase, getDatabase } from '../../db/index.js';

/**
 * Helper function to get today's date in ISO format (YYYY-MM-DD)
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Helper function to get a date N days ago in ISO format
 */
function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Helper function to insert a problem into the database
 */
function insertProblem(
  db: any,
  name: string,
  color: string,
  lastReviewed: string | null = null
): number {
  const result = db
    .prepare(
      `INSERT INTO problems (name, link, color, last_reviewed) VALUES (?, ?, ?, ?)`
    )
    .run(name, `https://leetcode.com/problems/${name}`, color, lastReviewed);
  return result.lastInsertRowid as number;
}

/**
 * Helper function to create a daily selection for a specific date
 */
function createDailySelection(
  db: any,
  problemId: number,
  date: string,
  completed: boolean = false
): void {
  db.prepare(
    `INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`
  ).run(problemId, date, completed ? 1 : 0);
}

// Use in-memory database for tests
beforeEach(() => {
  initializeDatabase(':memory:');
});

afterAll(() => {
  closeDatabase();
});

describe('GET /api/stats', () => {
  describe('totalProblems count', () => {
    it('should return 0 when no problems exist', async () => {
      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalProblems', 0);
    });

    it('should return correct count of all problems', async () => {
      const db = getDatabase();

      // Insert various problems
      insertProblem(db, 'Problem 1', 'gray');
      insertProblem(db, 'Problem 2', 'orange');
      insertProblem(db, 'Problem 3', 'yellow');
      insertProblem(db, 'Problem 4', 'green');
      insertProblem(db, 'Problem 5', 'gray');

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalProblems', 5);
    });
  });

  describe('greenProblems count', () => {
    it('should return 0 when no green problems exist', async () => {
      const db = getDatabase();

      insertProblem(db, 'Problem 1', 'gray');
      insertProblem(db, 'Problem 2', 'orange');
      insertProblem(db, 'Problem 3', 'yellow');

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('greenProblems', 0);
    });

    it('should return correct count of green (mastered) problems', async () => {
      const db = getDatabase();

      insertProblem(db, 'Problem 1', 'gray');
      insertProblem(db, 'Problem 2', 'green');
      insertProblem(db, 'Problem 3', 'orange');
      insertProblem(db, 'Problem 4', 'green');
      insertProblem(db, 'Problem 5', 'green');

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('greenProblems', 3);
    });
  });

  describe('currentStreak calculation', () => {
    it('should return 0 when no daily selections exist', async () => {
      const db = getDatabase();
      insertProblem(db, 'Problem 1', 'gray');

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentStreak', 0);
    });

    it('should return 0 when today has selections but none completed', async () => {
      const db = getDatabase();
      const problemId = insertProblem(db, 'Problem 1', 'gray');

      createDailySelection(db, problemId, getToday(), false);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentStreak', 0);
    });

    it('should return 0 when today has partial completion', async () => {
      const db = getDatabase();
      const problem1 = insertProblem(db, 'Problem 1', 'gray');
      const problem2 = insertProblem(db, 'Problem 2', 'gray');

      createDailySelection(db, problem1, getToday(), true);
      createDailySelection(db, problem2, getToday(), false);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentStreak', 0);
    });

    it('should return 1 when only today is fully completed', async () => {
      const db = getDatabase();
      const problem1 = insertProblem(db, 'Problem 1', 'gray');
      const problem2 = insertProblem(db, 'Problem 2', 'gray');

      createDailySelection(db, problem1, getToday(), true);
      createDailySelection(db, problem2, getToday(), true);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentStreak', 1);
    });

    it('should count consecutive days backwards from today', async () => {
      const db = getDatabase();
      const problem1 = insertProblem(db, 'Problem 1', 'gray');
      const problem2 = insertProblem(db, 'Problem 2', 'gray');

      // Create completed selections for last 3 days (including today)
      createDailySelection(db, problem1, getToday(), true);
      createDailySelection(db, problem2, getToday(), true);

      createDailySelection(db, problem1, getDaysAgo(1), true);
      createDailySelection(db, problem2, getDaysAgo(1), true);

      createDailySelection(db, problem1, getDaysAgo(2), true);
      createDailySelection(db, problem2, getDaysAgo(2), true);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentStreak', 3);
    });

    it('should break streak when a day is skipped', async () => {
      const db = getDatabase();
      const problem1 = insertProblem(db, 'Problem 1', 'gray');

      // Today and yesterday completed, but 2 days ago is missing
      createDailySelection(db, problem1, getToday(), true);
      createDailySelection(db, problem1, getDaysAgo(1), true);
      // No selection for getDaysAgo(2)
      createDailySelection(db, problem1, getDaysAgo(3), true);
      createDailySelection(db, problem1, getDaysAgo(4), true);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentStreak', 2);
    });

    it('should break streak when a day has incomplete problems', async () => {
      const db = getDatabase();
      const problem1 = insertProblem(db, 'Problem 1', 'gray');
      const problem2 = insertProblem(db, 'Problem 2', 'gray');

      // Today completed
      createDailySelection(db, problem1, getToday(), true);
      createDailySelection(db, problem2, getToday(), true);

      // Yesterday partially completed (should break streak)
      createDailySelection(db, problem1, getDaysAgo(1), true);
      createDailySelection(db, problem2, getDaysAgo(1), false);

      // 2 days ago completed
      createDailySelection(db, problem1, getDaysAgo(2), true);
      createDailySelection(db, problem2, getDaysAgo(2), true);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentStreak', 1);
    });

    it('should return 0 when streak starts in the future (edge case)', async () => {
      const db = getDatabase();
      const problem1 = insertProblem(db, 'Problem 1', 'gray');

      // Create a selection for yesterday, but not today
      createDailySelection(db, problem1, getDaysAgo(1), true);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentStreak', 0);
    });
  });

  describe('readyForReview calculation', () => {
    it('should return 0 when no problems need review', async () => {
      const db = getDatabase();

      // All problems are gray (new) - not counted as review
      insertProblem(db, 'Problem 1', 'gray');
      insertProblem(db, 'Problem 2', 'gray');

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 0);
    });

    it('should exclude gray problems from review count', async () => {
      const db = getDatabase();

      insertProblem(db, 'Gray Problem', 'gray', null);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 0);
    });

    it('should include orange problems never reviewed', async () => {
      const db = getDatabase();

      insertProblem(db, 'Orange 1', 'orange', null);
      insertProblem(db, 'Orange 2', 'orange', null);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 2);
    });

    it('should include orange problems >= 3 days since last review', async () => {
      const db = getDatabase();

      insertProblem(db, 'Orange Old', 'orange', getDaysAgo(3));
      insertProblem(db, 'Orange Older', 'orange', getDaysAgo(10));

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 2);
    });

    it('should exclude orange problems reviewed < 3 days ago', async () => {
      const db = getDatabase();

      insertProblem(db, 'Orange Recent', 'orange', getDaysAgo(2));
      insertProblem(db, 'Orange Today', 'orange', getToday());

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 0);
    });

    it('should include yellow problems never reviewed', async () => {
      const db = getDatabase();

      insertProblem(db, 'Yellow 1', 'yellow', null);
      insertProblem(db, 'Yellow 2', 'yellow', null);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 2);
    });

    it('should include yellow problems >= 7 days since last review', async () => {
      const db = getDatabase();

      insertProblem(db, 'Yellow Old', 'yellow', getDaysAgo(7));
      insertProblem(db, 'Yellow Older', 'yellow', getDaysAgo(14));

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 2);
    });

    it('should exclude yellow problems reviewed < 7 days ago', async () => {
      const db = getDatabase();

      insertProblem(db, 'Yellow Recent', 'yellow', getDaysAgo(6));
      insertProblem(db, 'Yellow Today', 'yellow', getToday());

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 0);
    });

    it('should include green problems never reviewed', async () => {
      const db = getDatabase();

      insertProblem(db, 'Green 1', 'green', null);
      insertProblem(db, 'Green 2', 'green', null);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 2);
    });

    it('should include green problems >= 14 days since last review', async () => {
      const db = getDatabase();

      insertProblem(db, 'Green Old', 'green', getDaysAgo(14));
      insertProblem(db, 'Green Older', 'green', getDaysAgo(30));

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 2);
    });

    it('should exclude green problems reviewed < 14 days ago', async () => {
      const db = getDatabase();

      insertProblem(db, 'Green Recent', 'green', getDaysAgo(13));
      insertProblem(db, 'Green Today', 'green', getToday());

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('readyForReview', 0);
    });

    it('should correctly count mixed colors with different review dates', async () => {
      const db = getDatabase();

      // Orange: 3 eligible (null, 3 days, 5 days) + 1 not eligible (2 days)
      insertProblem(db, 'Orange 1', 'orange', null);
      insertProblem(db, 'Orange 2', 'orange', getDaysAgo(3));
      insertProblem(db, 'Orange 3', 'orange', getDaysAgo(5));
      insertProblem(db, 'Orange 4', 'orange', getDaysAgo(2));

      // Yellow: 2 eligible (null, 7 days) + 1 not eligible (6 days)
      insertProblem(db, 'Yellow 1', 'yellow', null);
      insertProblem(db, 'Yellow 2', 'yellow', getDaysAgo(7));
      insertProblem(db, 'Yellow 3', 'yellow', getDaysAgo(6));

      // Green: 2 eligible (null, 14 days) + 1 not eligible (13 days)
      insertProblem(db, 'Green 1', 'green', null);
      insertProblem(db, 'Green 2', 'green', getDaysAgo(14));
      insertProblem(db, 'Green 3', 'green', getDaysAgo(13));

      // Gray: should be excluded
      insertProblem(db, 'Gray 1', 'gray', null);
      insertProblem(db, 'Gray 2', 'gray', getDaysAgo(10));

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      // Expected: 3 orange + 2 yellow + 2 green = 7
      expect(response.body).toHaveProperty('readyForReview', 7);
    });
  });

  describe('complete stats response', () => {
    it('should return all four stats fields', async () => {
      const db = getDatabase();

      // Create some test data
      const problem1 = insertProblem(db, 'Problem 1', 'green', getDaysAgo(15));
      const problem2 = insertProblem(db, 'Problem 2', 'orange', getDaysAgo(5));
      insertProblem(db, 'Problem 3', 'gray');

      createDailySelection(db, problem1, getToday(), true);

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        totalProblems: 3,
        greenProblems: 1,
        currentStreak: 1,
        readyForReview: 2, // 1 green + 1 orange eligible
      });
    });

    it('should handle error gracefully', async () => {
      // Close database to force an error
      closeDatabase();

      const response = await request(app).get('/api/stats');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message', 'Failed to fetch statistics');

      // Reinitialize for cleanup
      initializeDatabase(':memory:');
    });
  });
});
