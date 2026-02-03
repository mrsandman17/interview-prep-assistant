/**
 * Problems API Routes
 *
 * Endpoints:
 * - GET    /api/problems         - List all problems (with optional filtering)
 * - POST   /api/problems         - Create a single problem
 * - POST   /api/problems/import  - Import problems from CSV
 * - GET    /api/problems/:id     - Get single problem with attempt history
 * - PATCH  /api/problems/:id     - Update a problem
 * - DELETE /api/problems/:id     - Delete a problem and all related data
 */

import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/index.js';
import type { Problem, ProblemColor, Attempt, AttemptColorResult } from '../db/types.js';
import { updateProblemReview } from './daily.js';
import type {
  CreateProblemRequest,
  UpdateProblemRequest,
  ProblemWithAttempts,
  ProblemWithAttemptCount,
  GetProblemsQuery,
  ImportResult,
} from './api-types.js';
import { parseCSV } from '../services/csv-parser.js';
import { generateCSV } from '../services/csv-generator.js';

export const problemsRouter = Router();

/**
 * Type for valid SQLite parameter values
 */
type SQLiteParameter = string | number | null | Buffer;

/**
 * Input validation constants
 */
const MAX_NAME_LENGTH = 500;
const MAX_URL_LENGTH = 2048;
const MAX_INSIGHT_LENGTH = 5000;

/**
 * GET /api/problems
 * List all problems with optional filtering
 *
 * Query parameters:
 * - color: Filter by problem color (gray, orange, yellow, green)
 * - search: Search by problem name (case-insensitive partial match)
 *
 * @returns {ProblemWithAttemptCount[]} Array of problems with attempt counts
 */
problemsRouter.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { color, search } = req.query as GetProblemsQuery;

    let query = `
      SELECT
        p.*,
        p.review_count as reviewCount,
        COUNT(a.id) as attemptCount
      FROM problems p
      LEFT JOIN attempts a ON p.id = a.problem_id
      WHERE 1=1
    `;
    const params: SQLiteParameter[] = [];

    // Add color filter if provided
    if (color) {
      // Validate color
      const validColors: ProblemColor[] = ['gray', 'orange', 'yellow', 'green'];
      if (!validColors.includes(color)) {
        res.status(400).json({
          error: 'Invalid color parameter',
          message: 'Color must be one of: gray, orange, yellow, green',
        });
        return;
      }
      query += ' AND p.color = ?';
      params.push(color);
    }

    // Add search filter if provided
    if (search) {
      // Escape SQL LIKE special characters to prevent SQL injection
      const escapedSearch = search.replace(/[%_\\]/g, '\\$&');
      query += ' AND p.name LIKE ? ESCAPE ?';
      params.push(`%${escapedSearch}%`, '\\');
    }

    // Group by problem and order by creation date (newest first)
    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const stmt = db.prepare(query);
    const problems = stmt.all(...params) as ProblemWithAttemptCount[];

    res.status(200).json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch problems',
    });
  }
});

/**
 * POST /api/problems
 * Create a single problem
 *
 * Request body:
 * {
 *   name: string,
 *   link: string,
 *   color?: ProblemColor,
 *   key_insight?: string
 * }
 *
 * @returns {Problem} The created problem
 */
problemsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { name, link, color, key_insight } = req.body as CreateProblemRequest;

    // Validate required fields
    if (!name || !link) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name and link are required',
      });
      return;
    }

    // Validate name and link types
    if (typeof name !== 'string' || typeof link !== 'string') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name and link must be strings',
      });
      return;
    }

    // Trim inputs
    const trimmedName = name.trim();
    const trimmedLink = link.trim();

    if (!trimmedName || !trimmedLink) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name and link cannot be empty',
      });
      return;
    }

    // Validate field lengths
    if (trimmedName.length > MAX_NAME_LENGTH) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Name exceeds maximum length of ${MAX_NAME_LENGTH} characters`,
      });
      return;
    }

    if (trimmedLink.length > MAX_URL_LENGTH) {
      res.status(400).json({
        error: 'Validation Error',
        message: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters`,
      });
      return;
    }

    if (key_insight && key_insight.length > MAX_INSIGHT_LENGTH) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Key insight exceeds maximum length of ${MAX_INSIGHT_LENGTH} characters`,
      });
      return;
    }

    // Validate color if provided
    if (color) {
      const validColors: ProblemColor[] = ['gray', 'orange', 'yellow', 'green'];
      if (!validColors.includes(color)) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Color must be one of: gray, orange, yellow, green',
        });
        return;
      }
    }

    // Validate URL format
    try {
      const url = new URL(trimmedLink);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Link must be a valid HTTP or HTTPS URL',
        });
        return;
      }
    } catch {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Link must be a valid URL',
      });
      return;
    }

    const db = getDatabase();

    // Check for duplicate link
    const checkStmt = db.prepare('SELECT id FROM problems WHERE link = ?');
    const existing = checkStmt.get(trimmedLink);

    if (existing) {
      res.status(409).json({
        error: 'Duplicate Error',
        message: 'A problem with this link already exists',
      });
      return;
    }

    // Insert problem
    const insertStmt = db.prepare(`
      INSERT INTO problems (name, link, color, key_insight)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      trimmedName,
      trimmedLink,
      color || 'gray',
      key_insight || null
    );

    // Fetch the created problem
    const selectStmt = db.prepare('SELECT * FROM problems WHERE id = ?');
    const problem = selectStmt.get(result.lastInsertRowid) as Problem;

    res.status(201).json(problem);
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create problem',
    });
  }
});

/**
 * POST /api/problems/import
 * Import problems from CSV content
 *
 * Request body: Raw CSV text (multipart/form-data or text/plain)
 * Content-Type: text/csv or text/plain
 *
 * CSV Format:
 * Problem,Link,Color,LastReviewed,KeyInsight
 *
 * @returns {ImportResult} Summary of import operation
 */
