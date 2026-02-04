/**
 * Spaced Repetition Selection Service
 *
 * This module implements the core spaced repetition algorithm for selecting
 * daily LeetCode problems. It manages problem selection based on:
 * - Problem color state (gray -> orange -> yellow -> green)
 * - Time-based eligibility thresholds
 * - Target distribution ratios (50% NEW, 40% REVIEW, 10% MASTERED)
 *
 * Eligibility Rules:
 * - GRAY (new): Always eligible
 * - ORANGE: Eligible if last_reviewed >= 3 days ago
 * - YELLOW: Eligible if last_reviewed >= 7 days ago
 * - GREEN (mastered): Eligible if last_reviewed >= 14 days ago
 *
 * Selection Algorithm:
 * 1. Query eligible problems by pool (NEW, REVIEW, MASTERED)
 * 2. Calculate target counts based on configured daily_problem_count
 * 3. Randomly select from each pool up to target
 * 4. Redistribute if pools are empty or insufficient
 * 5. Return final selection
 */

import Database from 'better-sqlite3';
import { Problem, Settings } from '../db/types.js';

/**
 * Retrieves all eligible NEW problems (gray color) that haven't been selected today
 *
 * NEW problems are always eligible regardless of last_reviewed date.
 * They represent problems that the user hasn't attempted yet.
 *
 * @param db - better-sqlite3 database instance
 * @returns Array of eligible NEW problems
 *
 * @example
 * ```typescript
 * const db = getDatabase();
 * const newProblems = getEligibleNew(db);
 * console.log(`${newProblems.length} new problems available`);
 * ```
 */
export function getEligibleNew(db: Database.Database): Problem[] {
  const query = `
    SELECT p.*
    FROM problems p
    WHERE p.color = 'gray'
      AND p.id NOT IN (
        SELECT problem_id
        FROM daily_selections
        WHERE selected_date = DATE('now')
      )
    ORDER BY p.id
  `;

  return db.prepare(query).all() as Problem[];
}

/**
 * Retrieves all eligible REVIEW problems (orange + yellow) that haven't been selected today
 *
 * REVIEW problems include:
 * - ORANGE: Problems eligible if last_reviewed >= 3 days ago
 * - YELLOW: Problems eligible if last_reviewed >= 7 days ago
 *
 * These represent problems the user has attempted but needs reinforcement.
 *
 * @param db - better-sqlite3 database instance
 * @returns Array of eligible REVIEW problems (orange and yellow combined)
 *
 * @example
 * ```typescript
 * const db = getDatabase();
 * const reviewProblems = getEligibleReview(db);
 * console.log(`${reviewProblems.length} review problems due`);
 * ```
 */
export function getEligibleReview(db: Database.Database): Problem[] {
  const query = `
    SELECT p.*
    FROM problems p
    WHERE (
        (p.color = 'orange' AND (
          p.last_reviewed IS NULL OR
          DATE(p.last_reviewed) <= DATE('now', '-3 days')
        ))
        OR
        (p.color = 'yellow' AND (
          p.last_reviewed IS NULL OR
          DATE(p.last_reviewed) <= DATE('now', '-7 days')
        ))
      )
      AND p.id NOT IN (
        SELECT problem_id
        FROM daily_selections
        WHERE selected_date = DATE('now')
      )
    ORDER BY p.id
  `;

  return db.prepare(query).all() as Problem[];
}

/**
 * Retrieves all eligible MASTERED problems (green) that haven't been selected today
 *
 * MASTERED problems are eligible if:
 * - Color is green AND
 * - last_reviewed >= 14 days ago (or never reviewed)
 *
 * These represent well-learned problems that need periodic reinforcement.
 *
 * @param db - better-sqlite3 database instance
 * @returns Array of eligible MASTERED problems
 *
 * @example
 * ```typescript
 * const db = getDatabase();
 * const masteredProblems = getEligibleMastered(db);
 * console.log(`${masteredProblems.length} mastered problems ready for review`);
 * ```
 */
