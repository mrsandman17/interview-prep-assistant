/**
 * Custom hook for fetching and managing problems
 */

import { useState, useEffect } from 'react';
import { problemsApi } from '../api/client';
import type { Problem } from '../api/types';

interface UseProblemsResult {
  problems: Problem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProblems(): UseProblemsResult {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await problemsApi.getAll();
      setProblems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch problems');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  return {
    problems,
    loading,
    error,
    refetch: fetchProblems,
  };
}
