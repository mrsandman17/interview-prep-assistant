/**
 * Custom hook for fetching and managing daily problem selection
 */

import { useState, useEffect, useCallback } from 'react';
import { dailyApi } from '../api/client';
import type { DailyProblem, ProblemColor } from '../api/types';

interface UseDailyResult {
  problems: DailyProblem[];
  loading: boolean;
  error: string | null;
  completeProblem: (problemId: number, colorResult: Exclude<ProblemColor, 'gray'>) => Promise<void>;
  refreshSelection: () => Promise<void>;
  replaceProblem: (problemId: number) => Promise<DailyProblem>;
  refetch: () => Promise<void>;
}

export function useDaily(): UseDailyResult {
  const [problems, setProblems] = useState<DailyProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDaily = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dailyApi.getToday();
      setProblems(data.problems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily selection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, []);

  const completeProblem = useCallback(
    async (problemId: number, colorResult: Exclude<ProblemColor, 'gray'>) => {
      try {
        setError(null);
        const response = await dailyApi.completeProblem(problemId, colorResult);

        // Update the problem in the local state
        setProblems((prev) =>
          prev.map((p) => (p.id === problemId ? response.problem : p))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete problem');
        throw err;
      }
    },
    []
  );

  const refreshSelection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dailyApi.refresh();
      setProblems(data.problems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh selection');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceProblem = useCallback(async (problemId: number) => {
    try {
      setError(null);
      const response = await dailyApi.replaceProblem(problemId);

      // Replace the old problem with the new one in the array
      setProblems((prev) =>
        prev.map((p) => (p.id === problemId ? response.problem : p))
      );

      return response.problem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace problem');
      throw err;
    }
  }, []);

  return {
    problems,
    loading,
    error,
    completeProblem,
    refreshSelection,
    replaceProblem,
    refetch: fetchDaily,
  };
}