problemsRouter.post('/import', (req: Request, res: Response) => {
  try {
    // Get CSV content from request body
    let csvContent: string;

    if (typeof req.body === 'string') {
      csvContent = req.body;
    } else if (req.body && typeof req.body.csvContent === 'string') {
      csvContent = req.body.csvContent;
    } else if (req.body && typeof req.body.csv === 'string') {
      csvContent = req.body.csv;
    } else {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Request body must contain CSV content as string',
      });
      return;
    }

    // Parse CSV
    const parseResult = parseCSV(csvContent);

    const db = getDatabase();

    // Use a transaction to ensure atomicity and prevent race conditions
    const importTransaction = db.transaction((problems: typeof parseResult.success) => {
      let imported = 0;
      let duplicates = 0;

      // Track normalized links already in the database
      const existingLinksStmt = db.prepare('SELECT link FROM problems');
      const existingProblems = existingLinksStmt.all() as Array<{ link: string }>;
      const existingLinks = new Set(
        existingProblems.map(p => p.link.toLowerCase().replace(/\/$/, ''))
      );

      // Insert successfully parsed problems
      const insertStmt = db.prepare(`
        INSERT INTO problems (name, link, color, key_insight, last_reviewed)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const problem of problems) {
        // Check for duplicate (case-insensitive, ignore trailing slash)
        const normalizedLink = problem.link.toLowerCase().replace(/\/$/, '');

        if (existingLinks.has(normalizedLink)) {
          duplicates++;
          continue;
        }

        try {
          insertStmt.run(
            problem.name,
            problem.link,
            problem.color,
            problem.key_insight,
            problem.last_reviewed
          );
          imported++;
          existingLinks.add(normalizedLink);
        } catch (error: any) {
          // Handle constraint violations (e.g., duplicate link)
          if (error.code === 'SQLITE_CONSTRAINT' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            duplicates++;
          } else {
            // Log unexpected errors but don't expose details to client
            console.error('Unexpected database error during CSV import:', error);
            throw new Error('Database error during import');
          }
        }
      }

      return { imported, duplicates };
    });

    // Execute the transaction
    const { imported, duplicates } = importTransaction(parseResult.success);

    const result: ImportResult = {
      imported,
      duplicates,
      errors: parseResult.errors,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error importing problems:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to import problems',
    });
  }
});

/**
 * GET /api/problems/export
 * Export all problems as CSV
 *
 * @returns CSV file with all problems
 */
problemsRouter.get('/export', (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // Fetch all problems ordered by creation date (newest first)
    const query = 'SELECT * FROM problems ORDER BY created_at DESC';
    const stmt = db.prepare(query);
    const problems = stmt.all() as Problem[];

    // Generate CSV content
    const csvContent = generateCSV(problems);

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `leetcode-problems-${today}.csv`;
    // Sanitize filename to prevent header injection (RFC 2183 compliance)
    const safeFilename = filename.replace(/[^\w.-]/g, '_');

    // Set response headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    // Send CSV content
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting problems:', error);
    res.setHeader('Content-Type', 'application/json'); // Explicit JSON content type for errors
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export problems',
    });
  }
});

/**
 * GET /api/problems/:id
 * Get a single problem with its attempt history
 *
 * @param {number} id - Problem ID
 * @returns {ProblemWithAttempts} Problem with attempts array
 */
problemsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const problemId = parseInt(id, 10);

    if (isNaN(problemId)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem ID must be a number',
      });
      return;
    }

    const db = getDatabase();

    // Fetch problem
    const problemStmt = db.prepare('SELECT * FROM problems WHERE id = ?');
    const problem = problemStmt.get(problemId) as Problem | undefined;

    if (!problem) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Problem not found',
      });
      return;
    }

    // Fetch attempts for this problem
    const attemptsStmt = db.prepare(`
      SELECT * FROM attempts
      WHERE problem_id = ?
      ORDER BY attempted_at DESC
    `);
    const attempts = attemptsStmt.all(problemId) as Attempt[];

    const response: ProblemWithAttempts = {
      ...problem,
      attempts,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch problem',
    });
  }
});

/**
 * PATCH /api/problems/:id
 * Update a problem's fields
 *
 * Request body (all fields optional):
 * {
 *   name?: string,
 *   link?: string,
 *   color?: ProblemColor,
 *   key_insight?: string,
 *   last_reviewed?: string (ISO date)
 * }
 *
 * @param {number} id - Problem ID
 * @returns {Problem} Updated problem
 */
problemsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const problemId = parseInt(id, 10);

    if (isNaN(problemId)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem ID must be a number',
      });
      return;
    }

    const db = getDatabase();

    // Check if problem exists
    const checkStmt = db.prepare('SELECT id FROM problems WHERE id = ?');
    const exists = checkStmt.get(problemId);

    if (!exists) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Problem not found',
      });
      return;
    }

    const { name, link, color, key_insight, last_reviewed } = req.body as UpdateProblemRequest;

    // Validate at least one field is provided
    if (name === undefined && link === undefined && color === undefined &&
        key_insight === undefined && last_reviewed === undefined) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'At least one field must be provided for update',
      });
      return;
    }

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const params: SQLiteParameter[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Name must be a non-empty string',
        });
        return;
      }
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (link !== undefined) {
      if (typeof link !== 'string' || !link.trim()) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Link must be a non-empty string',
        });
        return;
      }

      // Validate URL format
      try {
        const url = new URL(link.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          res.status(400).json({
            error: 'Validation Error',
            message: 'Link must be a valid HTTP or HTTPS URL',
          });
          return;
        }
      } catch {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Link must be a valid URL',
        });
        return;
      }

      // Check for duplicate link (excluding current problem)
      const dupStmt = db.prepare('SELECT id FROM problems WHERE link = ? AND id != ?');
      const duplicate = dupStmt.get(link.trim(), problemId);

      if (duplicate) {
        res.status(409).json({
          error: 'Duplicate Error',
          message: 'A problem with this link already exists',
        });
        return;
      }

      updates.push('link = ?');
      params.push(link.trim());
    }

    if (color !== undefined) {
      const validColors: ProblemColor[] = ['gray', 'orange', 'yellow', 'green'];
      if (!validColors.includes(color)) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Color must be one of: gray, orange, yellow, green',
        });
        return;
      }
      updates.push('color = ?');
      params.push(color);
    }

    if (key_insight !== undefined) {
      updates.push('key_insight = ?');
      params.push(key_insight || null);
    }

    if (last_reviewed !== undefined) {
      // Validate ISO date format if not null
      if (last_reviewed !== null) {
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!isoDateRegex.test(last_reviewed)) {
          res.status(400).json({
            error: 'Validation Error',
            message: 'last_reviewed must be in ISO format (YYYY-MM-DD)',
          });
          return;
        }
      }
      updates.push('last_reviewed = ?');
      params.push(last_reviewed);
    }

    // Add problem ID to params
    params.push(problemId);

    // Execute update
    const updateQuery = `UPDATE problems SET ${updates.join(', ')} WHERE id = ?`;
    const updateStmt = db.prepare(updateQuery);
    updateStmt.run(...params);

    // Fetch and return updated problem
    const selectStmt = db.prepare('SELECT * FROM problems WHERE id = ?');
    const updatedProblem = selectStmt.get(problemId) as Problem;

    res.status(200).json(updatedProblem);
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update problem',
    });
  }
});

/**
 * DELETE /api/problems/:id
 * Delete a problem and all related data (cascade delete)
 *
 * Deletes:
 * - All attempts for this problem
 * - All daily_selections for this problem
 * - The problem itself
 *
 * Uses transaction to ensure atomicity.
 *
 * @param {number} id - Problem ID
 * @returns 204 No Content on success
 */
problemsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const problemId = parseInt(id, 10);

    if (isNaN(problemId)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem ID must be a number',
      });
      return;
    }

    const db = getDatabase();

    // Check if problem exists
    const checkStmt = db.prepare('SELECT id FROM problems WHERE id = ?');
    const exists = checkStmt.get(problemId);

    if (!exists) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Problem not found',
      });
      return;
    }

    // Application-level cascade delete within transaction
    const deleteProblemTransaction = db.transaction((id: number) => {
      // Delete attempts first (child table)
      const deleteAttemptsStmt = db.prepare('DELETE FROM attempts WHERE problem_id = ?');
      deleteAttemptsStmt.run(id);

      // Delete daily_selections (child table)
      const deleteDailySelectionsStmt = db.prepare('DELETE FROM daily_selections WHERE problem_id = ?');
      deleteDailySelectionsStmt.run(id);

      // Delete problem (parent table)
      const deleteProblemStmt = db.prepare('DELETE FROM problems WHERE id = ?');
      deleteProblemStmt.run(id);
    });

    // Execute transaction
    deleteProblemTransaction(problemId);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete problem',
    });
  }
});

/**
 * POST /api/problems/:id/review
 * Manually review a problem from All Problems page
 *
 * Similar to daily complete, but:
 * - Does NOT require problem to be in today's selection
 * - Does NOT update daily_selections table
 * - Allows reviewing any problem at any time
 *
 * Updates:
 * - Problem color (based on transition rules)
 * - Problem last_reviewed date
 * - Increments review_count
 * - Inserts attempt record
 * - Optionally updates key_insight
 *
 * @param {number} id - Problem ID
 * @body { colorResult: 'orange' | 'yellow' | 'green', key_insight?: string }
 * @returns {Problem} Updated problem
 */
problemsRouter.post('/:id/review', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const problemId = parseInt(id, 10);

    if (isNaN(problemId)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem ID must be a number',
      });
      return;
    }

    const { colorResult, key_insight } = req.body as { colorResult: AttemptColorResult; key_insight?: string };

    // Validate color result
    const validColors: AttemptColorResult[] = ['orange', 'yellow', 'green'];
    if (!colorResult || !validColors.includes(colorResult)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Color result must be one of: orange, yellow, green',
      });
      return;
    }

    // Validate key_insight length if provided
    if (key_insight !== undefined && key_insight.length > MAX_INSIGHT_LENGTH) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Key insight exceeds maximum length of ${MAX_INSIGHT_LENGTH} characters`,
      });
      return;
    }

    const db = getDatabase();

    // Check if problem exists
    const checkStmt = db.prepare('SELECT * FROM problems WHERE id = ?');
    const problem = checkStmt.get(problemId) as Problem | undefined;

    if (!problem) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Problem not found',
      });
      return;
    }

    // Update problem using shared logic
    const isoString = new Date().toISOString();
    const today = isoString.split('T')[0];
    if (!today) {
      throw new Error('Failed to get today\'s date');
    }

    // Use transaction for atomicity
    const reviewTransaction = db.transaction(() => {
      const result = updateProblemReview(db, problemId, problem.color, colorResult, today);

      // Update key_insight if provided
      if (key_insight !== undefined) {
        const updateInsightStmt = db.prepare('UPDATE problems SET key_insight = ? WHERE id = ?');
        updateInsightStmt.run(key_insight || null, problemId);

        // Fetch updated problem
        const selectStmt = db.prepare('SELECT * FROM problems WHERE id = ?');
        return { problem: selectStmt.get(problemId) as Problem };
      }

      return result;
    });

    const result = reviewTransaction();

    res.status(200).json({ problem: result.problem });
  } catch (error) {
    console.error('Error reviewing problem:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to review problem',
    });
  }
});
