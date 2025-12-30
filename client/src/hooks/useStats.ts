/**
 * Custom hook for fetching dashboard statistics
 */

import { useState, useEffect } from 'react';
import { statsApi } from '../api/client';
import type { Stats } from '../api/types';

interface UseStatsResult {
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statsApi.get();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