export function getEligibleMastered(db: Database.Database): Problem[] {
  const query = `
    SELECT p.*
    FROM problems p
    WHERE p.color = 'green'
      AND (
        p.last_reviewed IS NULL OR
        DATE(p.last_reviewed) <= DATE('now', '-14 days')
      )
      AND p.id NOT IN (
        SELECT problem_id
        FROM daily_selections
        WHERE selected_date = DATE('now')
      )
    ORDER BY p.id
  `;

  return db.prepare(query).all() as Problem[];
}

/**
 * Selects a single replacement problem using priority-based selection
 *
 * This function implements the same eligibility rules as the main selection
 * algorithm but returns only ONE problem. Used for individual problem replacement.
 *
 * Algorithm:
 * 1. Query eligible problems from all three pools (NEW, REVIEW, MASTERED)
 * 2. Apply priority order: NEW → REVIEW → MASTERED
 * 3. Randomly select one problem from the highest priority non-empty pool
 * 4. Return the selected problem or null if no eligible problems exist
 *
 * Priority Rationale:
 * - NEW problems are prioritized to encourage learning progression
 * - REVIEW problems provide necessary reinforcement
 * - MASTERED problems offer maintenance practice when other pools are empty
 *
 * The function excludes problems already selected today, ensuring users
 * don't get duplicate problems in their daily selection.
 *
 * @param db - better-sqlite3 database instance
 * @returns Single problem or null if no eligible problems available
 *
 * @example
 * ```typescript
 * const db = getDatabase();
 * const replacement = selectSingleProblem(db);
 *
 * if (replacement) {
 *   console.log(`Selected replacement: ${replacement.name}`);
 * } else {
 *   console.log('No eligible problems available');
 * }
 * ```
 */
export function selectSingleProblem(db: Database.Database): Problem | null {
  // Get eligible problems from each pool
  const newPool = getEligibleNew(db);
  const reviewPool = getEligibleReview(db);
  const masteredPool = getEligibleMastered(db);

  // Priority order: NEW → REVIEW → MASTERED
  // Select from the first non-empty pool
  let selectedPool: Problem[] | null = null;

  if (newPool.length > 0) {
    selectedPool = newPool;
  } else if (reviewPool.length > 0) {
    selectedPool = reviewPool;
  } else if (masteredPool.length > 0) {
    selectedPool = masteredPool;
  }

  // If no eligible problems in any pool, return null
  if (!selectedPool || selectedPool.length === 0) {
    return null;
  }

  // Randomly select one problem from the chosen pool
  const randomIndex = Math.floor(Math.random() * selectedPool.length);
  return selectedPool[randomIndex];
}

/**
 * Randomly selects N items from an array without replacement
 *
 * Uses Fisher-Yates shuffle algorithm for unbiased random selection.
 * If count >= array length, returns all items in random order.
 *
 * @param array - Source array to select from
 * @param count - Number of items to select
 * @returns Array of randomly selected items
 *
 * @example
 * ```typescript
 * const problems = [p1, p2, p3, p4, p5];
 * const selected = randomSelect(problems, 2); // Returns 2 random problems
 * ```
 */
