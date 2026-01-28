import { stringify } from 'csv-stringify/sync';
import { Problem } from '../db/types.js';

/**
 * CSV field order for export
 */
const CSV_COLUMNS = ['Problem', 'Link', 'Color', 'LastReviewed', 'KeyInsight'];

/**
 * Sanitizes CSV field to prevent formula injection
 * Fields starting with =, +, -, @, tab, or carriage return are prefixed with a single quote
 *
 * Note: Unlike csv-parser which sanitizes after trimming user input, the generator
 * must preserve the exact field values from the database (including leading whitespace)
 * and sanitize them as-is for export.
 */
function sanitizeCSVField(field: string | null): string {
  if (field === null || field === undefined) {
    return '';
  }

  const str = String(field);

  // Check if field starts with dangerous characters WITHOUT trimming first
  // We need to preserve the exact database value and just prefix if dangerous
  if (str.length > 0 && /^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }

  return str;
}

/**
 * Generates CSV content from an array of problems
 *
 * @param problems - Array of Problem objects to export
 * @returns CSV string with header row and data
 *
 * @example
 * ```typescript
 * const problems = [
 *   { id: 1, name: 'Two Sum', link: 'https://leetcode.com/problems/two-sum',
 *     color: 'gray', key_insight: 'Use hash map', last_reviewed: null, created_at: '2024-01-01' }
 * ];
 *
 * const csv = generateCSV(problems);
 * console.log(csv);
 * // Output:
 * // Problem,Link,Color,LastReviewed,KeyInsight
 * // Two Sum,https://leetcode.com/problems/two-sum,gray,,'Use hash map'
 * ```
 */
export function generateCSV(problems: Problem[]): string {
  // Handle empty array
  if (problems.length === 0) {
    // Return just the header row
    return stringify([CSV_COLUMNS]);
  }

  // Transform problems into CSV records
  const records = problems.map(problem => ({
    Problem: sanitizeCSVField(problem.name),
    Link: sanitizeCSVField(problem.link),
    Color: sanitizeCSVField(problem.color),
    LastReviewed: sanitizeCSVField(problem.last_reviewed),
    KeyInsight: sanitizeCSVField(problem.key_insight),
  }));

  // Generate CSV with header
  return stringify(records, {
    header: true,
    columns: CSV_COLUMNS,
  });
}
