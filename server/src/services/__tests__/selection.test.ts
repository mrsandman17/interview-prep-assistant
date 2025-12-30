/**
 * Tests for Selection Service - Spaced Repetition Algorithm
 *
 * This test suite validates the core spaced repetition logic that selects
 * daily problems based on the Anki-style algorithm:
 *
 * - Problem colors: gray (new) → orange → yellow → green (mastered)
 * - Eligibility thresholds:
 *   - gray: always eligible
 *   - orange: 3+ days since last_reviewed
 *   - yellow: 7+ days since last_reviewed
 *   - green: 14+ days since last_reviewed
 * - Daily selection ratio: 50% new, 40% review (orange/yellow), 10% mastered (green)
 * - User configures 3-5 problems per day
 *
 * Test Coverage:
 * - getEligibleNew(): Returns gray problems, excludes today's selections
 * - getEligibleReview(): Returns orange (3+ days) and yellow (7+ days), excludes today's selections
 * - getEligibleMastered(): Returns green (14+ days), excludes today's selections
 * - selectDailyProblems(): Ratio distribution, empty pool handling, respects settings, random selection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { initializeDatabase, getDatabase } from '../../db/index.js';
import {
  getEligibleNew,
  getEligibleReview,
  getEligibleMastered,
  selectDailyProblems,
} from '../selection.js';

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
  name: string,
  color: string,
  lastReviewed: string | null = null
): number {
  const db = getDatabase();
  const result = db
    .prepare(
      `INSERT INTO problems (name, link, color, last_reviewed) VALUES (?, ?, ?, ?)`
    )
    .run(name, `https://leetcode.com/problems/${name}`, color, lastReviewed);
  return result.lastInsertRowid as number;
}

/**
 * Helper function to mark a problem as selected for today
 */
function markAsSelectedToday(problemId: number): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
  ).run(problemId, getToday());
}

beforeEach(() => {
  initializeDatabase(':memory:');
});

describe('getEligibleNew', () => {
  it('should return all gray problems when none are selected today', () => {
    insertProblem('Two Sum', 'gray');
    insertProblem('Valid Parentheses', 'gray');
    insertProblem('Merge Intervals', 'orange'); // Not gray

    const eligible = getEligibleNew(getDatabase());

    expect(eligible).toHaveLength(2);
    expect(eligible.map((p) => p.name)).toContain('Two Sum');
    expect(eligible.map((p) => p.name)).toContain('Valid Parentheses');
    expect(eligible.every((p) => p.color === 'gray')).toBe(true);
  });

  it('should exclude gray problems selected for today', () => {
    const id1 = insertProblem('Two Sum', 'gray');
    insertProblem('Valid Parentheses', 'gray');

    markAsSelectedToday(id1);

    const eligible = getEligibleNew(getDatabase());

    expect(eligible).toHaveLength(1);
    expect(eligible[0].name).toBe('Valid Parentheses');
  });

  it('should return empty array when no gray problems exist', () => {
    insertProblem('Two Sum', 'orange');
    insertProblem('Valid Parentheses', 'yellow');

    const eligible = getEligibleNew(getDatabase());

    expect(eligible).toEqual([]);
  });

  it('should return empty array when all gray problems are selected today', () => {
    const id1 = insertProblem('Two Sum', 'gray');
    const id2 = insertProblem('Valid Parentheses', 'gray');

    markAsSelectedToday(id1);
    markAsSelectedToday(id2);

    const eligible = getEligibleNew(getDatabase());

    expect(eligible).toEqual([]);
  });

  it('should include gray problems selected on previous days', () => {
    const id1 = insertProblem('Two Sum', 'gray');
    insertProblem('Valid Parentheses', 'gray');

    // Mark as selected yesterday
    getDatabase().prepare(
      `INSERT INTO daily_selections (problem_id, selected_date) VALUES (?, ?)`
    ).run(id1, getDaysAgo(1));

    const eligible = getEligibleNew(getDatabase());

    expect(eligible).toHaveLength(2);
    expect(eligible.map((p) => p.name)).toContain('Two Sum');
    expect(eligible.map((p) => p.name)).toContain('Valid Parentheses');
  });
});

