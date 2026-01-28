/**
 * Unit Tests for CSV Generator Service
 *
 * Tests the generateCSV function that converts Problem[] to CSV format.
 * Following TDD principles - these tests are written BEFORE implementation.
 *
 * Test Coverage:
 * - Empty array handling (headers only)
 * - Null value handling (LastReviewed, KeyInsight)
 * - CSV escaping (quotes, commas, newlines)
 * - CSV injection prevention (=, +, -, @, tab, CR)
 * - Field order verification
 * - Multiple problems with various data
 */

import { describe, it, expect } from 'vitest';
import { generateCSV } from './csv-generator.js';
import type { Problem } from '../db/types.js';

describe('generateCSV', () => {
  describe('Empty and null handling', () => {
    it('should return headers only when given empty array', () => {
      const problems: Problem[] = [];
      const result = generateCSV(problems);

      expect(result).toBe('Problem,Link,Color,LastReviewed,KeyInsight\n');
    });

    it('should handle null LastReviewed and KeyInsight fields', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Two Sum',
          link: 'https://leetcode.com/problems/two-sum',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[0]).toBe('Problem,Link,Color,LastReviewed,KeyInsight');
      expect(lines[1]).toBe('Two Sum,https://leetcode.com/problems/two-sum,gray,,');
    });

    it('should handle null LastReviewed with non-null KeyInsight', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Valid Parentheses',
          link: 'https://leetcode.com/problems/valid-parentheses',
          color: 'yellow',
          key_insight: 'Use a stack',
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toBe('Valid Parentheses,https://leetcode.com/problems/valid-parentheses,yellow,,Use a stack');
    });

    it('should handle non-null LastReviewed with null KeyInsight', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Merge Intervals',
          link: 'https://leetcode.com/problems/merge-intervals',
          color: 'orange',
          key_insight: null,
          last_reviewed: '2024-01-15',
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toBe('Merge Intervals,https://leetcode.com/problems/merge-intervals,orange,2024-01-15,');
    });
  });

  describe('CSV escaping', () => {
    it('should escape double quotes in problem names', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Find "Best" Solution',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      // Quotes should be escaped by doubling them and field wrapped in quotes
      expect(lines[1]).toBe('"Find ""Best"" Solution",https://leetcode.com/problems/test,gray,,');
    });

    it('should wrap fields containing commas in quotes', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Problem A, B, C',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: 'Use arrays, maps, and sets',
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toBe('"Problem A, B, C",https://leetcode.com/problems/test,gray,,"Use arrays, maps, and sets"');
    });

    it('should wrap fields containing newlines in quotes', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Multi\nLine\nName',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: 'Step 1: Sort\nStep 2: Iterate',
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      // The newline in the name means we need to parse carefully
      expect(result).toContain('"Multi\nLine\nName"');
      expect(result).toContain('"Step 1: Sort\nStep 2: Iterate"');
    });

    it('should handle combination of quotes, commas, and newlines', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Complex "test", with\nnewline',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: 'Insight with "quotes", commas, and\nnewlines',
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);

      // Should escape quotes and wrap entire field
      expect(result).toContain('"Complex ""test"", with\nnewline"');
      expect(result).toContain('"Insight with ""quotes"", commas, and\nnewlines"');
    });
  });

  describe('CSV injection prevention', () => {
    it('should prefix formula starting with = with single quote', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: '=SUM(A1:A10)',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toContain("'=SUM(A1:A10)");
    });

    it('should prefix formula starting with + with single quote', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Normal Name',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: '+2+2',
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toContain("'+2+2");
    });

    it('should prefix formula starting with - with single quote', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: '-1234',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toContain("'-1234");
    });

    it('should prefix formula starting with @ with single quote', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Safe Name',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: '@IMPORTDATA("malicious.com")',
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toContain("'@IMPORTDATA");
    });

    it('should prefix formula starting with tab with single quote', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: '\t=1+1',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toContain("'\t=1+1");
    });

    it('should prefix formula starting with carriage return with single quote', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: '\r=SUM(1,2)',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toContain("'\r=SUM(1,2)");
    });

    it('should not prefix normal text that contains formula characters in middle', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Add 1+1 equals 2',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: 'x-y coordinates',
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      // Should not have single quote prefix since + is not at start
      expect(lines[1]).not.toContain("'Add 1+1");
      expect(lines[1]).toContain('Add 1+1 equals 2');
      expect(lines[1]).toContain('x-y coordinates');
    });
  });

  describe('Field order', () => {
    it('should output fields in exact order: Problem,Link,Color,LastReviewed,KeyInsight', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Test Problem',
          link: 'https://leetcode.com/problems/test',
          color: 'yellow',
          key_insight: 'Test insight',
          last_reviewed: '2024-01-15',
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[0]).toBe('Problem,Link,Color,LastReviewed,KeyInsight');
      expect(lines[1]).toBe('Test Problem,https://leetcode.com/problems/test,yellow,2024-01-15,Test insight');
    });
  });

  describe('Multiple problems', () => {
    it('should handle multiple problems with varying data', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Two Sum',
          link: 'https://leetcode.com/problems/two-sum',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
        {
          id: 2,
          name: 'Valid Parentheses',
          link: 'https://leetcode.com/problems/valid-parentheses',
          color: 'yellow',
          key_insight: 'Use a stack',
          last_reviewed: '2024-01-15',
          created_at: '2024-01-02T10:00:00.000Z',
        },
        {
          id: 3,
          name: 'Merge Intervals',
          link: 'https://leetcode.com/problems/merge-intervals',
          color: 'green',
          key_insight: 'Sort by start time',
          last_reviewed: '2024-01-20',
          created_at: '2024-01-03T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n').filter(line => line.length > 0);

      expect(lines).toHaveLength(4); // 1 header + 3 data rows
      expect(lines[0]).toBe('Problem,Link,Color,LastReviewed,KeyInsight');
      expect(lines[1]).toBe('Two Sum,https://leetcode.com/problems/two-sum,gray,,');
      expect(lines[2]).toBe('Valid Parentheses,https://leetcode.com/problems/valid-parentheses,yellow,2024-01-15,Use a stack');
      expect(lines[3]).toBe('Merge Intervals,https://leetcode.com/problems/merge-intervals,green,2024-01-20,Sort by start time');
    });

    it('should handle multiple problems with special characters', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Problem with "quotes"',
          link: 'https://leetcode.com/problems/test-1',
          color: 'gray',
          key_insight: 'Simple insight',
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
        {
          id: 2,
          name: 'Problem, with, commas',
          link: 'https://leetcode.com/problems/test-2',
          color: 'orange',
          key_insight: null,
          last_reviewed: '2024-01-10',
          created_at: '2024-01-02T10:00:00.000Z',
        },
        {
          id: 3,
          name: '=FORMULA',
          link: 'https://leetcode.com/problems/test-3',
          color: 'yellow',
          key_insight: '+INJECT',
          last_reviewed: '2024-01-15',
          created_at: '2024-01-03T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n').filter(line => line.length > 0);

      expect(lines).toHaveLength(4);
      expect(lines[1]).toContain('"Problem with ""quotes"""');
      expect(lines[2]).toContain('"Problem, with, commas"');
      expect(lines[3]).toContain("'=FORMULA");
      expect(lines[3]).toContain("'+INJECT");
    });
  });

  describe('All color types', () => {
    it('should correctly output all valid color values', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Gray Problem',
          link: 'https://leetcode.com/problems/gray',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
        {
          id: 2,
          name: 'Orange Problem',
          link: 'https://leetcode.com/problems/orange',
          color: 'orange',
          key_insight: null,
          last_reviewed: '2024-01-10',
          created_at: '2024-01-02T10:00:00.000Z',
        },
        {
          id: 3,
          name: 'Yellow Problem',
          link: 'https://leetcode.com/problems/yellow',
          color: 'yellow',
          key_insight: null,
          last_reviewed: '2024-01-15',
          created_at: '2024-01-03T10:00:00.000Z',
        },
        {
          id: 4,
          name: 'Green Problem',
          link: 'https://leetcode.com/problems/green',
          color: 'green',
          key_insight: 'Mastered!',
          last_reviewed: '2024-01-20',
          created_at: '2024-01-04T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n').filter(line => line.length > 0);

      expect(lines[1]).toContain(',gray,');
      expect(lines[2]).toContain(',orange,');
      expect(lines[3]).toContain(',yellow,');
      expect(lines[4]).toContain(',green,');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string values correctly', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Normal Name',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: '', // Empty string (should be treated as null/empty)
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      // Empty string should result in empty field
      expect(lines[1]).toBe('Normal Name,https://leetcode.com/problems/test,gray,,');
    });

    it('should handle very long problem names', () => {
      const longName = 'A'.repeat(500);
      const problems: Problem[] = [
        {
          id: 1,
          name: longName,
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toContain(longName);
      expect(lines[1]).toContain('https://leetcode.com/problems/test');
    });

    it('should handle very long URLs', () => {
      const longUrl = 'https://leetcode.com/problems/' + 'a'.repeat(2000);
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Test',
          link: longUrl,
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);
      const lines = result.split('\n');

      expect(lines[1]).toContain(longUrl);
    });

    it('should handle very long key insights', () => {
      const longInsight = 'This is a very detailed insight. '.repeat(100);
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Test',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: longInsight,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);

      expect(result).toContain(longInsight);
    });

    it('should end CSV with newline character', () => {
      const problems: Problem[] = [
        {
          id: 1,
          name: 'Test',
          link: 'https://leetcode.com/problems/test',
          color: 'gray',
          key_insight: null,
          last_reviewed: null,
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ];

      const result = generateCSV(problems);

      expect(result.endsWith('\n')).toBe(true);
    });
  });
});
