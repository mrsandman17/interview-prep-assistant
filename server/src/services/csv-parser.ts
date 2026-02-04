import { parse } from 'csv-parse/sync';
import { ProblemColor } from '../db/types';

/**
 * Represents a successfully parsed problem from CSV
 */
export interface ParsedProblem {
  name: string;
  link: string;
  color: ProblemColor;
  last_reviewed: string | null;
  key_insight: string | null;
  topic_names: string[];
}

/**
 * Represents a parsing error for a specific row
 */
export interface ParseError {
  row: number;
  error: string;
}

/**
 * Result of CSV parsing operation
 */
export interface ParseResult {
  success: ParsedProblem[];
  errors: ParseError[];
}

/**
 * Valid color values for problem status
 */
const VALID_COLORS: readonly ProblemColor[] = ['gray', 'orange', 'yellow', 'green'];

/**
 * Maximum field lengths for validation
 */
const MAX_NAME_LENGTH = 500;
const MAX_INSIGHT_LENGTH = 5000;
const MAX_URL_LENGTH = 2048;

/**
 * Validates if a string is a valid color value
 */
function isValidColor(color: string): color is ProblemColor {
  return VALID_COLORS.includes(color as ProblemColor);
}

/**
 * Sanitizes CSV field to prevent formula injection
 * Fields starting with =, +, -, @, tab, or carriage return are prefixed with a single quote
 */
function sanitizeCSVField(field: string): string {
  const trimmed = field.trim();
  if (trimmed.length > 0 && /^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Validates if a string is a valid ISO date format (YYYY-MM-DD)
 */
function isValidISODate(dateString: string): boolean {
  // Check format with regex
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  // Parse the date components
  const [year, month, day] = dateString.split('-').map(Number);

  // Check for invalid month or day values
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Create a date object and verify it represents the same date
  // Use UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month - 1, day));

  if (isNaN(date.getTime())) {
    return false;
  }

  // Ensure the date components match (catches invalid dates like Feb 30)
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validates if a string is a valid HTTP or HTTPS URL
 */
function isValidURL(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Parses CSV content and returns validated problems and errors
 *
 * @param csvContent - Raw CSV string content
 * @returns ParseResult containing successful parses and errors
 *
 * @example
 * ```typescript
 * const csv = `Problem,Link,Color,LastReviewed,KeyInsight
 * Two Sum,https://leetcode.com/problems/two-sum,gray,,Use hash map`;
 *
 * const result = parseCSV(csv);
 * console.log(result.success); // Array of ParsedProblem
 * console.log(result.errors);  // Array of ParseError
 * ```
 */
export function parseCSV(csvContent: string): ParseResult {
  const success: ParsedProblem[] = [];
  const errors: ParseError[] = [];

  // Handle empty input
  const trimmedContent = csvContent.trim();
  if (!trimmedContent) {
    return { success, errors };
  }

  // Track seen links to detect duplicates (normalized for comparison)
  const seenLinks = new Set<string>();

  try {
    // Parse CSV with csv-parse library
    const records = parse(trimmedContent, {
      columns: (header: string[]) => {
        // Normalize headers to lowercase for case-insensitive matching
        return header.map(h => h.toLowerCase().trim());
      },
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true, // Allow rows with fewer columns
    });

    // Process each record (row number starts at 2 because row 1 is header)
    records.forEach((record: any, index: number) => {
      const rowNumber = index + 2;

      // Extract and trim fields
      const nameRaw = record.problem?.trim() || '';
      const linkRaw = record.link?.trim() || '';
      const colorRaw = record.color?.trim() || '';
      const lastReviewedRaw = record.lastreviewed?.trim() || '';
      const keyInsightRaw = record.keyinsight?.trim() || '';
      const topicsRaw = record.topics?.trim() || '';

      // Sanitize fields for CSV injection
      const name = sanitizeCSVField(nameRaw);
      const link = sanitizeCSVField(linkRaw);
      const keyInsightSanitized = sanitizeCSVField(keyInsightRaw);

      // Validate required fields
      if (!name) {
        errors.push({
          row: rowNumber,
          error: 'Problem name is required',
        });
        return;
      }

      if (!link) {
        errors.push({
          row: rowNumber,
          error: 'Link is required',
        });
        return;
      }

      // Validate field lengths
      if (name.length > MAX_NAME_LENGTH) {
        errors.push({
          row: rowNumber,
          error: `Problem name exceeds maximum length of ${MAX_NAME_LENGTH} characters`,
        });
        return;
      }

      if (link.length > MAX_URL_LENGTH) {
        errors.push({
          row: rowNumber,
          error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters`,
        });
        return;
      }

      if (keyInsightSanitized && keyInsightSanitized.length > MAX_INSIGHT_LENGTH) {
        errors.push({
          row: rowNumber,
          error: `Key insight exceeds maximum length of ${MAX_INSIGHT_LENGTH} characters`,
        });
        return;
      }

      // Validate URL format
      if (!isValidURL(link)) {
        errors.push({
          row: rowNumber,
          error: 'Invalid URL format. Must be http:// or https://',
        });
        return;
      }

      // Normalize URL for duplicate detection (lowercase + remove trailing slash)
      const normalizedLink = link.toLowerCase().replace(/\/$/, '');

      // Check for duplicate links
      if (seenLinks.has(normalizedLink)) {
        errors.push({
          row: rowNumber,
          error: `Duplicate link: ${link}`,
        });
        return;
      }

      // Validate color (fail loudly for invalid values, default to gray if empty)
      let color: ProblemColor;
      if (colorRaw) {
        if (!isValidColor(colorRaw)) {
          errors.push({
            row: rowNumber,
            error: `Invalid color: ${colorRaw}. Must be one of: gray, orange, yellow, green`,
          });
          return;
        }
        color = colorRaw;
      } else {
        color = 'gray'; // Default to gray if empty
      }

      // Validate date format if provided
      let lastReviewed: string | null = null;
      if (lastReviewedRaw) {
        if (!isValidISODate(lastReviewedRaw)) {
          errors.push({
            row: rowNumber,
            error: `Invalid date format: ${lastReviewedRaw}. Expected YYYY-MM-DD`,
          });
          return;
        }
        lastReviewed = lastReviewedRaw;
      }

      // Handle key_insight (can be empty)
      const keyInsight: string | null = keyInsightSanitized || null;

      // Parse topics (comma-separated, optional)
      const topicNames: string[] = topicsRaw
        ? topicsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

      // Add normalized link to seen links
      seenLinks.add(normalizedLink);

      // Add successful parse (with original link, not normalized)
      success.push({
        name,
        link,
        color,
        last_reviewed: lastReviewed,
        key_insight: keyInsight,
        topic_names: topicNames,
      });
    });
  } catch (error) {
    // If CSV parsing itself fails, return structured error with row 0
    // This handles completely malformed CSV
    return {
      success: [],
      errors: [{
        row: 0,
        error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
      }]
    };
  }

  return { success, errors };
}
