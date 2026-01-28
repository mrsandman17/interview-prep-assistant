/**
 * Comprehensive tests for API client
 * Tests all API methods, error handling, request/response parsing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { problemsApi, dailyApi, statsApi, settingsApi } from '../client';
import type {
  Problem,
  DailySelection,
  Stats,
  Settings,
  ImportProblemsResponse,
} from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('problemsApi', () => {
    describe('getAll', () => {
      it('should fetch all problems successfully', async () => {
        const mockProblems: Problem[] = [
          {
            id: 1,
            name: 'Two Sum',
            link: 'https://leetcode.com/problems/two-sum',
            color: 'gray',
            keyInsight: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
          {
            id: 2,
            name: 'Valid Parentheses',
            link: 'https://leetcode.com/problems/valid-parentheses',
            color: 'orange',
            keyInsight: 'Use a stack',
            createdAt: '2025-01-02T00:00:00Z',
            updatedAt: '2025-01-02T00:00:00Z',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockProblems,
        });

        const result = await problemsApi.getAll();

        expect(mockFetch).toHaveBeenCalledWith('/api/problems', {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(mockProblems);
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(problemsApi.getAll()).rejects.toThrow('Network error');
      });

      it('should handle 404 errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ error: 'Problems not found' }),
        });

        await expect(problemsApi.getAll()).rejects.toThrow('Problems not found');
      });

      it('should handle 500 errors with fallback message', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        await expect(problemsApi.getAll()).rejects.toThrow('HTTP 500: Internal Server Error');
      });
    });

    describe('create', () => {
      it('should create a new problem successfully', async () => {
        const newProblem = {
          name: 'Reverse String',
          link: 'https://leetcode.com/problems/reverse-string',
          keyInsight: 'Two pointers',
        };

        const createdProblem: Problem = {
          id: 3,
          ...newProblem,
          color: 'gray' as const,
          createdAt: '2025-01-03T00:00:00Z',
          updatedAt: '2025-01-03T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createdProblem,
        });

        const result = await problemsApi.create(newProblem);

        expect(mockFetch).toHaveBeenCalledWith('/api/problems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProblem),
        });
        expect(result).toEqual(createdProblem);
      });

      it('should handle validation errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Invalid problem data' }),
        });

        await expect(
          problemsApi.create({ name: '', link: '', keyInsight: '' })
        ).rejects.toThrow('Invalid problem data');
      });
    });

    describe('importCSV', () => {
      it('should import problems from CSV successfully', async () => {
        const csvContent = 'name,link\nTwo Sum,https://leetcode.com/problems/two-sum';
        const response: ImportProblemsResponse = {
          imported: 1,
          skipped: 0,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => response,
        });

        const result = await problemsApi.importCSV(csvContent);

        expect(mockFetch).toHaveBeenCalledWith('/api/problems/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvContent }),
        });
        expect(result).toEqual(response);
      });

      it('should handle import errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Invalid CSV format' }),
        });

        await expect(problemsApi.importCSV('invalid csv')).rejects.toThrow(
          'Invalid CSV format'
        );
      });
    });

    describe('getById', () => {
      it('should fetch a single problem by ID', async () => {
        const problem: Problem = {
          id: 1,
          name: 'Two Sum',
          link: 'https://leetcode.com/problems/two-sum',
          color: 'green',
          keyInsight: 'Use a hash map',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-03T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => problem,
        });

        const result = await problemsApi.getById(1);

        expect(mockFetch).toHaveBeenCalledWith('/api/problems/1', {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(problem);
      });

      it('should handle not found errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ error: 'Problem not found' }),
        });

        await expect(problemsApi.getById(999)).rejects.toThrow('Problem not found');
      });
    });

    describe('update', () => {
      it('should update a problem successfully', async () => {
        const updates = {
          color: 'yellow' as const,
          keyInsight: 'Updated insight',
        };

        const updatedProblem: Problem = {
          id: 1,
          name: 'Two Sum',
          link: 'https://leetcode.com/problems/two-sum',
          color: 'yellow',
          keyInsight: 'Updated insight',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-03T00:00:00Z',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => updatedProblem,
        });

        const result = await problemsApi.update(1, updates);

        expect(mockFetch).toHaveBeenCalledWith('/api/problems/1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        expect(result).toEqual(updatedProblem);
      });

      it('should handle update errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Invalid update data' }),
        });

        await expect(problemsApi.update(1, {})).rejects.toThrow('Invalid update data');
      });
    });

    describe('exportCSV', () => {
      it('should export problems as CSV string successfully', async () => {
        const mockCSVContent = 'name,link,color,key_insight\nTwo Sum,https://leetcode.com/problems/two-sum,gray,Use hash map\nValid Parentheses,https://leetcode.com/problems/valid-parentheses,orange,Use a stack';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => mockCSVContent,
        });

        const result = await problemsApi.exportCSV();

        expect(mockFetch).toHaveBeenCalledWith('/api/problems/export', {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toBe(mockCSVContent);
      });

      it('should call response.text() not response.json() for CSV', async () => {
        const mockCSVContent = 'name,link,color,key_insight\nTwo Sum,https://leetcode.com/problems/two-sum,gray,';

        const textMock = vi.fn().mockResolvedValue(mockCSVContent);
        const jsonMock = vi.fn();

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: textMock,
          json: jsonMock,
        });

        await problemsApi.exportCSV();

        expect(textMock).toHaveBeenCalledTimes(1);
        expect(jsonMock).not.toHaveBeenCalled();
      });

      it('should handle empty CSV export (no problems)', async () => {
        const mockCSVContent = 'name,link,color,key_insight';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => mockCSVContent,
        });

        const result = await problemsApi.exportCSV();

        expect(result).toBe(mockCSVContent);
        expect(result).toContain('name,link,color,key_insight');
      });

      it('should handle export errors with 500 status', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Failed to export problems' }),
        });

        await expect(problemsApi.exportCSV()).rejects.toThrow('Failed to export problems');
      });

      it('should handle export errors with generic fallback message', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        await expect(problemsApi.exportCSV()).rejects.toThrow('HTTP 500: Internal Server Error');
      });

      it('should handle network errors during export', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(problemsApi.exportCSV()).rejects.toThrow('Network error');
      });

      it('should preserve CSV formatting with special characters', async () => {
        const mockCSVContent = 'name,link,color,key_insight\n"Problem, with comma","https://leetcode.com/problems/test",green,"Use ""quotes"" properly"';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => mockCSVContent,
        });

        const result = await problemsApi.exportCSV();

        expect(result).toBe(mockCSVContent);
        expect(result).toContain('"Problem, with comma"');
        expect(result).toContain('"Use ""quotes"" properly"');
      });
    });
  });

  describe('dailyApi', () => {
    describe('getToday', () => {
      it('should fetch today\'s selection successfully', async () => {
        const dailySelection: DailySelection = {
          problems: [
            {
              id: 1,
              name: 'Two Sum',
              link: 'https://leetcode.com/problems/two-sum',
              color: 'gray',
              keyInsight: null,
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z',
              selectionId: 1,
              completed: false,
            },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => dailySelection,
        });

        const result = await dailyApi.getToday();

        expect(mockFetch).toHaveBeenCalledWith('/api/daily', {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(dailySelection);
      });

      it('should handle errors when fetching daily selection', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Failed to create daily selection' }),
        });

        await expect(dailyApi.getToday()).rejects.toThrow(
          'Failed to create daily selection'
        );
      });
    });

    describe('completeProblem', () => {
      it('should mark a problem as complete with orange result', async () => {
        const response = {
          problem: {
            id: 1,
            name: 'Two Sum',
            link: 'https://leetcode.com/problems/two-sum',
            color: 'orange' as const,
            keyInsight: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-03T00:00:00Z',
            selectionId: 1,
            completed: true,
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => response,
        });

        const result = await dailyApi.completeProblem(1, 'orange');

        expect(mockFetch).toHaveBeenCalledWith('/api/daily/1/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ colorResult: 'orange' }),
        });
        expect(result).toEqual(response);
      });

      it('should mark a problem as complete with green result', async () => {
        const response = {
          problem: {
            id: 1,
            name: 'Two Sum',
            link: 'https://leetcode.com/problems/two-sum',
            color: 'green' as const,
            keyInsight: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-03T00:00:00Z',
            selectionId: 1,
            completed: true,
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => response,
        });

        const result = await dailyApi.completeProblem(1, 'green');

        expect(result.problem.color).toBe('green');
        expect(result.problem.completed).toBe(true);
      });

      it('should handle completion errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ error: 'Problem not in today\'s selection' }),
        });

        await expect(dailyApi.completeProblem(999, 'green')).rejects.toThrow(
          'Problem not in today\'s selection'
        );
      });
    });

    describe('refresh', () => {
      it('should refresh today\'s selection successfully', async () => {
        const newSelection: DailySelection = {
          problems: [
            {
              id: 2,
              name: 'Valid Parentheses',
              link: 'https://leetcode.com/problems/valid-parentheses',
              color: 'orange',
              keyInsight: null,
              createdAt: '2025-01-02T00:00:00Z',
              updatedAt: '2025-01-02T00:00:00Z',
              selectionId: 2,
              completed: false,
            },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => newSelection,
        });

        const result = await dailyApi.refresh();

        expect(mockFetch).toHaveBeenCalledWith('/api/daily/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(newSelection);
      });

      it('should handle refresh errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Failed to refresh selection' }),
        });

        await expect(dailyApi.refresh()).rejects.toThrow('Failed to refresh selection');
      });
    });
  });

  describe('statsApi', () => {
    describe('get', () => {
      it('should fetch statistics successfully', async () => {
        const stats: Stats = {
          totalProblems: 50,
          greenProblems: 15,
          currentStreak: 7,
          readyForReview: 12,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => stats,
        });

        const result = await statsApi.get();

        expect(mockFetch).toHaveBeenCalledWith('/api/stats', {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(stats);
      });

      it('should handle stats fetch errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Failed to calculate statistics' }),
        });

        await expect(statsApi.get()).rejects.toThrow('Failed to calculate statistics');
      });

      it('should handle zero values correctly', async () => {
        const stats: Stats = {
          totalProblems: 0,
          greenProblems: 0,
          currentStreak: 0,
          readyForReview: 0,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => stats,
        });

        const result = await statsApi.get();

        expect(result.totalProblems).toBe(0);
        expect(result.greenProblems).toBe(0);
      });
    });
  });

  describe('settingsApi', () => {
    describe('get', () => {
      it('should fetch settings successfully', async () => {
        const settings: Settings = {
          dailyProblemCount: 4,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => settings,
        });

        const result = await settingsApi.get();

        expect(mockFetch).toHaveBeenCalledWith('/api/settings', {
          headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(settings);
      });

      it('should handle settings fetch errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Failed to fetch settings' }),
        });

        await expect(settingsApi.get()).rejects.toThrow('Failed to fetch settings');
      });
    });

    describe('update', () => {
      it('should update settings successfully', async () => {
        const updates = { dailyProblemCount: 5 };
        const updatedSettings: Settings = {
          dailyProblemCount: 5,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => updatedSettings,
        });

        const result = await settingsApi.update(updates);

        expect(mockFetch).toHaveBeenCalledWith('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        expect(result).toEqual(updatedSettings);
      });

      it('should handle validation errors for invalid daily count', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'Daily problem count must be between 3 and 10' }),
        });

        await expect(settingsApi.update({ dailyProblemCount: 15 })).rejects.toThrow(
          'Daily problem count must be between 3 and 10'
        );
      });

      it('should update settings with minimum value (3)', async () => {
        const updates = { dailyProblemCount: 3 };
        const updatedSettings: Settings = {
          dailyProblemCount: 3,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => updatedSettings,
        });

        const result = await settingsApi.update(updates);
        expect(result.dailyProblemCount).toBe(3);
      });

      it('should update settings with maximum value (5)', async () => {
        const updates = { dailyProblemCount: 5 };
        const updatedSettings: Settings = {
          dailyProblemCount: 5,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => updatedSettings,
        });

        const result = await settingsApi.update(updates);
        expect(result.dailyProblemCount).toBe(5);
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle response with no error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      try {
        await problemsApi.getAll();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // When error object is empty, it should use the fallback HTTP status message
        expect((error as Error).message).toBe('HTTP 500: Internal Server Error');
      }
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(problemsApi.getAll()).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(problemsApi.getAll()).rejects.toThrow('Request timeout');
    });

    it('should handle CORS errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(problemsApi.getAll()).rejects.toThrow('Failed to fetch');
    });
  });
});
