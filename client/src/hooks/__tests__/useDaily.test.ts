/**
 * Tests for useDaily custom hook
 * Tests daily selection fetching, problem completion, and selection refresh
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDaily } from '../useDaily';
import { dailyApi } from '../../api/client';
import type { DailyProblem, DailySelection } from '../../api/types';

// Mock the API client
vi.mock('../../api/client', () => ({
  dailyApi: {
    getToday: vi.fn(),
    completeProblem: vi.fn(),
    refresh: vi.fn(),
  },
}));

describe('useDaily', () => {
  const mockDailyProblems: DailyProblem[] = [
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
    {
      id: 2,
      name: 'Valid Parentheses',
      link: 'https://leetcode.com/problems/valid-parentheses',
      color: 'orange',
      keyInsight: 'Use a stack',
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      selectionId: 2,
      completed: false,
    },
  ];

  const mockDailySelection: DailySelection = {
    problems: mockDailyProblems,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial fetch', () => {
    it('should initialize with loading state', () => {
      vi.mocked(dailyApi.getToday).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useDaily());

      expect(result.current.loading).toBe(true);
      expect(result.current.problems).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should fetch daily selection successfully on mount', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.problems).toEqual(mockDailyProblems);
      expect(result.current.error).toBe(null);
      expect(dailyApi.getToday).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Failed to fetch daily selection';
      vi.mocked(dailyApi.getToday).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.problems).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle non-Error thrown values', async () => {
      vi.mocked(dailyApi.getToday).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch daily selection');
    });

    it('should handle empty daily selection', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce({ problems: [] });

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.problems).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('completeProblem', () => {
    it('should complete a problem with orange result', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const completedProblem: DailyProblem = {
        ...mockDailyProblems[0],
        color: 'orange',
        completed: true,
      };

      vi.mocked(dailyApi.completeProblem).mockResolvedValueOnce({
        problem: completedProblem,
      });

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Complete the first problem
      await act(async () => {
        await result.current.completeProblem(1, 'orange');
      });

      expect(dailyApi.completeProblem).toHaveBeenCalledWith(1, 'orange');
      expect(result.current.problems[0]).toEqual(completedProblem);
      expect(result.current.problems[0].completed).toBe(true);
      expect(result.current.problems[0].color).toBe('orange');
      expect(result.current.error).toBe(null);
    });

    it('should complete a problem with yellow result', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const completedProblem: DailyProblem = {
        ...mockDailyProblems[1],
        color: 'yellow',
        completed: true,
      };

      vi.mocked(dailyApi.completeProblem).mockResolvedValueOnce({
        problem: completedProblem,
      });

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.completeProblem(2, 'yellow');
      });

      expect(result.current.problems[1].color).toBe('yellow');
      expect(result.current.problems[1].completed).toBe(true);
    });

    it('should complete a problem with green result', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const completedProblem: DailyProblem = {
        ...mockDailyProblems[0],
        color: 'green',
        completed: true,
      };

      vi.mocked(dailyApi.completeProblem).mockResolvedValueOnce({
        problem: completedProblem,
      });

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.completeProblem(1, 'green');
      });

      expect(result.current.problems[0].color).toBe('green');
      expect(result.current.problems[0].completed).toBe(true);
    });

    it('should handle completion errors and set error state', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const errorMessage = 'Failed to complete problem';
      vi.mocked(dailyApi.completeProblem).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // completeProblem should reject
      await act(async () => {
        try {
          await result.current.completeProblem(1, 'green');
        } catch (error) {
          // Error is expected
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe(errorMessage);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      // Problems should remain unchanged
      expect(result.current.problems).toEqual(mockDailyProblems);
    });

    it('should handle non-Error completion errors', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);
      vi.mocked(dailyApi.completeProblem).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.completeProblem(1, 'green');
        } catch (error) {
          // Error is expected
          expect(error).toBe('String error');
        }
      });

      expect(result.current.error).toBe('Failed to complete problem');
    });

    it('should only update the specific problem that was completed', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const completedProblem: DailyProblem = {
        ...mockDailyProblems[0],
        color: 'green',
        completed: true,
      };

      vi.mocked(dailyApi.completeProblem).mockResolvedValueOnce({
        problem: completedProblem,
      });

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.completeProblem(1, 'green');
      });

      // First problem should be updated
      expect(result.current.problems[0].completed).toBe(true);
      expect(result.current.problems[0].color).toBe('green');

      // Second problem should remain unchanged
      expect(result.current.problems[1].completed).toBe(false);
      expect(result.current.problems[1].color).toBe('orange');
    });

    it('should clear previous errors when completing successfully', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First completion fails
      vi.mocked(dailyApi.completeProblem).mockRejectedValueOnce(
        new Error('First error')
      );

      await act(async () => {
        try {
          await result.current.completeProblem(1, 'green');
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('First error');

      // Second completion succeeds
      const completedProblem: DailyProblem = {
        ...mockDailyProblems[0],
        color: 'green',
        completed: true,
      };

      vi.mocked(dailyApi.completeProblem).mockResolvedValueOnce({
        problem: completedProblem,
      });

      await act(async () => {
        await result.current.completeProblem(1, 'green');
      });

      expect(result.current.error).toBe(null);
      expect(result.current.problems[0].completed).toBe(true);
    });
  });

  describe('refreshSelection', () => {
    it('should refresh selection successfully', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const newSelection: DailySelection = {
        problems: [
          {
            id: 3,
            name: 'Reverse String',
            link: 'https://leetcode.com/problems/reverse-string',
            color: 'gray',
            keyInsight: null,
            createdAt: '2025-01-03T00:00:00Z',
            updatedAt: '2025-01-03T00:00:00Z',
            selectionId: 3,
            completed: false,
          },
        ],
      };

      vi.mocked(dailyApi.refresh).mockResolvedValueOnce(newSelection);

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.problems).toEqual(mockDailyProblems);

      // Refresh the selection
      await act(async () => {
        await result.current.refreshSelection();
      });

      expect(dailyApi.refresh).toHaveBeenCalledTimes(1);
      expect(result.current.problems).toEqual(newSelection.problems);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should set loading state during refresh', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resolveRefresh: (value: DailySelection) => void;
      const refreshPromise = new Promise<DailySelection>((resolve) => {
        resolveRefresh = resolve;
      });

      vi.mocked(dailyApi.refresh).mockReturnValueOnce(refreshPromise);

      // Start refresh
      act(() => {
        result.current.refreshSelection();
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Complete refresh
      resolveRefresh!({ problems: [] });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle refresh errors', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const errorMessage = 'Failed to refresh selection';
      vi.mocked(dailyApi.refresh).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.refreshSelection();
        } catch (error) {
          // Expected error
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe(errorMessage);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      // Should keep old problems
      expect(result.current.problems).toEqual(mockDailyProblems);
    });

    it('should clear previous errors on successful refresh', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First refresh fails
      vi.mocked(dailyApi.refresh).mockRejectedValueOnce(new Error('First error'));

      await act(async () => {
        try {
          await result.current.refreshSelection();
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('First error');

      // Second refresh succeeds
      const newSelection: DailySelection = { problems: [] };
      vi.mocked(dailyApi.refresh).mockResolvedValueOnce(newSelection);

      await act(async () => {
        await result.current.refreshSelection();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.problems).toEqual([]);
    });
  });

  describe('refetch', () => {
    it('should refetch daily selection', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const { result } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newSelection: DailySelection = {
        problems: [
          {
            id: 5,
            name: 'Merge Two Sorted Lists',
            link: 'https://leetcode.com/problems/merge-two-sorted-lists',
            color: 'yellow',
            keyInsight: 'Dummy node',
            createdAt: '2025-01-05T00:00:00Z',
            updatedAt: '2025-01-05T00:00:00Z',
            selectionId: 5,
            completed: true,
          },
        ],
      };

      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(newSelection);

      await act(async () => {
        await result.current.refetch();
      });

      expect(dailyApi.getToday).toHaveBeenCalledTimes(2);
      expect(result.current.problems).toEqual(newSelection.problems);
    });
  });

  describe('useCallback stability', () => {
    it('should maintain stable completeProblem reference', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const { result, rerender } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstCompleteProblem = result.current.completeProblem;

      rerender();

      expect(result.current.completeProblem).toBe(firstCompleteProblem);
    });

    it('should maintain stable refreshSelection reference', async () => {
      vi.mocked(dailyApi.getToday).mockResolvedValueOnce(mockDailySelection);

      const { result, rerender } = renderHook(() => useDaily());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstRefreshSelection = result.current.refreshSelection;

      rerender();

      expect(result.current.refreshSelection).toBe(firstRefreshSelection);
    });
  });
});
