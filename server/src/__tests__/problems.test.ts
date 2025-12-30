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
