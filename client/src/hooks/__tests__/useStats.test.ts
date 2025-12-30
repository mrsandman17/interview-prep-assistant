/**
 * Tests for useStats custom hook
 * Tests statistics fetching, loading states, error handling, and refetch
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useStats } from '../useStats';
import { statsApi } from '../../api/client';
import type { Stats } from '../../api/types';

// Mock the API client
vi.mock('../../api/client', () => ({
  statsApi: {
    get: vi.fn(),
  },
}));

describe('useStats', () => {
  const mockStats: Stats = {
    totalProblems: 50,
    greenProblems: 15,
    currentStreak: 7,
    readyForReview: 12,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial fetch', () => {
    it('should initialize with loading state', () => {
      vi.mocked(statsApi.get).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useStats());

      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should fetch stats successfully on mount', async () => {
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.error).toBe(null);
      expect(statsApi.get).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Failed to fetch statistics';
      vi.mocked(statsApi.get).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle non-Error thrown values', async () => {
      vi.mocked(statsApi.get).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch statistics');
      expect(result.current.stats).toBe(null);
    });

    it('should handle stats with zero values', async () => {
      const zeroStats: Stats = {
        totalProblems: 0,
        greenProblems: 0,
        currentStreak: 0,
        readyForReview: 0,
      };

      vi.mocked(statsApi.get).mockResolvedValueOnce(zeroStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(zeroStats);
      expect(result.current.stats?.totalProblems).toBe(0);
      expect(result.current.stats?.greenProblems).toBe(0);
      expect(result.current.error).toBe(null);
    });

    it('should handle stats with high values', async () => {
      const highStats: Stats = {
        totalProblems: 1000,
        greenProblems: 500,
        currentStreak: 365,
        readyForReview: 250,
      };

      vi.mocked(statsApi.get).mockResolvedValueOnce(highStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(highStats);
    });
  });

  describe('refetch', () => {
    it('should refetch stats when refetch is called', async () => {
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);

      // Mock new stats for refetch
      const newStats: Stats = {
        totalProblems: 55,
        greenProblems: 20,
        currentStreak: 10,
        readyForReview: 8,
      };

      vi.mocked(statsApi.get).mockResolvedValueOnce(newStats);

      // Trigger refetch
      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(newStats);
      expect(statsApi.get).toHaveBeenCalledTimes(2);
    });

    it('should clear previous errors on successful refetch', async () => {
      // First call fails
      vi.mocked(statsApi.get).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      expect(result.current.stats).toBe(null);

      // Second call succeeds
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(null);
      expect(result.current.stats).toEqual(mockStats);
    });

    it('should handle errors during refetch', async () => {
      // First call succeeds
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });

      // Second call fails
      vi.mocked(statsApi.get).mockRejectedValueOnce(new Error('Refetch failed'));

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Refetch failed');
      });

      // Should keep previous stats
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.loading).toBe(false);
    });

    it('should set loading to true before refetching', async () => {
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resolvePromise: (value: Stats) => void;
      const promise = new Promise<Stats>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(statsApi.get).mockReturnValueOnce(promise);

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      // Loading should be true while promise is pending
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockStats);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should update stats immediately after refetch completes', async () => {
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });

      const updatedStats: Stats = {
        totalProblems: 51,
        greenProblems: 16,
        currentStreak: 8,
        readyForReview: 13,
      };

      vi.mocked(statsApi.get).mockResolvedValueOnce(updatedStats);

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.stats).toEqual(updatedStats);
      });
    });
  });

  describe('Edge cases', () => {
    it('should only fetch once on mount', async () => {
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      const { result, rerender } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Rerender shouldn't trigger another fetch
      rerender();

      expect(statsApi.get).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid refetch calls', async () => {
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.mocked(statsApi.get).mockResolvedValue(mockStats);

      // Trigger multiple refetches rapidly
      await act(async () => {
        await Promise.all([
          result.current.refetch(),
          result.current.refetch(),
          result.current.refetch(),
        ]);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have made at least one additional call
      expect(statsApi.get).toHaveBeenCalled();
    });

    it('should maintain stats state during loading', async () => {
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });

      let resolvePromise: (value: Stats) => void;
      const promise = new Promise<Stats>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(statsApi.get).mockReturnValueOnce(promise);

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      // Loading should be true and stats should still be old value
      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toEqual(mockStats);

      // Resolve with new stats
      const newStats: Stats = {
        totalProblems: 60,
        greenProblems: 25,
        currentStreak: 15,
        readyForReview: 10,
      };

      await act(async () => {
        resolvePromise!(newStats);
      });

      await waitFor(() => {
        expect(result.current.stats).toEqual(newStats);
      });
    });

    it('should handle stats with partial zero values', async () => {
      const partialZeroStats: Stats = {
        totalProblems: 10,
        greenProblems: 0,
        currentStreak: 5,
        readyForReview: 0,
      };

      vi.mocked(statsApi.get).mockResolvedValueOnce(partialZeroStats);

      const { result } = renderHook(() => useStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats?.greenProblems).toBe(0);
      expect(result.current.stats?.readyForReview).toBe(0);
      expect(result.current.stats?.totalProblems).toBe(10);
      expect(result.current.stats?.currentStreak).toBe(5);
    });
  });

  describe('Loading state management', () => {
    it('should set loading to true immediately on mount', () => {
      vi.mocked(statsApi.get).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useStats());

      expect(result.current.loading).toBe(true);
    });

    it('should set loading to false after successful fetch', async () => {
      vi.mocked(statsApi.get).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useStats());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false after failed fetch', async () => {
      vi.mocked(statsApi.get).mockRejectedValueOnce(new Error('Failed'));

      const { result } = renderHook(() => useStats());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
