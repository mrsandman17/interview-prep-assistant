/**
 * Tests for useProblems custom hook
 * Tests loading states, error handling, data fetching, and refetch functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProblems } from '../useProblems';
import { problemsApi } from '../../api/client';
import type { Problem } from '../../api/types';

// Mock the API client
vi.mock('../../api/client', () => ({
  problemsApi: {
    getAll: vi.fn(),
  },
}));

describe('useProblems', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(problemsApi.getAll).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useProblems());

    expect(result.current.loading).toBe(true);
    expect(result.current.problems).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should fetch problems successfully on mount', async () => {
    vi.mocked(problemsApi.getAll).mockResolvedValueOnce(mockProblems);

    const { result } = renderHook(() => useProblems());

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.problems).toEqual(mockProblems);
    expect(result.current.error).toBe(null);
    expect(problemsApi.getAll).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Failed to fetch problems';
    vi.mocked(problemsApi.getAll).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useProblems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.problems).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle non-Error thrown values', async () => {
    vi.mocked(problemsApi.getAll).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useProblems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch problems');
  });

  it('should refetch problems when refetch is called', async () => {
    vi.mocked(problemsApi.getAll).mockResolvedValueOnce(mockProblems);

    const { result } = renderHook(() => useProblems());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.problems).toEqual(mockProblems);

    // Mock new data for refetch
    const newProblems: Problem[] = [
      {
        id: 3,
        name: 'Reverse String',
        link: 'https://leetcode.com/problems/reverse-string',
        color: 'green',
        keyInsight: 'Two pointers',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      },
    ];
    vi.mocked(problemsApi.getAll).mockResolvedValueOnce(newProblems);

    // Trigger refetch
    await act(async () => {
      await result.current.refetch();
    });

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.problems).toEqual(newProblems);
    expect(problemsApi.getAll).toHaveBeenCalledTimes(2);
  });

  it('should clear previous errors on refetch', async () => {
    // First call fails
    vi.mocked(problemsApi.getAll).mockRejectedValueOnce(new Error('First error'));

    const { result } = renderHook(() => useProblems());

    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });

    // Second call succeeds
    vi.mocked(problemsApi.getAll).mockResolvedValueOnce(mockProblems);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.problems).toEqual(mockProblems);
  });

  it('should handle errors during refetch', async () => {
    // First call succeeds
    vi.mocked(problemsApi.getAll).mockResolvedValueOnce(mockProblems);

    const { result } = renderHook(() => useProblems());

    await waitFor(() => {
      expect(result.current.problems).toEqual(mockProblems);
    });

    // Second call fails
    vi.mocked(problemsApi.getAll).mockRejectedValueOnce(new Error('Refetch failed'));

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Refetch failed');
    });

    expect(result.current.problems).toEqual(mockProblems); // Should keep previous data
  });

  it('should handle empty problems array', async () => {
    vi.mocked(problemsApi.getAll).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useProblems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.problems).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should set loading to true before fetching and false after', async () => {
    let resolvePromise: (value: Problem[]) => void;
    const promise = new Promise<Problem[]>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(problemsApi.getAll).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useProblems());

    expect(result.current.loading).toBe(true);

    // Resolve the promise
    resolvePromise!(mockProblems);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should only fetch once on mount', async () => {
    vi.mocked(problemsApi.getAll).mockResolvedValueOnce(mockProblems);

    const { result, rerender } = renderHook(() => useProblems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Rerender shouldn't trigger another fetch
    rerender();

    expect(problemsApi.getAll).toHaveBeenCalledTimes(1);
  });
});
