/**
 * Statistics API Routes
 *
 * Endpoints:
 * - GET /api/stats - Get dashboard statistics
 */

import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/index.js';

export const statsRouter = Router();

/**
 * Helper function to get today's date in ISO format (YYYY-MM-DD)
 */
function getTodayDate(): string {
  const today = new Date().toISOString().split('T')[0];
  if (!today) {
    throw new Error('Failed to get today\'s date');
  }
  return today;
}

/**
 * Calculate current streak of consecutive days with completed daily selections
 *
 * A streak is defined as consecutive days (counting backwards from today) where:
 * 1. A daily_selection exists for that day
 * 2. ALL problems selected for that day are marked as completed
 *
 * @param db - Database instance
 * @returns Number of consecutive days (0 if today has no completed selection)
 */
function calculateCurrentStreak(db: any): number {
  const today = getTodayDate();

  // Get all unique dates with selections, ordered by date descending
  const datesStmt = db.prepare(`
    SELECT DISTINCT selected_date
    FROM daily_selections
    ORDER BY selected_date DESC
  `);
  const dates = datesStmt.all() as Array<{ selected_date: string }>;

  if (dates.length === 0) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(today);

  // Walk backwards from today
  for (const { selected_date } of dates) {
    const selectionDate = new Date(selected_date);
    const expectedDate = new Date(currentDate);
    expectedDate.setHours(0, 0, 0, 0);
    selectionDate.setHours(0, 0, 0, 0);

    // If this selection date doesn't match our expected date, streak is broken
    if (selectionDate.getTime() !== expectedDate.getTime()) {
      break;
    }

    // Check if ALL problems for this date are completed
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM daily_selections
      WHERE selected_date = ?
    `);
    const result = checkStmt.get(selected_date) as { total: number; completed: number };

    // If not all problems are completed, streak is broken
    if (result.total !== result.completed) {
      break;
    }

    // This day counts toward streak
    streak++;

    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

/**
 * Calculate number of problems eligible for review today
 *
 * A problem is ready for review if:
 * - orange: last_reviewed >= 3 days ago OR never reviewed (last_reviewed IS NULL)
 * - yellow: last_reviewed >= 7 days ago OR never reviewed
 * - green: last_reviewed >= 14 days ago OR never reviewed
 * - gray: excluded (always eligible but not counted as "review")
 *
 * @param db - Database instance
 * @returns Count of problems ready for review
 */
function calculateReadyForReview(db: any): number {
  const today = getTodayDate();

  // Calculate cutoff dates for each color
  const orangeCutoff = new Date();
  orangeCutoff.setDate(orangeCutoff.getDate() - 3);
  const orangeCutoffStr = orangeCutoff.toISOString().split('T')[0];

  const yellowCutoff = new Date();
  yellowCutoff.setDate(yellowCutoff.getDate() - 7);
  const yellowCutoffStr = yellowCutoff.toISOString().split('T')[0];

  const greenCutoff = new Date();
  greenCutoff.setDate(greenCutoff.getDate() - 14);
  const greenCutoffStr = greenCutoff.toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM problems
    WHERE (
      -- Orange problems: >= 3 days ago or never reviewed
      (color = 'orange' AND (last_reviewed IS NULL OR last_reviewed <= ?))
      OR
      -- Yellow problems: >= 7 days ago or never reviewed
      (color = 'yellow' AND (last_reviewed IS NULL OR last_reviewed <= ?))
      OR
      -- Green problems: >= 14 days ago or never reviewed
      (color = 'green' AND (last_reviewed IS NULL OR last_reviewed <= ?))
    )
  `);

  const result = stmt.get(orangeCutoffStr, yellowCutoffStr, greenCutoffStr) as { count: number };
  return result.count;
}

/**
 * GET /api/stats
 * Get dashboard statistics
 *
 * Returns:
 * - totalProblems: Total count of all problems in database
 * - greenProblems: Count of problems with color='green' (mastered)
 * - currentStreak: Number of consecutive days with completed selections (counting backwards from today)
 * - readyForReview: Count of problems eligible for review based on spaced repetition rules
 *
 * @returns {Stats} Dashboard statistics object
 */
statsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // Get total problems count
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM problems');
    const { count: totalProblems } = totalStmt.get() as { count: number };

    // Get green problems count (mastered)
    const greenStmt = db.prepare('SELECT COUNT(*) as count FROM problems WHERE color = ?');
    const { count: greenProblems } = greenStmt.get('green') as { count: number };

    // Calculate current streak
    const currentStreak = calculateCurrentStreak(db);

    // Calculate ready for review
    const readyForReview = calculateReadyForReview(db);

    res.status(200).json({
      totalProblems,
      greenProblems,
      currentStreak,
      readyForReview,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch statistics',
    });
  }
});

export default statsRouter;
