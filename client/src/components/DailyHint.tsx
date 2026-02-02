/**
 * Daily Hint component - Displays random key insights from today's problems
 * Cycles through insights with "Next tip" button, tracking shown insights to avoid repetition
 */

import { useState, useEffect, useCallback } from 'react';
import { dailyApi } from '../api/client';
import type { RandomInsight } from '../api/types';

export function DailyHint() {
  const [currentInsight, setCurrentInsight] = useState<RandomInsight | null>(null);
  const [shownInsights, setShownInsights] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allShown, setAllShown] = useState(false);

  const fetchNextInsight = useCallback(async (excludeIds: number[]) => {
    try {
      setLoading(true);
      setError(null);
      const insight = await dailyApi.getRandomInsight(excludeIds);

      if (insight === null) {
        // No more insights available
        setAllShown(true);
        setCurrentInsight(null);
      } else {
        setCurrentInsight(insight);
        setAllShown(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insight');
      setCurrentInsight(null);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies since it only uses setState and API

  // Fetch initial insight on mount
  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async () => {
      try {
        setLoading(true);
        setError(null);
        const insight = await dailyApi.getRandomInsight([]);

        if (!cancelled) {
          if (insight === null) {
            setAllShown(true);
            setCurrentInsight(null);
          } else {
            setCurrentInsight(insight);
            setAllShown(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch insight');
          setCurrentInsight(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleNextTip = async () => {
    if (!currentInsight) return;

    // Add current problem ID to shown list
    const newShownInsights = [...shownInsights, currentInsight.problemId];
    setShownInsights(newShownInsights);

    // Fetch next insight with exclusion list
    await fetchNextInsight(newShownInsights);
  };

  const handleReset = () => {
    setShownInsights([]);
    setAllShown(false);
    fetchNextInsight([]);
  };

  // Loading state
  if (loading && !currentInsight) {
    return (
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-4 border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💡</span>
          <h3 className="text-sm font-semibold text-gray-900">Daily Tip</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mb-6 bg-red-50 rounded-lg shadow p-4 border border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">💡</span>
          <h3 className="text-sm font-semibold text-gray-900">Daily Tip</h3>
        </div>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  // Empty state (no insights available at all)
  if (!loading && !currentInsight && !allShown) {
    return (
      <div className="mb-6 bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">💡</span>
          <h3 className="text-sm font-semibold text-gray-900">Daily Tip</h3>
        </div>
        <p className="text-sm text-yellow-700">
          No tips available yet. Add key insights to your problems!
        </p>
      </div>
    );
  }

  // All shown state
  if (allShown) {
    return (
      <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow p-4 border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎉</span>
          <h3 className="text-sm font-semibold text-gray-900">Daily Tip</h3>
        </div>
        <p className="text-sm text-green-700 mb-3">
          You've seen all tips for today!
        </p>
        <button
          onClick={handleReset}
          className="
            px-4 py-2 text-sm bg-green-600 text-white rounded-lg
            hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            transition-colors duration-200
          "
        >
          ↻ Show Again
        </button>
      </div>
    );
  }

  // Content state
  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-4 border border-blue-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">💡</span>
        <h3 className="text-sm font-semibold text-gray-900">Daily Tip</h3>
      </div>

      {/* Insight Text */}
      {currentInsight && (
        <>
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            {currentInsight.keyInsight}
          </p>

          {/* Bottom Row: Problem Link (left) + Next Tip Button (right) */}
          <div className="flex items-center justify-between gap-3">
            <a
              href={currentInsight.problemLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate flex-shrink min-w-0"
              title={currentInsight.problemName}
            >
              {currentInsight.problemName}
            </a>
            <button
              onClick={handleNextTip}
              disabled={loading}
              className="
                flex-shrink-0 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              {loading ? 'Loading...' : 'Next tip'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