describe('getEligibleReview', () => {
  it('should return orange problems that are 3+ days old', () => {
    insertProblem('Problem 1', 'orange', getDaysAgo(3)); // Exactly 3 days
    insertProblem('Problem 2', 'orange', getDaysAgo(5)); // More than 3 days
    insertProblem('Problem 3', 'orange', getDaysAgo(2)); // Less than 3 days
    insertProblem('Problem 4', 'orange', null); // Never reviewed

    const eligible = getEligibleReview(getDatabase());

    expect(eligible).toHaveLength(3); // Problem 1, 2, and 4 (null is eligible)
    expect(eligible.map((p) => p.name)).toContain('Problem 1');
    expect(eligible.map((p) => p.name)).toContain('Problem 2');
    expect(eligible.map((p) => p.name)).toContain('Problem 4');
  });

  it('should return yellow problems that are 7+ days old', () => {
    insertProblem('Problem 1', 'yellow', getDaysAgo(7)); // Exactly 7 days
    insertProblem('Problem 2', 'yellow', getDaysAgo(10)); // More than 7 days
    insertProblem('Problem 3', 'yellow', getDaysAgo(5)); // Less than 7 days
    insertProblem('Problem 4', 'yellow', null); // Never reviewed

    const eligible = getEligibleReview(getDatabase());

    expect(eligible).toHaveLength(3); // Problem 1, 2, and 4 (null is eligible)
    expect(eligible.map((p) => p.name)).toContain('Problem 1');
    expect(eligible.map((p) => p.name)).toContain('Problem 2');
    expect(eligible.map((p) => p.name)).toContain('Problem 4');
  });

  it('should return both orange and yellow problems that meet thresholds', () => {
    insertProblem('Orange 1', 'orange', getDaysAgo(3));
    insertProblem('Orange 2', 'orange', getDaysAgo(5));
    insertProblem('Yellow 1', 'yellow', getDaysAgo(7));
    insertProblem('Yellow 2', 'yellow', getDaysAgo(10));

    const eligible = getEligibleReview(getDatabase());

    expect(eligible).toHaveLength(4);
    expect(eligible.filter((p) => p.color === 'orange')).toHaveLength(2);
    expect(eligible.filter((p) => p.color === 'yellow')).toHaveLength(2);
  });

  it('should exclude review problems selected for today', () => {
    insertProblem('Orange 1', 'orange', getDaysAgo(3));
    const id2 = insertProblem('Orange 2', 'orange', getDaysAgo(5));
    insertProblem('Yellow 1', 'yellow', getDaysAgo(7));

    markAsSelectedToday(id2);

    const eligible = getEligibleReview(getDatabase());

    expect(eligible).toHaveLength(2);
    expect(eligible.map((p) => p.name)).toContain('Orange 1');
    expect(eligible.map((p) => p.name)).toContain('Yellow 1');
    expect(eligible.map((p) => p.name)).not.toContain('Orange 2');
  });

  it('should return empty array when no review problems are eligible', () => {
    insertProblem('Orange 1', 'orange', getDaysAgo(1)); // Too recent
    insertProblem('Yellow 1', 'yellow', getDaysAgo(5)); // Too recent
    insertProblem('Green 1', 'green', getDaysAgo(20)); // Not review color

    const eligible = getEligibleReview(getDatabase());

    expect(eligible).toEqual([]);
  });

  it('should not include gray or green problems', () => {
    insertProblem('Gray', 'gray', null);
    insertProblem('Orange', 'orange', getDaysAgo(3));
    insertProblem('Yellow', 'yellow', getDaysAgo(7));
    insertProblem('Green', 'green', getDaysAgo(14));

    const eligible = getEligibleReview(getDatabase());

    expect(eligible).toHaveLength(2);
    expect(eligible.every((p) => p.color === 'orange' || p.color === 'yellow')).toBe(
      true
    );
  });

  it('should handle edge case where last_reviewed is exactly at threshold', () => {
    // Orange threshold is 3 days, yellow is 7 days
    insertProblem('Orange Exact', 'orange', getDaysAgo(3));
    insertProblem('Yellow Exact', 'yellow', getDaysAgo(7));

    const eligible = getEligibleReview(getDatabase());

    expect(eligible).toHaveLength(2);
    expect(eligible.map((p) => p.name)).toContain('Orange Exact');
    expect(eligible.map((p) => p.name)).toContain('Yellow Exact');
  });
});

