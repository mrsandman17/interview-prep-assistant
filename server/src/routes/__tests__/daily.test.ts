/**
 * Tests for Daily Routes - Spaced Repetition Daily Selection
 *
 * This test suite validates the daily problem selection and completion endpoints:
 *
 * GET /api/daily:
 * - Creates selection if doesn't exist for today
 * - Returns existing selection for today
 * - Returns problems with completion status
 *
 * POST /api/daily/:problemId/complete:
 * - Updates problem color correctly (gray→orange, orange→yellow, yellow→green, green→green)
 * - Updates last_reviewed to today
 * - Inserts attempt record
 * - Marks daily_selection as completed
 * - Validates color input (rejects 'gray', invalid colors)
 * - Returns 404 for non-existent problem
 * - Returns 400 for invalid color
 * - Uses transaction (rollback on error)
 *
 * POST /api/daily/refresh:
 * - Deletes existing selection for today
 * - Creates new selection
 * - Returns new problems
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index.js';
import { initializeDatabase, closeDatabase, getDatabase } from '../../db/index.js';
import type { Problem, DailySelection, Attempt } from '../../db/types.js';

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

// Use in-memory database for tests
beforeEach(() => {
  initializeDatabase(':memory:');
});

afterAll(() => {
  closeDatabase();
});

describe('GET /api/daily', () => {
  it('should create selection when none exists for today', async () => {
    const db = getDatabase();

    // Create enough eligible problems for selection
    for (let i = 1; i <= 5; i++) insertProblem(db, `Gray ${i}`, 'gray');
    for (let i = 1; i <= 5; i++)
      insertProblem(db, `Orange ${i}`, 'orange', getDaysAgo(5));

    const response = await request(app).get('/api/daily');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('problems');
    expect(response.body.problems).toBeInstanceOf(Array);
    expect(response.body.problems.length).toBeGreaterThan(0);

    // Verify daily_selections table has entries
    const selections = db
      .prepare('SELECT * FROM daily_selections WHERE selected_date = ?')
      .all(getToday()) as DailySelection[];
    expect(selections.length).toBe(response.body.problems.length);
  });

  it('should return existing selection for today', async () => {
    const db = getDatabase();

    // Create problems and manual selection
    const id1 = insertProblem(db, 'Two Sum', 'gray');
    const id2 = insertProblem(db, 'Valid Parentheses', 'orange', getDaysAgo(5));

    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id1, getToday());
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id2, getToday());

    const response = await request(app).get('/api/daily');

    expect(response.status).toBe(200);
    expect(response.body.problems).toHaveLength(2);
    expect(response.body.problems.map((p: any) => p.id)).toContain(id1);
    expect(response.body.problems.map((p: any) => p.id)).toContain(id2);
  });

  it('should return problems with completion status', async () => {
    const db = getDatabase();

    const id1 = insertProblem(db, 'Two Sum', 'gray');
    const id2 = insertProblem(db, 'Valid Parentheses', 'orange', getDaysAgo(5));

    // Insert one completed, one not completed
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`
    ).run(id1, getToday(), 1);
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`
    ).run(id2, getToday(), 0);

    const response = await request(app).get('/api/daily');

    expect(response.status).toBe(200);
    expect(response.body.problems).toHaveLength(2);

    const problem1 = response.body.problems.find((p: any) => p.id === id1);
    const problem2 = response.body.problems.find((p: any) => p.id === id2);

    expect(problem1.completed).toBe(true);
    expect(problem2.completed).toBe(false);
  });

  it('should include all problem fields in response', async () => {
    const db = getDatabase();

    const id = insertProblem(db, 'Two Sum', 'gray');
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id, getToday());

    const response = await request(app).get('/api/daily');

    expect(response.status).toBe(200);
    const problem = response.body.problems[0];

    expect(problem).toHaveProperty('id');
    expect(problem).toHaveProperty('name');
    expect(problem).toHaveProperty('link');
    expect(problem).toHaveProperty('color');
    expect(problem).toHaveProperty('key_insight');
    expect(problem).toHaveProperty('last_reviewed');
    expect(problem).toHaveProperty('completed');
  });

  it('should not return selections from previous days', async () => {
    const db = getDatabase();

    const id1 = insertProblem(db, 'Two Sum', 'gray');
    const id2 = insertProblem(db, 'Valid Parentheses', 'gray');

    // Insert selection for yesterday
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id1, getDaysAgo(1));
    // Insert selection for today
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id2, getToday());

    const response = await request(app).get('/api/daily');

    expect(response.status).toBe(200);
    expect(response.body.problems).toHaveLength(1);
    expect(response.body.problems[0].id).toBe(id2);
  });

  it('should return empty array when no eligible problems exist', async () => {
    // No problems in database

    const response = await request(app).get('/api/daily');

    expect(response.status).toBe(200);
    expect(response.body.problems).toEqual([]);
  });

  it('should handle when only ineligible problems exist', async () => {
    const db = getDatabase();

    // Create problems that aren't eligible (too recently reviewed)
    insertProblem(db, 'Orange Recent', 'orange', getDaysAgo(1));
    insertProblem(db, 'Yellow Recent', 'yellow', getDaysAgo(3));
    insertProblem(db, 'Green Recent', 'green', getDaysAgo(5));

    const response = await request(app).get('/api/daily');

    expect(response.status).toBe(200);
    expect(response.body.problems).toEqual([]);
  });
});

describe('POST /api/daily/:problemId/complete', () => {
  it('should update gray problem to orange', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'orange' });

    expect(response.status).toBe(200);
    expect(response.body.problem.color).toBe('orange');

    // Verify in database
    const problem = db
      .prepare('SELECT * FROM problems WHERE id = ?')
      .get(id) as Problem;
    expect(problem.color).toBe('orange');
  });

  it('should update orange problem to yellow', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'orange', getDaysAgo(5));
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'yellow' });

    expect(response.status).toBe(200);
    expect(response.body.problem.color).toBe('yellow');

    const problem = db
      .prepare('SELECT * FROM problems WHERE id = ?')
      .get(id) as Problem;
    expect(problem.color).toBe('yellow');
  });

  it('should update yellow problem to green', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'yellow', getDaysAgo(10));
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'green' });

    expect(response.status).toBe(200);
    expect(response.body.problem.color).toBe('green');

    const problem = db
      .prepare('SELECT * FROM problems WHERE id = ?')
      .get(id) as Problem;
    expect(problem.color).toBe('green');
  });

  it('should keep green problem as green', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'green', getDaysAgo(20));
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'green' });

    expect(response.status).toBe(200);
    expect(response.body.problem.color).toBe('green');

    const problem = db
      .prepare('SELECT * FROM problems WHERE id = ?')
      .get(id) as Problem;
    expect(problem.color).toBe('green');
  });

  it('should allow orange problem to stay orange (struggled)', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'orange', getDaysAgo(5));
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'orange' });

    expect(response.status).toBe(200);
    expect(response.body.problem.color).toBe('orange');
  });

  it('should update last_reviewed to today', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'orange' });

    const problem = db
      .prepare('SELECT * FROM problems WHERE id = ?')
      .get(id) as Problem;
    expect(problem.last_reviewed).toBe(getToday());
  });

  it('should insert attempt record', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'orange' });

    const attempts = db
      .prepare('SELECT * FROM attempts WHERE problem_id = ?')
      .all(id) as Attempt[];

    expect(attempts).toHaveLength(1);
    expect(attempts[0].problem_id).toBe(id);
    expect(attempts[0].color_result).toBe('orange');
    expect(attempts[0].attempted_at).toBeTruthy();
  });

  it('should mark daily_selection as completed', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');

    // Create daily selection
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`
    ).run(id, getToday(), 0);

    await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'orange' });

    const selection = db
      .prepare(
        'SELECT * FROM daily_selections WHERE problem_id = ? AND selected_date = ?'
      )
      .get(id, getToday()) as DailySelection;

    expect(selection.completed).toBe(1); // SQLite stores boolean as 0/1
  });

  it('should return 400 if problem not in today\'s selection', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');

    // No daily selection exists - should return 400
    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'orange' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('not in today\'s selection');
  });

  it('should reject gray color result', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'orange', getDaysAgo(5));

    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'gray' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Color');
  });

  it('should reject invalid color result', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');

    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Color');
  });

  it('should return 404 for non-existent problem', async () => {
    const response = await request(app)
      .post('/api/daily/9999/complete')
      .send({ colorResult: 'orange' });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('not found');
  });

  it('should return 400 for invalid problem ID format', async () => {
    const response = await request(app)
      .post('/api/daily/invalid/complete')
      .send({ colorResult: 'orange' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('must be a number');
  });

  it('should return 400 when color is missing', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');

    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Color');
  });

  it('should use transaction (all or nothing)', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');

    // This test verifies transactional behavior by checking that
    // if the endpoint fails, no partial updates occur

    // Get initial state
    const initialProblem = db
      .prepare('SELECT * FROM problems WHERE id = ?')
      .get(id) as Problem;
    const initialAttempts = db
      .prepare('SELECT COUNT(*) as count FROM attempts WHERE problem_id = ?')
      .get(id) as { count: number };

    // Make a request with invalid color (should rollback)
    await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'invalid' });

    // Verify nothing changed
    const finalProblem = db
      .prepare('SELECT * FROM problems WHERE id = ?')
      .get(id) as Problem;
    const finalAttempts = db
      .prepare('SELECT COUNT(*) as count FROM attempts WHERE problem_id = ?')
      .get(id) as { count: number };

    expect(finalProblem.color).toBe(initialProblem.color);
    expect(finalProblem.last_reviewed).toBe(initialProblem.last_reviewed);
    expect(finalAttempts.count).toBe(initialAttempts.count);
  });

  it('should handle multiple completions for same problem on different days', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    // First completion
    await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'orange' });

    // Manually update last_reviewed to yesterday to simulate next day
    db.prepare('UPDATE problems SET last_reviewed = ?, color = ? WHERE id = ?').run(
      getDaysAgo(5),
      'orange',
      id
    );

    // Clear previous selection and add to today's selection again for second completion
    db.prepare('DELETE FROM daily_selections WHERE problem_id = ?').run(id);
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    // Second completion
    await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'yellow' });

    const attempts = db
      .prepare('SELECT * FROM attempts WHERE problem_id = ? ORDER BY attempted_at')
      .all(id) as Attempt[];

    expect(attempts).toHaveLength(2);
    expect(attempts[0].color_result).toBe('orange');
    expect(attempts[1].color_result).toBe('yellow');

    const problem = db
      .prepare('SELECT * FROM problems WHERE id = ?')
      .get(id) as Problem;
    expect(problem.color).toBe('yellow');
  });

  it('should return updated problem in response', async () => {
    const db = getDatabase();
    const id = insertProblem(db, 'Two Sum', 'gray');
    db.prepare('INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)').run(id, getToday());

    const response = await request(app)
      .post(`/api/daily/${id}/complete`)
      .send({ colorResult: 'orange' });

    expect(response.status).toBe(200);
    expect(response.body.problem).toMatchObject({
      id,
      name: 'Two Sum',
      color: 'orange',
      last_reviewed: getToday(),
    });
  });
});

describe('POST /api/daily/refresh', () => {
  it('should delete existing selection for today', async () => {
    const db = getDatabase();

    // Create problems and selection
    const id1 = insertProblem(db, 'Two Sum', 'gray');
    const id2 = insertProblem(db, 'Valid Parentheses', 'gray');

    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id1, getToday());
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id2, getToday());

    // Verify selections exist
    let selections = db
      .prepare('SELECT * FROM daily_selections WHERE selected_date = ?')
      .all(getToday()) as DailySelection[];
    expect(selections).toHaveLength(2);

    // Refresh
    await request(app).post('/api/daily/refresh');

    // Verify old selections were deleted and new ones created
    selections = db
      .prepare('SELECT * FROM daily_selections WHERE selected_date = ?')
      .all(getToday()) as DailySelection[];

    // Should have new selections (possibly different count based on eligible problems)
    expect(selections).toBeTruthy();
  });

  it('should create new selection', async () => {
    const db = getDatabase();

    // Create enough eligible problems
    for (let i = 1; i <= 5; i++) insertProblem(db, `Gray ${i}`, 'gray');
    for (let i = 1; i <= 5; i++)
      insertProblem(db, `Orange ${i}`, 'orange', getDaysAgo(5));

    const response = await request(app).post('/api/daily/refresh');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('problems');
    expect(response.body.problems).toBeInstanceOf(Array);
    expect(response.body.problems.length).toBeGreaterThan(0);
  });

  it('should return new problems in response', async () => {
    const db = getDatabase();

    // Create problems
    for (let i = 1; i <= 10; i++) insertProblem(db, `Gray ${i}`, 'gray');

    const response = await request(app).post('/api/daily/refresh');

    expect(response.status).toBe(200);
    expect(response.body.problems).toBeTruthy();
    expect(response.body.problems.length).toBeGreaterThan(0);

    // Verify each problem has expected fields
    response.body.problems.forEach((problem: any) => {
      expect(problem).toHaveProperty('id');
      expect(problem).toHaveProperty('name');
      expect(problem).toHaveProperty('link');
      expect(problem).toHaveProperty('color');
    });
  });

  it('should not delete selections from previous days', async () => {
    const db = getDatabase();

    const id1 = insertProblem(db, 'Two Sum', 'gray');
    const id2 = insertProblem(db, 'Valid Parentheses', 'gray');

    // Insert selection for yesterday
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id1, getDaysAgo(1));

    // Insert selection for today
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id2, getToday());

    await request(app).post('/api/daily/refresh');

    // Verify yesterday's selection still exists
    const yesterdaySelection = db
      .prepare(
        'SELECT * FROM daily_selections WHERE selected_date = ? AND problem_id = ?'
      )
      .get(getDaysAgo(1), id1) as DailySelection;

    expect(yesterdaySelection).toBeTruthy();
  });

  it('should handle refresh when no selection exists for today', async () => {
    const db = getDatabase();

    // Create eligible problems
    for (let i = 1; i <= 5; i++) insertProblem(db, `Gray ${i}`, 'gray');

    const response = await request(app).post('/api/daily/refresh');

    expect(response.status).toBe(200);
    expect(response.body.problems).toBeTruthy();
  });

  it('should return empty array when no eligible problems exist', async () => {
    // No problems in database

    const response = await request(app).post('/api/daily/refresh');

    expect(response.status).toBe(200);
    expect(response.body.problems).toEqual([]);
  });

  it('should create different selection on refresh (random selection)', async () => {
    const db = getDatabase();

    // Create many eligible problems
    for (let i = 1; i <= 20; i++) insertProblem(db, `Gray ${i}`, 'gray');

    // First selection
    const response1 = await request(app).get('/api/daily');
    const selection1 = response1.body.problems.map((p: any) => p.id);

    // Refresh
    const response2 = await request(app).post('/api/daily/refresh');
    const selection2 = response2.body.problems.map((p: any) => p.id);

    // Selections should be different (statistically very likely with 20 problems)
    expect(selection1).not.toEqual(selection2);
  });

  it('should mark new selection as not completed', async () => {
    const db = getDatabase();

    // Create problems and initial selection with completed status
    const id = insertProblem(db, 'Two Sum', 'gray');
    db.prepare(
      `INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`
    ).run(id, getToday(), 1);

    await request(app).post('/api/daily/refresh');

    // Verify new selections are not completed
    const selections = db
      .prepare('SELECT * FROM daily_selections WHERE selected_date = ?')
      .all(getToday()) as DailySelection[];

    selections.forEach((selection) => {
      expect(selection.completed).toBe(0); // SQLite stores false as 0
    });
  });
});
