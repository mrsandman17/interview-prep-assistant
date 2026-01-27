/**
 * Dashboard page - Main daily practice view showing today's selected problems
 */

import { useState } from 'react';
import { useDaily } from '../hooks/useDaily';
import { useStats } from '../hooks/useStats';
import { ProblemCard } from '../components/ProblemCard';
import type { ProblemColor } from '../api/types';

export function Dashboard() {
  const { problems, loading, error, completeProblem, refreshSelection, replaceProblem } = useDaily();
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useStats();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCompleteProblem = async (
    problemId: number,
    colorResult: Exclude<ProblemColor, 'gray'>
  ) => {
    await completeProblem(problemId, colorResult);
    // Refresh stats after completing a problem
    refetchStats();
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshSelection();
      refetchStats();
    } catch (err) {
      console.error('Failed to refresh selection:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReplaceProblem = async (problemId: number) => {
    try {
      await replaceProblem(problemId);
      // No need to refetch stats - total problem count doesn't change
    } catch (err) {
      console.error('Failed to replace problem:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading today's problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = problems.filter((p) => p.completed).length;
  const totalCount = problems.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Today's Practice</h2>
        <p className="mt-2 text-gray-600">
          Complete your daily problems to improve your skills
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {completedCount} / {totalCount}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* Problem Cards Grid */}
      {problems.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No problems available. Add problems to your collection to get started!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {problems.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              onComplete={handleCompleteProblem}
              onReplace={handleReplaceProblem}
            />
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="
            px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
          "
        >
          {isRefreshing ? 'Refreshing...' : 'New Set'}
        </button>
      </div>

      {/* Stats Summary */}
      {!statsLoading && !statsError && stats && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.readyForReview}
              </div>
              <div className="text-sm text-gray-600 mt-1">Ready for Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {stats.currentStreak}
              </div>
              <div className="text-sm text-gray-600 mt-1">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.greenProblems}
              </div>
              <div className="text-sm text-gray-600 mt-1">Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {stats.totalProblems}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Problems</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