describe('getEligibleMastered', () => {
  it('should return green problems that are 14+ days old', () => {
    insertProblem('Problem 1', 'green', getDaysAgo(14)); // Exactly 14 days
    insertProblem('Problem 2', 'green', getDaysAgo(20)); // More than 14 days
    insertProblem('Problem 3', 'green', getDaysAgo(10)); // Less than 14 days
    insertProblem('Problem 4', 'green', null); // Never reviewed

    const eligible = getEligibleMastered(getDatabase());

    expect(eligible).toHaveLength(3); // Problem 1, 2, and 4 (null is eligible)
    expect(eligible.map((p) => p.name)).toContain('Problem 1');
    expect(eligible.map((p) => p.name)).toContain('Problem 2');
    expect(eligible.map((p) => p.name)).toContain('Problem 4');
  });

  it('should exclude green problems selected for today', () => {
    insertProblem('Green 1', 'green', getDaysAgo(14));
    const id2 = insertProblem('Green 2', 'green', getDaysAgo(20));
    insertProblem('Green 3', 'green', getDaysAgo(15));

    markAsSelectedToday(id2);

    const eligible = getEligibleMastered(getDatabase());

    expect(eligible).toHaveLength(2);
    expect(eligible.map((p) => p.name)).toContain('Green 1');
    expect(eligible.map((p) => p.name)).toContain('Green 3');
    expect(eligible.map((p) => p.name)).not.toContain('Green 2');
  });

  it('should return empty array when no green problems are eligible', () => {
    insertProblem('Green 1', 'green', getDaysAgo(5)); // Too recent
    insertProblem('Green 2', 'green', getDaysAgo(10)); // Too recent
    insertProblem('Orange 1', 'orange', getDaysAgo(20)); // Not green

    const eligible = getEligibleMastered(getDatabase());

    expect(eligible).toEqual([]);
  });

  it('should only include green problems, not other colors', () => {
    insertProblem('Gray', 'gray', null);
    insertProblem('Orange', 'orange', getDaysAgo(14));
    insertProblem('Yellow', 'yellow', getDaysAgo(14));
    insertProblem('Green', 'green', getDaysAgo(14));

    const eligible = getEligibleMastered(getDatabase());

    expect(eligible).toHaveLength(1);
    expect(eligible[0].name).toBe('Green');
    expect(eligible[0].color).toBe('green');
  });

  it('should handle edge case where last_reviewed is exactly at 14 day threshold', () => {
    insertProblem('Green Exact', 'green', getDaysAgo(14));

    const eligible = getEligibleMastered(getDatabase());

    expect(eligible).toHaveLength(1);
    expect(eligible[0].name).toBe('Green Exact');
  });
});

