/**
 * Daily Selection API Routes
 *
 * Endpoints:
 * - GET    /api/daily              - Get today's selection (creates if needed)
 * - POST   /api/daily/:problemId/complete - Mark problem completed with color result
 * - POST   /api/daily/:problemId/replace  - Replace a specific problem in today's selection
 * - POST   /api/daily/refresh      - Generate new selection for today
 */

import { Router, Request, Response } from 'express';
import type Database from 'better-sqlite3';
import { getDatabase } from '../db/index.js';
import type {
  Problem,
  AttemptColorResult,
  ProblemColor
} from '../db/types.js';
import type {
  DailySelectionResponse,
  CompleteProblemRequest,
  CompleteProblemResponse,
  ProblemWithSelection,
} from './api-types.js';
import { selectDailyProblems, selectSingleProblem } from '../services/selection.js';

export const dailyRouter = Router();

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
function getTodayDate(): string {
  const today = new Date().toISOString().split('T')[0];
  if (!today) {
    throw new Error('Failed to get today\'s date');
  }
  return today;
}

/**
 * Validates if the color can be transitioned to the new color
 * Problem colors should only advance, never regress
 *
 * Transition rules:
 * - gray -> orange/yellow/green (any)
 * - orange -> orange/yellow/green (can stay or advance)
 * - yellow -> yellow/green (can stay or advance)
 * - green -> green (mastered, stays green)
 *
 * @param currentColor - Current problem color
 * @param resultColor - User's performance color result
 * @returns The new color after transition
 */
export function getNextColor(currentColor: ProblemColor, resultColor: AttemptColorResult): ProblemColor {
  // Gray can transition to any result color
  if (currentColor === 'gray') {
    return resultColor;
  }

  // Green stays green (already mastered)
  if (currentColor === 'green') {
    return 'green';
  }

  // Orange can stay orange or advance to yellow/green
  if (currentColor === 'orange') {
    if (resultColor === 'orange') return 'orange';
    if (resultColor === 'yellow') return 'yellow';
    return 'green'; // resultColor === 'green'
  }

  // Yellow can stay yellow or advance to green
  if (currentColor === 'yellow') {
    if (resultColor === 'yellow') return 'yellow';
    return 'green'; // resultColor === 'green' or 'orange' (treat orange as yellow)
  }

  // Should never reach here due to type constraints, but handle defensively
  return currentColor;
}

/**
 * Shared function to update a problem after review
 * Used by both daily complete and manual review endpoints
 *
 * Updates:
 * - Problem color (based on transition rules)
 * - Problem last_reviewed date
 * - Increments review_count
 * - Inserts attempt record
 *
 * @param db - Database instance
 * @param problemId - Problem ID to update
 * @param currentColor - Current problem color
 * @param colorResult - User's performance color result
 * @param today - Today's date in ISO format (YYYY-MM-DD)
 * @returns Object with nextColor and updated problem
 */
export function updateProblemReview(
  db: Database.Database,
  problemId: number,
  currentColor: ProblemColor,
  colorResult: AttemptColorResult,
  today: string
): { nextColor: ProblemColor; problem: Problem } {
  // Calculate next color based on transition rules
  const nextColor = getNextColor(currentColor, colorResult);

  // Update problem
  const updateStmt = db.prepare(`
    UPDATE problems
    SET color = ?, last_reviewed = ?, review_count = review_count + 1
    WHERE id = ?
  `);
  updateStmt.run(nextColor, today, problemId);

  // Insert attempt record
  const insertAttemptStmt = db.prepare(`
    INSERT INTO attempts (problem_id, color_result, attempted_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  insertAttemptStmt.run(problemId, colorResult);

  // Fetch updated problem
  const selectStmt = db.prepare('SELECT * FROM problems WHERE id = ?');
  const problem = selectStmt.get(problemId) as Problem;

  return { nextColor, problem };
}

/**
 * GET /api/daily
 * Get today's selection (creates if doesn't exist)
 *
 * Returns array of problems with completion status and selection ID
 * If no selection exists for today, calls selectDailyProblems() to generate one
 *
 * @returns {DailySelectionResponse} Array of problems with selection metadata
 */
dailyRouter.get('/', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const today = getTodayDate();

    // Check if selection exists for today
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM daily_selections
      WHERE selected_date = ?
    `);
    const { count } = checkStmt.get(today) as { count: number };

    // If no selection exists, create one
    if (count === 0) {
      // Get daily problem count from settings
      const settingsStmt = db.prepare('SELECT daily_problem_count FROM settings WHERE id = 1');
      const settings = settingsStmt.get() as { daily_problem_count: number } | undefined;
      const problemCount = settings?.daily_problem_count || 5;

      // Select daily problems using spaced repetition algorithm
      const selectedProblems = selectDailyProblems(db, problemCount);

      // Insert selections into database
      const insertStmt = db.prepare(`
        INSERT INTO daily_selections (problem_id, selected_date, completed)
        VALUES (?, ?, 0)
      `);

      const insertTransaction = db.transaction((problems: Problem[]) => {
        for (const problem of problems) {
          insertStmt.run(problem.id, today);
        }
      });

      insertTransaction(selectedProblems);
    }

    // Fetch today's selection with problem details
    const selectStmt = db.prepare(`
      SELECT
        p.*,
        ds.id as selectionId,
        ds.completed
      FROM daily_selections ds
      JOIN problems p ON ds.problem_id = p.id
      WHERE ds.selected_date = ?
      ORDER BY ds.id
    `);

    // Convert SQLite 0/1 to boolean for TypeScript/JSON compatibility
    const problems = (selectStmt.all(today) as any[]).map(row => ({
      ...row,
      completed: row.completed === 1
    })) as ProblemWithSelection[];

    const response: DailySelectionResponse = {
      problems,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching daily selection:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch daily selection',
    });
  }
});

