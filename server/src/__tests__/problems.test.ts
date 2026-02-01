/**
 * Tests for Problems API endpoints
 *
 * Covers:
 * - GET /api/problems - List all problems with filtering
 * - POST /api/problems - Create a single problem
 * - POST /api/problems/import - Import from CSV
 * - GET /api/problems/:id - Get single problem with attempts
 * - PATCH /api/problems/:id - Update a problem
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { initializeDatabase, closeDatabase, getDatabase } from '../db/index.js';
import type { Problem } from '../db/types.js';

// Use in-memory database for tests
beforeEach(() => {
  initializeDatabase(':memory:');
});

afterAll(() => {
  closeDatabase();
});

describe('GET /api/problems', () => {
  it('returns empty array when no problems exist', async () => {
    const response = await request(app).get('/api/problems');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns all problems ordered by creation date (newest first)', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, created_at) VALUES (?, ?, ?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum',
      'gray',
      '2024-01-01T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO problems (name, link, color, created_at) VALUES (?, ?, ?, ?)`).run(
      'Valid Parentheses',
      'https://leetcode.com/problems/valid-parentheses',
      'yellow',
      '2024-01-02T10:00:00.000Z'
    );

    const response = await request(app).get('/api/problems');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    // Newest first (Valid Parentheses was inserted second)
    expect(response.body[0].name).toBe('Valid Parentheses');
    expect(response.body[1].name).toBe('Two Sum');
  });

  it('filters problems by color', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, created_at) VALUES (?, ?, ?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum',
      'gray',
      '2024-01-01T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO problems (name, link, color, created_at) VALUES (?, ?, ?, ?)`).run(
      'Valid Parentheses',
      'https://leetcode.com/problems/valid-parentheses',
      'yellow',
      '2024-01-02T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO problems (name, link, color, created_at) VALUES (?, ?, ?, ?)`).run(
      'Merge Intervals',
      'https://leetcode.com/problems/merge-intervals',
      'yellow',
      '2024-01-03T10:00:00.000Z'
    );

    const response = await request(app).get('/api/problems?color=yellow');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toBe('Merge Intervals');
    expect(response.body[1].name).toBe('Valid Parentheses');
  });

  it('searches problems by name (case-insensitive partial match)', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum',
      'gray'
    );
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Three Sum',
      'https://leetcode.com/problems/three-sum',
      'yellow'
    );
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Valid Parentheses',
      'https://leetcode.com/problems/valid-parentheses',
      'yellow'
    );

    const response = await request(app).get('/api/problems?search=sum');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((p: Problem) => p.name)).toContain('Two Sum');
    expect(response.body.map((p: Problem) => p.name)).toContain('Three Sum');
  });

  it('combines color filter and search', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum',
      'gray'
    );
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Three Sum',
      'https://leetcode.com/problems/three-sum',
      'yellow'
    );
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Four Sum',
      'https://leetcode.com/problems/four-sum',
      'yellow'
    );

    const response = await request(app).get('/api/problems?color=yellow&search=three');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Three Sum');
  });

  it('returns 400 for invalid color parameter', async () => {
    const response = await request(app).get('/api/problems?color=invalid');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid color parameter');
  });
});

describe('POST /api/problems', () => {
  it('creates a problem with required fields only', async () => {
    const response = await request(app)
      .post('/api/problems')
      .send({
        name: 'Two Sum',
        link: 'https://leetcode.com/problems/two-sum',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      name: 'Two Sum',
      link: 'https://leetcode.com/problems/two-sum',
      color: 'gray', // Default color
      key_insight: null,
      last_reviewed: null,
      created_at: expect.any(String),
    });
  });

  it('creates a problem with all optional fields', async () => {
    const response = await request(app)
      .post('/api/problems')
      .send({
        name: 'Valid Parentheses',
        link: 'https://leetcode.com/problems/valid-parentheses',
        color: 'yellow',
        key_insight: 'Use a stack for matching',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Valid Parentheses',
      color: 'yellow',
      key_insight: 'Use a stack for matching',
    });
  });

  it('trims whitespace from name and link', async () => {
    const response = await request(app)
      .post('/api/problems')
      .send({
        name: '  Two Sum  ',
        link: '  https://leetcode.com/problems/two-sum  ',
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Two Sum');
    expect(response.body.link).toBe('https://leetcode.com/problems/two-sum');
  });

  it('returns 400 when name is missing', async () => {
    const response = await request(app)
      .post('/api/problems')
      .send({
        link: 'https://leetcode.com/problems/two-sum',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Name and link are required');
  });

  it('returns 400 when link is missing', async () => {
    const response = await request(app)
      .post('/api/problems')
      .send({
        name: 'Two Sum',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Name and link are required');
  });

  it('returns 400 when name is empty after trimming', async () => {
    const response = await request(app)
      .post('/api/problems')
      .send({
        name: '   ',
        link: 'https://leetcode.com/problems/two-sum',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('cannot be empty');
  });

  it('returns 400 for invalid color', async () => {
    const response = await request(app)
      .post('/api/problems')
      .send({
        name: 'Two Sum',
        link: 'https://leetcode.com/problems/two-sum',
        color: 'invalid',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Color must be one of');
  });

  it('returns 400 for invalid URL format', async () => {
    const response = await request(app)
      .post('/api/problems')
      .send({
        name: 'Two Sum',
        link: 'not-a-url',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('valid URL');
  });

  it('returns 400 for non-HTTP/HTTPS URL', async () => {
    const response = await request(app)
      .post('/api/problems')
      .send({
        name: 'Two Sum',
        link: 'ftp://example.com',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('HTTP or HTTPS URL');
  });

  it('returns 409 for duplicate link', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );

    const response = await request(app)
      .post('/api/problems')
      .send({
        name: 'Two Sum Duplicate',
        link: 'https://leetcode.com/problems/two-sum',
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('already exists');
  });
});

describe('POST /api/problems/import', () => {
  it('imports valid CSV with all fields', async () => {
    const csv = `Problem,Link,Color,LastReviewed,KeyInsight
Two Sum,https://leetcode.com/problems/two-sum,gray,,Use hash map
Valid Parentheses,https://leetcode.com/problems/valid-parentheses,yellow,2024-01-15,Use a stack`;

    const response = await request(app)
      .post('/api/problems/import')
      .set('Content-Type', 'text/csv')
      .send(csv);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      imported: 2,
      duplicates: 0,
      errors: [],
    });

    // Verify problems were inserted
    const db = getDatabase();
    const problems = db.prepare('SELECT * FROM problems').all() as Problem[];
    expect(problems).toHaveLength(2);
  });

  it('imports CSV with minimal required fields', async () => {
    const csv = `Problem,Link,Color,LastReviewed,KeyInsight
Two Sum,https://leetcode.com/problems/two-sum,,,`;

    const response = await request(app)
      .post('/api/problems/import')
      .set('Content-Type', 'text/csv')
      .send(csv);

    expect(response.status).toBe(200);
    expect(response.body.imported).toBe(1);
    expect(response.body.errors).toHaveLength(0);

    const db = getDatabase();
    const problem = db.prepare('SELECT * FROM problems WHERE id = 1').get() as Problem;
    expect(problem.color).toBe('gray'); // Default color
    expect(problem.key_insight).toBe(null);
    expect(problem.last_reviewed).toBe(null);
  });

  it('skips duplicate links and reports them', async () => {
    // Insert existing problem
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );

    const csv = `Problem,Link,Color,LastReviewed,KeyInsight
Two Sum,https://leetcode.com/problems/two-sum,,,
Valid Parentheses,https://leetcode.com/problems/valid-parentheses,,,`;

    const response = await request(app)
      .post('/api/problems/import')
      .set('Content-Type', 'text/csv')
      .send(csv);

    expect(response.status).toBe(200);
    expect(response.body.imported).toBe(1); // Only Valid Parentheses
    expect(response.body.duplicates).toBe(1); // Two Sum was duplicate
  });

  it('reports CSV parsing errors', async () => {
    const csv = `Problem,Link,Color,LastReviewed,KeyInsight
,https://leetcode.com/problems/two-sum,,,
Valid Parentheses,,,,`;

    const response = await request(app)
      .post('/api/problems/import')
      .set('Content-Type', 'text/csv')
      .send(csv);

    expect(response.status).toBe(200);
    expect(response.body.imported).toBe(0);
    expect(response.body.errors).toHaveLength(2);
    expect(response.body.errors[0].row).toBe(2);
    expect(response.body.errors[0].error).toContain('name is required');
    expect(response.body.errors[1].row).toBe(3);
    expect(response.body.errors[1].error).toContain('Link is required');
  });

  it('handles empty CSV', async () => {
    const response = await request(app)
      .post('/api/problems/import')
      .set('Content-Type', 'text/csv')
      .send('');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      imported: 0,
      duplicates: 0,
      errors: [],
    });
  });

  it('returns 400 for invalid request body format', async () => {
    const response = await request(app)
      .post('/api/problems/import')
      .send({ invalid: 'format' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('CSV content as string');
  });
});

describe('GET /api/problems/:id', () => {
  it('returns problem with empty attempts array', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );

    const response = await request(app).get(`/api/problems/${result.lastInsertRowid}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: result.lastInsertRowid,
      name: 'Two Sum',
      link: 'https://leetcode.com/problems/two-sum',
      attempts: [],
    });
  });

  it('returns problem with attempts ordered by date (newest first)', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    // Insert attempts
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId,
      'orange',
      '2024-01-01T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId,
      'yellow',
      '2024-01-02T10:00:00.000Z'
    );

    const response = await request(app).get(`/api/problems/${problemId}`);

    expect(response.status).toBe(200);
    expect(response.body.attempts).toHaveLength(2);
    // Newest first
    expect(response.body.attempts[0].color_result).toBe('yellow');
    expect(response.body.attempts[1].color_result).toBe('orange');
  });

  it('returns 404 for non-existent problem', async () => {
    const response = await request(app).get('/api/problems/999');

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('not found');
  });

  it('returns 400 for invalid ID format', async () => {
    const response = await request(app).get('/api/problems/invalid');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('must be a number');
  });
});

describe('PATCH /api/problems/:id', () => {
  it('updates problem name', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ name: 'Two Sum II' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Two Sum II');
  });

  it('updates problem color', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ color: 'yellow' });

    expect(response.status).toBe(200);
    expect(response.body.color).toBe('yellow');
  });

  it('updates problem key_insight', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ key_insight: 'Use hash map for O(n) solution' });

    expect(response.status).toBe(200);
    expect(response.body.key_insight).toBe('Use hash map for O(n) solution');
  });

  it('updates problem last_reviewed', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ last_reviewed: '2024-01-15' });

    expect(response.status).toBe(200);
    expect(response.body.last_reviewed).toBe('2024-01-15');
  });

  it('updates multiple fields at once', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({
        color: 'green',
        key_insight: 'Mastered!',
        last_reviewed: '2024-01-20',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      color: 'green',
      key_insight: 'Mastered!',
      last_reviewed: '2024-01-20',
    });
  });

  it('clears key_insight when set to empty string', async () => {
    const db = getDatabase();
    const result = db
      .prepare(`INSERT INTO problems (name, link, key_insight) VALUES (?, ?, ?)`)
      .run('Two Sum', 'https://leetcode.com/problems/two-sum', 'Old insight');
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ key_insight: '' });

    expect(response.status).toBe(200);
    expect(response.body.key_insight).toBe(null);
  });

  it('returns 404 for non-existent problem', async () => {
    const response = await request(app)
      .patch('/api/problems/999')
      .send({ color: 'yellow' });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('not found');
  });

  it('returns 400 for invalid ID format', async () => {
    const response = await request(app)
      .patch('/api/problems/invalid')
      .send({ color: 'yellow' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('must be a number');
  });

  it('returns 400 when no fields provided', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app).patch(`/api/problems/${problemId}`).send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('At least one field');
  });

  it('returns 400 for invalid color', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ color: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Color must be one of');
  });

  it('returns 400 for empty name', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ name: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('non-empty string');
  });

  it('returns 400 for invalid last_reviewed date format', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ last_reviewed: '01/15/2024' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('ISO format');
  });

  it('returns 409 when updating link to duplicate', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Valid Parentheses',
      'https://leetcode.com/problems/valid-parentheses'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ link: 'https://leetcode.com/problems/two-sum' });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('already exists');
  });

  it('allows updating link to same value (no duplicate error)', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app)
      .patch(`/api/problems/${problemId}`)
      .send({ link: 'https://leetcode.com/problems/two-sum' });

    expect(response.status).toBe(200);
  });
});

describe('GET /api/problems/export', () => {
  it('returns 200 with CSV content-type header', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum',
      'gray'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
  });

  it('returns CSV with correct Content-Disposition header with date-stamped filename', async () => {
    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toMatch(/^attachment; filename="leetcode-problems-\d{4}-\d{2}-\d{2}\.csv"$/);
  });

  it('returns headers only when database is empty', async () => {
    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Problem,Link,Color,LastReviewed,KeyInsight\n');
  });

  it('exports single problem with all fields', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, key_insight, last_reviewed) VALUES (?, ?, ?, ?, ?)`).run(
      'Valid Parentheses',
      'https://leetcode.com/problems/valid-parentheses',
      'yellow',
      'Use a stack',
      '2024-01-15'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const lines = response.text.split('\n');
    expect(lines[0]).toBe('Problem,Link,Color,LastReviewed,KeyInsight');
    expect(lines[1]).toBe('Valid Parentheses,https://leetcode.com/problems/valid-parentheses,yellow,2024-01-15,Use a stack');
  });

  it('exports single problem with null key_insight and last_reviewed', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum',
      'gray'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const lines = response.text.split('\n');
    expect(lines[1]).toBe('Two Sum,https://leetcode.com/problems/two-sum,gray,,');
  });

  it('exports multiple problems with various data', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, created_at) VALUES (?, ?, ?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum',
      'gray',
      '2024-01-01T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO problems (name, link, color, key_insight, last_reviewed, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'Valid Parentheses',
      'https://leetcode.com/problems/valid-parentheses',
      'yellow',
      'Use a stack',
      '2024-01-15',
      '2024-01-02T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO problems (name, link, color, key_insight, last_reviewed, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'Merge Intervals',
      'https://leetcode.com/problems/merge-intervals',
      'green',
      'Sort by start time',
      '2024-01-20',
      '2024-01-03T10:00:00.000Z'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const lines = response.text.split('\n').filter(line => line.length > 0);
    expect(lines).toHaveLength(4); // 1 header + 3 data rows
    expect(lines[0]).toBe('Problem,Link,Color,LastReviewed,KeyInsight');
    // Problems should be ordered by creation date (newest first)
    expect(lines[1]).toContain('Merge Intervals');
    expect(lines[2]).toContain('Valid Parentheses');
    expect(lines[3]).toContain('Two Sum');
  });

  it('exports problems with proper CSV escaping for quotes', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, key_insight) VALUES (?, ?, ?, ?)`).run(
      'Find "Best" Solution',
      'https://leetcode.com/problems/test',
      'gray',
      'Use "dynamic programming"'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const text = response.text;
    // Quotes should be escaped by doubling them
    expect(text).toContain('"Find ""Best"" Solution"');
    expect(text).toContain('"Use ""dynamic programming"""');
  });

  it('exports problems with proper CSV escaping for commas', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, key_insight) VALUES (?, ?, ?, ?)`).run(
      'Problem A, B, C',
      'https://leetcode.com/problems/test',
      'gray',
      'Use arrays, maps, and sets'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const text = response.text;
    // Fields with commas should be wrapped in quotes
    expect(text).toContain('"Problem A, B, C"');
    expect(text).toContain('"Use arrays, maps, and sets"');
  });

  it('exports problems with proper CSV escaping for newlines', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, key_insight) VALUES (?, ?, ?, ?)`).run(
      'Multi\nLine\nName',
      'https://leetcode.com/problems/test',
      'gray',
      'Step 1: Sort\nStep 2: Iterate'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const text = response.text;
    // Fields with newlines should be wrapped in quotes
    expect(text).toContain('"Multi\nLine\nName"');
    expect(text).toContain('"Step 1: Sort\nStep 2: Iterate"');
  });

  it('prevents CSV injection by prefixing formulas with single quote', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, key_insight) VALUES (?, ?, ?, ?)`).run(
      '=SUM(A1:A10)',
      'https://leetcode.com/problems/test1',
      'gray',
      null
    );
    db.prepare(`INSERT INTO problems (name, link, color, key_insight) VALUES (?, ?, ?, ?)`).run(
      'Normal Name',
      'https://leetcode.com/problems/test2',
      'gray',
      '+2+2'
    );
    db.prepare(`INSERT INTO problems (name, link, color, key_insight) VALUES (?, ?, ?, ?)`).run(
      '-1234',
      'https://leetcode.com/problems/test3',
      'gray',
      null
    );
    db.prepare(`INSERT INTO problems (name, link, color, key_insight) VALUES (?, ?, ?, ?)`).run(
      'Safe Name',
      'https://leetcode.com/problems/test4',
      'gray',
      '@IMPORTDATA("malicious.com")'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const text = response.text;
    // Formulas should be prefixed with single quote
    expect(text).toContain("'=SUM(A1:A10)");
    expect(text).toContain("'+2+2");
    expect(text).toContain("'-1234");
    expect(text).toContain("'@IMPORTDATA");
  });

  it('exports all color types correctly', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Gray Problem',
      'https://leetcode.com/problems/gray',
      'gray'
    );
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Orange Problem',
      'https://leetcode.com/problems/orange',
      'orange'
    );
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Yellow Problem',
      'https://leetcode.com/problems/yellow',
      'yellow'
    );
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Green Problem',
      'https://leetcode.com/problems/green',
      'green'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const text = response.text;
    expect(text).toContain(',gray,');
    expect(text).toContain(',orange,');
    expect(text).toContain(',yellow,');
    expect(text).toContain(',green,');
  });

  it('returns 500 on database error', async () => {
    // Close the database to force an error
    closeDatabase();

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal Server Error');
    expect(response.body.message).toContain('Failed to export problems');

    // Reinitialize the database for subsequent tests
    initializeDatabase(':memory:');
  });

  it('exports problems in correct creation date order (newest first)', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, created_at) VALUES (?, ?, ?, ?)`).run(
      'First Problem',
      'https://leetcode.com/problems/first',
      'gray',
      '2024-01-01T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO problems (name, link, color, created_at) VALUES (?, ?, ?, ?)`).run(
      'Second Problem',
      'https://leetcode.com/problems/second',
      'gray',
      '2024-01-02T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO problems (name, link, color, created_at) VALUES (?, ?, ?, ?)`).run(
      'Third Problem',
      'https://leetcode.com/problems/third',
      'gray',
      '2024-01-03T10:00:00.000Z'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const lines = response.text.split('\n').filter(line => line.length > 0);
    // Newest first
    expect(lines[1]).toContain('Third Problem');
    expect(lines[2]).toContain('Second Problem');
    expect(lines[3]).toContain('First Problem');
  });

  it('handles empty string key_insight correctly', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color, key_insight) VALUES (?, ?, ?, ?)`).run(
      'Test Problem',
      'https://leetcode.com/problems/test',
      'gray',
      ''
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    const lines = response.text.split('\n');
    // Empty string should result in empty CSV field
    expect(lines[1]).toBe('Test Problem,https://leetcode.com/problems/test,gray,,');
  });

  it('handles very long field values', async () => {
    const db = getDatabase();
    const longName = 'A'.repeat(500);
    const longUrl = 'https://leetcode.com/problems/' + 'a'.repeat(2000);
    const longInsight = 'This is a very detailed insight. '.repeat(100);

    db.prepare(`INSERT INTO problems (name, link, color, key_insight) VALUES (?, ?, ?, ?)`).run(
      longName,
      longUrl,
      'gray',
      longInsight
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    expect(response.text).toContain(longName);
    expect(response.text).toContain(longUrl);
    expect(response.text).toContain(longInsight);
  });

  it('returns CSV ending with newline', async () => {
    const db = getDatabase();
    db.prepare(`INSERT INTO problems (name, link, color) VALUES (?, ?, ?)`).run(
      'Test',
      'https://leetcode.com/problems/test',
      'gray'
    );

    const response = await request(app).get('/api/problems/export');

    expect(response.status).toBe(200);
    expect(response.text.endsWith('\n')).toBe(true);
  });
});

describe('DELETE /api/problems/:id', () => {
  it('returns 204 No Content on successful deletion', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app).delete(`/api/problems/${problemId}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    // Verify problem was deleted
    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
    expect(problem).toBeUndefined();
  });

  it('cascades deletion to attempts table', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    // Insert attempts for this problem
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId,
      'orange',
      '2024-01-01T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId,
      'yellow',
      '2024-01-02T10:00:00.000Z'
    );

    // Verify attempts exist before deletion
    const attemptsBefore = db.prepare('SELECT * FROM attempts WHERE problem_id = ?').all(problemId);
    expect(attemptsBefore).toHaveLength(2);

    const response = await request(app).delete(`/api/problems/${problemId}`);

    expect(response.status).toBe(204);

    // Verify attempts were deleted
    const attemptsAfter = db.prepare('SELECT * FROM attempts WHERE problem_id = ?').all(problemId);
    expect(attemptsAfter).toHaveLength(0);
  });

  it('cascades deletion to daily_selections table', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    // Insert daily_selections for this problem
    db.prepare(`INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`).run(
      problemId,
      '2024-01-01',
      0
    );
    db.prepare(`INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`).run(
      problemId,
      '2024-01-02',
      1
    );

    // Verify daily_selections exist before deletion
    const selectionsBefore = db.prepare('SELECT * FROM daily_selections WHERE problem_id = ?').all(problemId);
    expect(selectionsBefore).toHaveLength(2);

    const response = await request(app).delete(`/api/problems/${problemId}`);

    expect(response.status).toBe(204);

    // Verify daily_selections were deleted
    const selectionsAfter = db.prepare('SELECT * FROM daily_selections WHERE problem_id = ?').all(problemId);
    expect(selectionsAfter).toHaveLength(0);
  });

  it('cascades deletion to both attempts and daily_selections', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    // Insert attempts
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId,
      'orange',
      '2024-01-01T10:00:00.000Z'
    );

    // Insert daily_selections
    db.prepare(`INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`).run(
      problemId,
      '2024-01-01',
      1
    );

    const response = await request(app).delete(`/api/problems/${problemId}`);

    expect(response.status).toBe(204);

    // Verify all related data was deleted
    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
    const attempts = db.prepare('SELECT * FROM attempts WHERE problem_id = ?').all(problemId);
    const selections = db.prepare('SELECT * FROM daily_selections WHERE problem_id = ?').all(problemId);

    expect(problem).toBeUndefined();
    expect(attempts).toHaveLength(0);
    expect(selections).toHaveLength(0);
  });

  it('returns 404 when problem does not exist', async () => {
    const response = await request(app).delete('/api/problems/999');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
    expect(response.body.message).toContain('not found');
  });

  it('returns 400 when ID is invalid (not a number)', async () => {
    const response = await request(app).delete('/api/problems/invalid');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
    expect(response.body.message).toContain('must be a number');
  });

  it('returns 404 when ID contains decimal (parseInt parses as integer)', async () => {
    // parseInt('1.5', 10) returns 1, which is valid but problem won't exist
    const response = await request(app).delete('/api/problems/1.5');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
    expect(response.body.message).toContain('not found');
  });

  it('deletes problem that is in today\'s daily selection', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Insert into today's daily selection
    db.prepare(`INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`).run(
      problemId,
      today,
      0
    );

    const response = await request(app).delete(`/api/problems/${problemId}`);

    expect(response.status).toBe(204);

    // Verify problem and daily selection were deleted
    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
    const selection = db.prepare('SELECT * FROM daily_selections WHERE problem_id = ? AND selected_date = ?').get(
      problemId,
      today
    );

    expect(problem).toBeUndefined();
    expect(selection).toBeUndefined();
  });

  it('does not affect other problems when deleting one', async () => {
    const db = getDatabase();
    const result1 = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId1 = result1.lastInsertRowid as number;

    const result2 = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Valid Parentheses',
      'https://leetcode.com/problems/valid-parentheses'
    );
    const problemId2 = result2.lastInsertRowid as number;

    // Add attempts for both problems
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId1,
      'orange',
      '2024-01-01T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId2,
      'yellow',
      '2024-01-02T10:00:00.000Z'
    );

    // Delete first problem
    const response = await request(app).delete(`/api/problems/${problemId1}`);

    expect(response.status).toBe(204);

    // Verify first problem and its attempts are deleted
    const problem1 = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId1);
    const attempts1 = db.prepare('SELECT * FROM attempts WHERE problem_id = ?').all(problemId1);
    expect(problem1).toBeUndefined();
    expect(attempts1).toHaveLength(0);

    // Verify second problem and its attempts still exist
    const problem2 = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId2);
    const attempts2 = db.prepare('SELECT * FROM attempts WHERE problem_id = ?').all(problemId2);
    expect(problem2).toBeDefined();
    expect(attempts2).toHaveLength(1);
  });

  it('handles deletion of problem with no attempts or daily_selections', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    const response = await request(app).delete(`/api/problems/${problemId}`);

    expect(response.status).toBe(204);

    // Verify problem was deleted
    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
    expect(problem).toBeUndefined();
  });

  it('uses transaction for atomic deletion (all or nothing)', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    // Insert attempts and daily_selections
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId,
      'orange',
      '2024-01-01T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`).run(
      problemId,
      '2024-01-01',
      0
    );

    // Store counts before deletion
    const problemsBefore = db.prepare('SELECT COUNT(*) as count FROM problems').get() as { count: number };
    const attemptsBefore = db.prepare('SELECT COUNT(*) as count FROM attempts').get() as { count: number };
    const selectionsBefore = db.prepare('SELECT COUNT(*) as count FROM daily_selections').get() as { count: number };

    const response = await request(app).delete(`/api/problems/${problemId}`);

    expect(response.status).toBe(204);

    // Verify all deletions occurred
    const problemsAfter = db.prepare('SELECT COUNT(*) as count FROM problems').get() as { count: number };
    const attemptsAfter = db.prepare('SELECT COUNT(*) as count FROM attempts').get() as { count: number };
    const selectionsAfter = db.prepare('SELECT COUNT(*) as count FROM daily_selections').get() as { count: number };

    expect(problemsAfter.count).toBe(problemsBefore.count - 1);
    expect(attemptsAfter.count).toBe(attemptsBefore.count - 1);
    expect(selectionsAfter.count).toBe(selectionsBefore.count - 1);
  });

  it('deletes problem with multiple attempts and daily_selections across different dates', async () => {
    const db = getDatabase();
    const result = db.prepare(`INSERT INTO problems (name, link) VALUES (?, ?)`).run(
      'Two Sum',
      'https://leetcode.com/problems/two-sum'
    );
    const problemId = result.lastInsertRowid as number;

    // Insert multiple attempts
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId,
      'orange',
      '2024-01-01T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId,
      'yellow',
      '2024-01-02T10:00:00.000Z'
    );
    db.prepare(`INSERT INTO attempts (problem_id, color_result, attempted_at) VALUES (?, ?, ?)`).run(
      problemId,
      'green',
      '2024-01-03T10:00:00.000Z'
    );

    // Insert multiple daily_selections
    db.prepare(`INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`).run(
      problemId,
      '2024-01-01',
      1
    );
    db.prepare(`INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`).run(
      problemId,
      '2024-01-02',
      1
    );
    db.prepare(`INSERT INTO daily_selections (problem_id, selected_date, completed) VALUES (?, ?, ?)`).run(
      problemId,
      '2024-01-03',
      0
    );

    // Verify data exists before deletion
    const attemptsBefore = db.prepare('SELECT * FROM attempts WHERE problem_id = ?').all(problemId);
    const selectionsBefore = db.prepare('SELECT * FROM daily_selections WHERE problem_id = ?').all(problemId);
    expect(attemptsBefore).toHaveLength(3);
    expect(selectionsBefore).toHaveLength(3);

    const response = await request(app).delete(`/api/problems/${problemId}`);

    expect(response.status).toBe(204);

    // Verify all related data was deleted
    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
    const attemptsAfter = db.prepare('SELECT * FROM attempts WHERE problem_id = ?').all(problemId);
    const selectionsAfter = db.prepare('SELECT * FROM daily_selections WHERE problem_id = ?').all(problemId);

    expect(problem).toBeUndefined();
    expect(attemptsAfter).toHaveLength(0);
    expect(selectionsAfter).toHaveLength(0);
  });
});