describe('selectDailyProblems', () => {
  it('should select correct ratio (50% new, 40% review, 10% mastered) for 5 problems', () => {
    // Create plenty of eligible problems
    for (let i = 1; i <= 10; i++) insertProblem(`Gray ${i}`, 'gray');
    for (let i = 1; i <= 10; i++)
      insertProblem(`Orange ${i}`, 'orange', getDaysAgo(5));
    for (let i = 1; i <= 10; i++)
      insertProblem(`Yellow ${i}`, 'yellow', getDaysAgo(10));
    for (let i = 1; i <= 10; i++)
      insertProblem(`Green ${i}`, 'green', getDaysAgo(20));

    const selected = selectDailyProblems(getDatabase());

    expect(selected).toHaveLength(5);

    const grayCount = selected.filter((p) => p.color === 'gray').length;
    const reviewCount = selected.filter(
      (p) => p.color === 'orange' || p.color === 'yellow'
    ).length;
    const greenCount = selected.filter((p) => p.color === 'green').length;

    // 50% of 5 = 2.5 → 3 new (rounded up)
    // 40% of 5 = 2 review
    // 10% of 5 = 0.5 → 0 mastered (rounded down)
    expect(grayCount).toBe(3);
    expect(reviewCount).toBe(2);
    expect(greenCount).toBe(0);
  });

  it('should select correct ratio for 4 problems', () => {
    // Create plenty of eligible problems
    for (let i = 1; i <= 10; i++) insertProblem(`Gray ${i}`, 'gray');
    for (let i = 1; i <= 10; i++)
      insertProblem(`Orange ${i}`, 'orange', getDaysAgo(5));
    for (let i = 1; i <= 10; i++)
      insertProblem(`Green ${i}`, 'green', getDaysAgo(20));

    // Update settings to 4 problems per day
    getDatabase().prepare(`UPDATE settings SET daily_problem_count = 4 WHERE id = 1`).run();

    const selected = selectDailyProblems(getDatabase());

    expect(selected).toHaveLength(4);

    const grayCount = selected.filter((p) => p.color === 'gray').length;
    const reviewCount = selected.filter(
      (p) => p.color === 'orange' || p.color === 'yellow'
    ).length;
    const greenCount = selected.filter((p) => p.color === 'green').length;

    // 50% of 4 = 2 new
    // 40% of 4 = 1.6 → 2 review (rounded up)
    // 10% of 4 = 0.4 → 0 mastered (rounded down)
    expect(grayCount).toBe(2);
    expect(reviewCount).toBe(2);
    expect(greenCount).toBe(0);
  });

  it('should select correct ratio for 3 problems', () => {
    // Create plenty of eligible problems
    for (let i = 1; i <= 10; i++) insertProblem(`Gray ${i}`, 'gray');
    for (let i = 1; i <= 10; i++)
      insertProblem(`Orange ${i}`, 'orange', getDaysAgo(5));
    for (let i = 1; i <= 10; i++)
      insertProblem(`Green ${i}`, 'green', getDaysAgo(20));

    // Update settings to 3 problems per day
    getDatabase().prepare(`UPDATE settings SET daily_problem_count = 3 WHERE id = 1`).run();

    const selected = selectDailyProblems(getDatabase());

    expect(selected).toHaveLength(3);

    const grayCount = selected.filter((p) => p.color === 'gray').length;
    const reviewCount = selected.filter(
      (p) => p.color === 'orange' || p.color === 'yellow'
    ).length;
    const greenCount = selected.filter((p) => p.color === 'green').length;

    // 50% of 3 = 1.5 → 2 new (rounded up)
    // 40% of 3 = 1.2 → 1 review (rounded down)
    // 10% of 3 = 0.3 → 0 mastered (rounded down)
    expect(grayCount).toBe(2);
    expect(reviewCount).toBe(1);
    expect(greenCount).toBe(0);
  });

  it('should redistribute when new pool is empty', () => {
    // No gray problems, plenty of others
    for (let i = 1; i <= 10; i++)
      insertProblem(`Orange ${i}`, 'orange', getDaysAgo(5));
    for (let i = 1; i <= 10; i++)
      insertProblem(`Yellow ${i}`, 'yellow', getDaysAgo(10));
    for (let i = 1; i <= 10; i++)
      insertProblem(`Green ${i}`, 'green', getDaysAgo(20));

    const selected = selectDailyProblems(getDatabase());

    expect(selected).toHaveLength(5);
    expect(selected.filter((p) => p.color === 'gray')).toHaveLength(0);
    // Should redistribute the 3 new slots to review/mastered
    const reviewCount = selected.filter(
      (p) => p.color === 'orange' || p.color === 'yellow'
    ).length;
    const greenCount = selected.filter((p) => p.color === 'green').length;
    expect(reviewCount + greenCount).toBe(5);
  });

  it('should redistribute when review pool is empty', () => {
    // No orange/yellow problems, plenty of others
    for (let i = 1; i <= 10; i++) insertProblem(`Gray ${i}`, 'gray');
    for (let i = 1; i <= 10; i++)
      insertProblem(`Green ${i}`, 'green', getDaysAgo(20));

    const selected = selectDailyProblems(getDatabase());

    expect(selected).toHaveLength(5);
    expect(
      selected.filter((p) => p.color === 'orange' || p.color === 'yellow')
    ).toHaveLength(0);
    // Should redistribute the 2 review slots to new/mastered
    const grayCount = selected.filter((p) => p.color === 'gray').length;
    const greenCount = selected.filter((p) => p.color === 'green').length;
    expect(grayCount + greenCount).toBe(5);
  });

  it('should redistribute when mastered pool is empty', () => {
    // No green problems, plenty of others
    for (let i = 1; i <= 10; i++) insertProblem(`Gray ${i}`, 'gray');
    for (let i = 1; i <= 10; i++)
      insertProblem(`Orange ${i}`, 'orange', getDaysAgo(5));
    for (let i = 1; i <= 10; i++)
      insertProblem(`Yellow ${i}`, 'yellow', getDaysAgo(10));

    const selected = selectDailyProblems(getDatabase());

    expect(selected).toHaveLength(5);
    expect(selected.filter((p) => p.color === 'green')).toHaveLength(0);
    // With default ratio, mastered gets 0 anyway, so this should be normal selection
    const grayCount = selected.filter((p) => p.color === 'gray').length;
    const reviewCount = selected.filter(
      (p) => p.color === 'orange' || p.color === 'yellow'
    ).length;
    expect(grayCount).toBe(3);
    expect(reviewCount).toBe(2);
  });

  it('should handle insufficient problems across all pools', () => {
    // Only 3 total problems available
    insertProblem('Gray 1', 'gray');
    insertProblem('Orange 1', 'orange', getDaysAgo(5));
    insertProblem('Green 1', 'green', getDaysAgo(20));

    const selected = selectDailyProblems(getDatabase());

    // Should return all 3 available problems even though setting is 5
    expect(selected).toHaveLength(3);
  });

  it('should return empty array when no problems are eligible', () => {
    // Create problems that aren't eligible
    insertProblem('Orange Recent', 'orange', getDaysAgo(1));
    insertProblem('Yellow Recent', 'yellow', getDaysAgo(3));
    insertProblem('Green Recent', 'green', getDaysAgo(5));

    const selected = selectDailyProblems(getDatabase());

    expect(selected).toEqual([]);
  });

  it('should return random selection (different results on multiple runs)', () => {
    // Create many eligible problems
    for (let i = 1; i <= 20; i++) insertProblem(`Gray ${i}`, 'gray');

    const selection1 = selectDailyProblems(getDatabase()).map((p) => p.id);

    // Clear the database and recreate
    getDatabase().prepare('DELETE FROM problems').run();
    for (let i = 1; i <= 20; i++) insertProblem(`Gray ${i}`, 'gray');

    const selection2 = selectDailyProblems(getDatabase()).map((p) => p.id);

    // Selections should be different (with 20 problems, selecting 5, probability of same selection is very low)
    // Note: This test has a small chance of false failure, but it's statistically unlikely
    expect(selection1).not.toEqual(selection2);
  });

  it('should respect daily_problem_count setting', () => {
    // Create plenty of problems
    for (let i = 1; i <= 10; i++) insertProblem(`Gray ${i}`, 'gray');
    for (let i = 1; i <= 10; i++)
      insertProblem(`Orange ${i}`, 'orange', getDaysAgo(5));

    // Test with 3 problems
    getDatabase().prepare(`UPDATE settings SET daily_problem_count = 3 WHERE id = 1`).run();
    let selected = selectDailyProblems(getDatabase());
    expect(selected).toHaveLength(3);

    // Clear and test with 4 problems
    getDatabase().prepare('DELETE FROM daily_selections').run();
    getDatabase().prepare(`UPDATE settings SET daily_problem_count = 4 WHERE id = 1`).run();
    selected = selectDailyProblems(getDatabase());
    expect(selected).toHaveLength(4);

    // Clear and test with 5 problems
    getDatabase().prepare('DELETE FROM daily_selections').run();
    getDatabase().prepare(`UPDATE settings SET daily_problem_count = 5 WHERE id = 1`).run();
    selected = selectDailyProblems(getDatabase());
    expect(selected).toHaveLength(5);
  });

  it('should not select the same problem twice', () => {
    // Create problems
    for (let i = 1; i <= 10; i++) insertProblem(`Gray ${i}`, 'gray');
    for (let i = 1; i <= 10; i++)
      insertProblem(`Orange ${i}`, 'orange', getDaysAgo(5));

    const selected = selectDailyProblems(getDatabase());

    // Check for unique IDs
    const ids = selected.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should exclude problems already selected for today', () => {
    // Create problems
    for (let i = 1; i <= 10; i++) insertProblem(`Gray ${i}`, 'gray');

    // Manually select some problems for today
    markAsSelectedToday(1);
    markAsSelectedToday(2);

    const selected = selectDailyProblems(getDatabase());

    // Should not include problems 1 and 2
    expect(selected.map((p) => p.id)).not.toContain(1);
    expect(selected.map((p) => p.id)).not.toContain(2);
  });

  it('should handle edge case with exactly enough problems to meet ratio', () => {
    // Create exactly the right number of problems for 5 total (3 new, 2 review)
    insertProblem('Gray 1', 'gray');
    insertProblem('Gray 2', 'gray');
    insertProblem('Gray 3', 'gray');
    insertProblem('Orange 1', 'orange', getDaysAgo(5));
    insertProblem('Orange 2', 'orange', getDaysAgo(5));

    const selected = selectDailyProblems(getDatabase());

    expect(selected).toHaveLength(5);
    expect(selected.filter((p) => p.color === 'gray')).toHaveLength(3);
    expect(selected.filter((p) => p.color === 'orange')).toHaveLength(2);
  });
});