/**
 * POST /api/daily/refresh
 * Generate a new selection for today
 *
 * Deletes existing selections for today and generates new ones
 * Useful if user wants to re-roll their daily problems
 *
 * @returns {DailySelectionResponse} New selection
 */
dailyRouter.post('/refresh', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const today = getTodayDate();

    // Use transaction to ensure atomicity
    const refreshTransaction = db.transaction(() => {
      // Delete existing selections for today
      const deleteStmt = db.prepare(`
        DELETE FROM daily_selections
        WHERE selected_date = ?
      `);
      deleteStmt.run(today);

      // Get daily problem count from settings
      const settingsStmt = db.prepare('SELECT daily_problem_count FROM settings WHERE id = 1');
      const settings = settingsStmt.get() as { daily_problem_count: number } | undefined;
      const problemCount = settings?.daily_problem_count || 5;

      // Generate new selection
      const selectedProblems = selectDailyProblems(db, problemCount);

      // Insert new selections
      const insertStmt = db.prepare(`
        INSERT INTO daily_selections (problem_id, selected_date, completed)
        VALUES (?, ?, 0)
      `);

      for (const problem of selectedProblems) {
        insertStmt.run(problem.id, today);
      }

      // Fetch the new selection with details
      const selectStmt = db.prepare(`
        SELECT
          p.*,
          ds.id as selectionId,
          ds.completed
        FROM daily_selections ds
        JOIN problems p ON ds.problem_id = p.id
        WHERE ds.selected_date = ?
        ORDER BY ds.id
      `);

      // Convert SQLite 0/1 to boolean for TypeScript/JSON compatibility
      return (selectStmt.all(today) as any[]).map(row => ({
        ...row,
        completed: row.completed === 1
      })) as ProblemWithSelection[];
    });

    const problems = refreshTransaction();

    const response: DailySelectionResponse = {
      problems,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error refreshing daily selection:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refresh daily selection',
    });
  }
});

/**
 * POST /api/daily/:problemId/complete
 * Mark a problem as completed with color result
 *
 * Updates:
 * - Problem color (based on transition rules)
 * - Problem last_reviewed date
 * - Inserts attempt record
 * - Marks daily_selection as completed
 *
 * All updates performed in a transaction for atomicity
 *
 * @param {number} problemId - Problem ID to mark complete
 * @body {CompleteProblemRequest} { colorResult: 'orange' | 'yellow' | 'green' }
 * @returns {CompleteProblemResponse} { problem: DailyProblem }
 */