function randomSelect<T>(array: T[], count: number): T[] {
  // Use Fisher-Yates shuffle for all cases to ensure uniform distribution
  const shuffled = [...array];

  // Fisher-Yates shuffle for the first 'count' elements (or all if count >= length)
  const numToShuffle = Math.min(count, shuffled.length);

  for (let i = 0; i < numToShuffle; i++) {
    const randomIndex = Math.floor(Math.random() * (shuffled.length - i)) + i;
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled.slice(0, numToShuffle);
}

/**
 * Selects problems with topic diversity constraint
 *
 * Ensures a maximum of `maxPerTopic` problems per topic in the selection.
 * This prevents daily selections from being too repetitive in terms of topics.
 *
 * Algorithm:
 * 1. Fetch topics for each problem in the pool
 * 2. Greedy selection with diversity constraint:
 *    - Shuffle pool for randomness
 *    - Track topic counts as we select
 *    - Prefer problems that don't violate max-per-topic limit
 *    - Fall back to any remaining if constraint can't be met
 * 3. Return selected problems
 *
 * Edge Cases:
 * - Problems without topics are always eligible
 * - Falls back to standard random selection if diversity can't be achieved
 * - Backwards compatible with existing problems (empty topics)
 *
 * @param db - better-sqlite3 database instance
 * @param pool - Array of problems to select from
 * @param count - Number of problems to select
 * @param maxPerTopic - Maximum problems per topic (default: 2)
 * @returns Array of selected problems with topic diversity
 *
 * @example
 * ```typescript
 * const db = getDatabase();
 * const pool = getEligibleNew(db);
 * const selected = selectWithTopicDiversity(db, pool, 5, 2);
 * ```
 */
function selectWithTopicDiversity(
  db: Database.Database,
  pool: Problem[],
  count: number,
  maxPerTopic: number = 2
): Problem[] {
  if (pool.length === 0 || count === 0) {
    return [];
  }

  // If count >= pool size, return all
  if (count >= pool.length) {
    return [...pool];
  }

  // Fetch topics for each problem
  const problemTopics = new Map<number, number[]>();

  if (pool.length > 0) {
    const problemIds = pool.map(p => p.id);
    const placeholders = problemIds.map(() => '?').join(',');

    const topicQuery = `
      SELECT problem_id, topic_id
      FROM problem_topics
      WHERE problem_id IN (${placeholders})
    `;

    const topicRows = db.prepare(topicQuery).all(...problemIds) as Array<{
      problem_id: number;
      topic_id: number;
    }>;

    // Build map of problem_id -> topic_ids
    for (const row of topicRows) {
      if (!problemTopics.has(row.problem_id)) {
        problemTopics.set(row.problem_id, []);
      }
      problemTopics.get(row.problem_id)!.push(row.topic_id);
    }
  }

  // Shuffle pool for randomness
  const shuffledPool = [...pool];
  for (let i = shuffledPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
  }

  // Greedy selection with diversity constraint
  const selected: Problem[] = [];
  const topicCounts = new Map<number, number>();

  for (const problem of shuffledPool) {
    if (selected.length >= count) {
      break;
    }

    const topics = problemTopics.get(problem.id) || [];

    // Check if selecting this problem would violate constraint
    const wouldViolate = topics.some(topicId => {
      const currentCount = topicCounts.get(topicId) || 0;
      return currentCount >= maxPerTopic;
    });

    // Select if it doesn't violate constraint OR if we need to fill remaining slots
    if (!wouldViolate) {
      selected.push(problem);

      // Update topic counts
      for (const topicId of topics) {
        topicCounts.set(topicId, (topicCounts.get(topicId) || 0) + 1);
      }
    }
  }

  // If we couldn't select enough due to constraints, fall back to filling with remaining
  if (selected.length < count) {
    for (const problem of shuffledPool) {
      if (selected.length >= count) {
        break;
      }

      if (!selected.includes(problem)) {
        selected.push(problem);
      }
    }
  }

  return selected;
}

/**
 * Selects daily problems using spaced repetition algorithm
 *
 * This is the main selection algorithm that implements the core business logic:
 *
 * Algorithm Steps:
 * 1. Retrieve user's configured daily_problem_count from settings (3-10)
 * 2. Query eligible problems from each pool (NEW, REVIEW, MASTERED)
 * 3. Calculate target counts: 50% NEW, 40% REVIEW, 10% MASTERED
 * 4. Randomly select from each pool up to target
 * 5. Redistribute excess capacity if pools are empty/insufficient
 * 6. Return final selection
 *
 * Redistribution Logic:
 * - If a pool is empty, its quota is distributed to other non-empty pools
 * - Priority order: NEW > REVIEW > MASTERED
 * - Ensures we always return up to daily_problem_count problems if available
 *
 * Edge Cases Handled:
 * - No problems in database: Returns empty array
 * - Insufficient problems: Returns all available problems
 * - Empty pools: Redistributes quota to available pools
 * - All problems already selected today: Returns empty array
 *
 * @param db - better-sqlite3 database instance
 * @param count - Optional override for daily problem count (defaults to settings value)
 * @returns Array of selected problems (0 to daily_problem_count length)
 *
 * @example
 * ```typescript
 * const db = getDatabase();
 *
 * // Use default count from settings
 * const dailySelection = selectDailyProblems(db);
 *
 * // Override with specific count
 * const customSelection = selectDailyProblems(db, 4);
 * ```
 */
export function selectDailyProblems(
  db: Database.Database,
  count?: number
): Problem[] {
  // Get daily problem count from settings if not provided
  let targetCount = count;
  if (targetCount === undefined) {
    const settings = db
      .prepare('SELECT daily_problem_count FROM settings WHERE id = 1')
      .get() as Settings | undefined;

    if (!settings) {
      throw new Error('Settings not found in database');
    }

    targetCount = settings.daily_problem_count;
  }

  // Validate count is within acceptable range
  if (targetCount < 3 || targetCount > 10) {
    throw new Error('Daily problem count must be between 3 and 10');
  }

  // Get eligible problems from each pool
  const newPool = getEligibleNew(db);
  const reviewPool = getEligibleReview(db);
  const masteredPool = getEligibleMastered(db);

  // Calculate target counts based on ratios
  // 50% NEW, 40% REVIEW, 10% MASTERED
  let targetNew = Math.ceil(targetCount * 0.5);
  let targetReview = Math.ceil(targetCount * 0.4);
  let targetMastered = Math.max(1, Math.floor(targetCount * 0.1));

  // Adjust to ensure total doesn't exceed target count
  // (due to rounding, we might have targetNew + targetReview + targetMastered > targetCount)
  const initialTotal = targetNew + targetReview + targetMastered;
  if (initialTotal > targetCount) {
    // Reduce mastered first, then review
    const excess = initialTotal - targetCount;
    targetMastered = Math.max(0, targetMastered - excess);
    if (targetNew + targetReview + targetMastered > targetCount) {
      targetReview = Math.max(0, targetReview - 1);
    }
  }

  // Select from each pool with topic diversity
  let selectedNew = selectWithTopicDiversity(
    db,
    newPool,
    Math.min(targetNew, newPool.length)
  );
  let selectedReview = selectWithTopicDiversity(
    db,
    reviewPool,
    Math.min(targetReview, reviewPool.length)
  );
  let selectedMastered = selectWithTopicDiversity(
    db,
    masteredPool,
    Math.min(targetMastered, masteredPool.length)
  );

  // Redistribute if we haven't met target count
  const currentTotal =
    selectedNew.length + selectedReview.length + selectedMastered.length;
  let remaining = targetCount - currentTotal;

  // Priority order for redistribution: NEW > REVIEW > MASTERED
  if (remaining > 0) {
    // Try to add more from NEW pool
    const availableNew = newPool.length - selectedNew.length;
    if (availableNew > 0) {
      const additionalNew = Math.min(remaining, availableNew);
      selectedNew = selectWithTopicDiversity(
        db,
        newPool,
        selectedNew.length + additionalNew
      );
      remaining -= additionalNew;
    }

    // Try to add more from REVIEW pool
    if (remaining > 0) {
      const availableReview = reviewPool.length - selectedReview.length;
      if (availableReview > 0) {
        const additionalReview = Math.min(remaining, availableReview);
        selectedReview = selectWithTopicDiversity(
          db,
          reviewPool,
          selectedReview.length + additionalReview
        );
        remaining -= additionalReview;
      }
    }

    // Try to add more from MASTERED pool
    if (remaining > 0) {
      const availableMastered = masteredPool.length - selectedMastered.length;
      if (availableMastered > 0) {
        const additionalMastered = Math.min(remaining, availableMastered);
        selectedMastered = selectWithTopicDiversity(
          db,
          masteredPool,
          selectedMastered.length + additionalMastered
        );
        remaining -= additionalMastered;
      }
    }
  }

  // Combine all selections
  const finalSelection = [
    ...selectedNew,
    ...selectedReview,
    ...selectedMastered,
  ];

  return finalSelection;
}