dailyRouter.post('/:problemId/complete', (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;

    if (!problemId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem ID is required',
      });
      return;
    }

    const problemIdNum = parseInt(problemId, 10);

    if (isNaN(problemIdNum)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem ID must be a number',
      });
      return;
    }

    const { colorResult } = req.body as CompleteProblemRequest;

    // Validate color result
    const validColors: AttemptColorResult[] = ['orange', 'yellow', 'green'];
    if (!colorResult || !validColors.includes(colorResult)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Color must be one of: orange, yellow, green',
      });
      return;
    }

    const db = getDatabase();
    const today = getTodayDate();

    // Check if problem exists and is in today's selection
    const checkStmt = db.prepare(`
      SELECT
        p.id,
        p.color as currentColor,
        ds.id as selectionId,
        ds.completed
      FROM problems p
      LEFT JOIN daily_selections ds ON p.id = ds.problem_id AND ds.selected_date = ?
      WHERE p.id = ?
    `);

    const problemCheck = checkStmt.get(today, problemIdNum) as
      | { id: number; currentColor: ProblemColor; selectionId: number | null; completed: number | null }
      | undefined;

    if (!problemCheck) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Problem not found',
      });
      return;
    }

    if (!problemCheck.selectionId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem is not in today\'s selection',
      });
      return;
    }

    // Use transaction to ensure atomicity
    const completeTransaction = db.transaction(() => {
      // Calculate next color based on transition rules
      const nextColor = getNextColor(problemCheck.currentColor, colorResult);

      // Update problem color, last_reviewed, and increment review_count
      const updateProblemStmt = db.prepare(`
        UPDATE problems
        SET color = ?, last_reviewed = ?, review_count = review_count + 1
        WHERE id = ?
      `);
      updateProblemStmt.run(nextColor, today, problemIdNum);

      // Insert attempt record
      const insertAttemptStmt = db.prepare(`
        INSERT INTO attempts (problem_id, color_result, attempted_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);
      insertAttemptStmt.run(problemIdNum, colorResult);

      // Mark daily_selection as completed
      const updateSelectionStmt = db.prepare(`
        UPDATE daily_selections
        SET completed = 1
        WHERE id = ?
      `);
      updateSelectionStmt.run(problemCheck.selectionId);

      // Fetch updated problem with selection details
      const selectStmt = db.prepare(`
        SELECT
          p.*,
          ds.id as selectionId,
          ds.completed
        FROM problems p
        LEFT JOIN daily_selections ds ON p.id = ds.problem_id AND ds.selected_date = ?
        WHERE p.id = ?
      `);
      const row = selectStmt.get(today, problemIdNum) as any;
      return {
        ...row,
        completed: row.completed === 1
      } as ProblemWithSelection;
    });

    const updatedProblem = completeTransaction();

    res.status(200).json({ problem: updatedProblem });
  } catch (error) {
    console.error('Error completing problem:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to complete problem',
    });
  }
});

/**
 * POST /api/daily/:problemId/replace
 * Replace a specific problem in today's selection with a new one
 *
 * This endpoint allows users to skip a problem they don't want to do right now
 * while keeping the rest of their daily selection intact.
 *
 * Validation:
 * - Problem must exist
 * - Problem must be in today's selection
 * - Problem must NOT be completed (can't replace completed problems)
 *
 * Selection Logic:
 * - Uses selectSingleProblem() with priority: NEW → REVIEW → MASTERED
 * - Excludes problems already in today's selection
 * - Returns 400 if no eligible problems available
 *
 * Transaction:
 * - Deletes old daily_selection entry
 * - Inserts new daily_selection entry with replacement problem
 *
 * @param {number} problemId - Problem ID to replace
 * @returns {ReplaceProblemResponse} { problem: ProblemWithSelection }
 */
dailyRouter.post('/:problemId/replace', (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;

    if (!problemId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem ID is required',
      });
      return;
    }

    const problemIdNum = parseInt(problemId, 10);

    if (isNaN(problemIdNum)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem ID must be a number',
      });
      return;
    }

    const db = getDatabase();
    const today = getTodayDate();

    // Check if problem exists and is in today's selection
    const checkStmt = db.prepare(`
      SELECT
        p.id,
        ds.id as selectionId,
        ds.completed
      FROM problems p
      LEFT JOIN daily_selections ds ON p.id = ds.problem_id AND ds.selected_date = ?
      WHERE p.id = ?
    `);

    const problemCheck = checkStmt.get(today, problemIdNum) as
      | { id: number; selectionId: number | null; completed: number | null }
      | undefined;

    if (!problemCheck) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Problem not found',
      });
      return;
    }

    if (!problemCheck.selectionId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Problem is not in today\'s selection',
      });
      return;
    }

    if (problemCheck.completed === 1) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Cannot replace completed problem',
      });
      return;
    }

    // Use transaction to ensure atomicity (selection happens inside transaction)
    const replaceTransaction = db.transaction(() => {
      // Select a replacement problem INSIDE transaction to prevent race conditions
      const replacementProblem = selectSingleProblem(db);

      if (!replacementProblem) {
        throw new Error('No eligible problems available for replacement');
      }

      // Delete old selection entry
      const deleteStmt = db.prepare(`
        DELETE FROM daily_selections
        WHERE id = ?
      `);
      deleteStmt.run(problemCheck.selectionId);

      // Insert new selection entry
      const insertStmt = db.prepare(`
        INSERT INTO daily_selections (problem_id, selected_date, completed)
        VALUES (?, ?, 0)
      `);
      insertStmt.run(replacementProblem.id, today);

      // Fetch the replacement problem with selection details
      const selectStmt = db.prepare(`
        SELECT
          p.*,
          ds.id as selectionId,
          ds.completed
        FROM daily_selections ds
        JOIN problems p ON ds.problem_id = p.id
        WHERE ds.problem_id = ? AND ds.selected_date = ?
      `);

      const row = selectStmt.get(replacementProblem.id, today) as any;
      return {
        ...row,
        completed: row.completed === 1
      } as ProblemWithSelection;
    });

    try {
      const newProblem = replaceTransaction();
      res.status(200).json({ problem: newProblem });
    } catch (error) {
      if (error instanceof Error && error.message.includes('No eligible problems')) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'No eligible problems available for replacement',
        });
        return;
      }
      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('Error replacing problem:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to replace problem',
    });
  }
});

export default dailyRouter;
