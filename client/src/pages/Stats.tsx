/**
 * Statistics page - Comprehensive dashboard showing progress and metrics
 */

import { useState, useEffect, useMemo } from 'react';
import { useStats } from '../hooks/useStats';
import { problemsApi } from '../api/client';
import type { Problem } from '../api/types';

interface ColorDistribution {
  gray: number;
  orange: number;
  yellow: number;
  green: number;
}

export function Stats() {
  const { stats, loading, error } = useStats();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [problemsError, setProblemsError] = useState<string | null>(null);

  // Fetch all problems for color distribution
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setProblemsLoading(true);
        setProblemsError(null);
        const data = await problemsApi.getAll();
        setProblems(data);
      } catch (err) {
        setProblemsError(err instanceof Error ? err.message : 'Failed to load problems');
      } finally {
        setProblemsLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Calculate color distribution with memoization
  const colorDistribution: ColorDistribution = useMemo(() => {
    if (problemsLoading || problemsError) {
      return { gray: 0, orange: 0, yellow: 0, green: 0 };
    }
    return problems.reduce(
      (acc, problem) => {
        acc[problem.color] = (acc[problem.color] || 0) + 1;
        return acc;
      },
      { gray: 0, orange: 0, yellow: 0, green: 0 }
    );
  }, [problems, problemsLoading, problemsError]);

  // Calculate derived metrics with memoization
  const { masteryPercentage, reviewRate, nonGrayProblems, actualTotalProblems } = useMemo(() => {
    const actualTotal = problems.length;

    const mastery = stats && stats.totalProblems > 0
      ? Math.round((stats.greenProblems / stats.totalProblems) * 100)
      : 0;

    const nonGray = actualTotal - colorDistribution.gray;
    const review = nonGray > 0 && stats
      ? Math.round((stats.readyForReview / nonGray) * 100)
      : 0;

    return {
      masteryPercentage: mastery,
      reviewRate: review,
      nonGrayProblems: nonGray,
      actualTotalProblems: actualTotal,
    };
  }, [stats, colorDistribution, problems.length]);

  if (loading || problemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error || problemsError) {
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
              <p className="text-sm text-red-700">{error || problemsError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Statistics</h2>
        <p className="mt-2 text-gray-600">
          Track your progress and performance over time
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Problems */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Total Problems
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.totalProblems}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Current Streak
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.currentStreak}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {stats.currentStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <svg
                className="h-8 w-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Problems Mastered */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Mastered
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.greenProblems}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {masteryPercentage}% of total
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Ready for Review */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Ready for Review
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.readyForReview}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                problems to practice
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg
                className="h-8 w-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Color Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Color Distribution Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Problem Distribution by Color
          </h3>
          <div className="space-y-4">
            {/* Gray */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                  <span className="text-sm font-medium text-gray-700">New (Gray)</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {colorDistribution.gray}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gray-400 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${actualTotalProblems > 0 ? (colorDistribution.gray / actualTotalProblems) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Orange */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-orange-400"></div>
                  <span className="text-sm font-medium text-gray-700">Learning (Orange)</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {colorDistribution.orange}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-400 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${actualTotalProblems > 0 ? (colorDistribution.orange / actualTotalProblems) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Yellow */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                  <span className="text-sm font-medium text-gray-700">Practicing (Yellow)</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {colorDistribution.yellow}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${actualTotalProblems > 0 ? (colorDistribution.yellow / actualTotalProblems) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Green */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">Mastered (Green)</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {colorDistribution.green}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${actualTotalProblems > 0 ? (colorDistribution.green / actualTotalProblems) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total count */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {actualTotalProblems} problems
              </span>
            </div>
          </div>
        </div>

        {/* Progress Insights */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Progress Insights
          </h3>
          <div className="space-y-6">
            {/* Mastery Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Mastery Progress</span>
                <span className="text-sm font-bold text-gray-900">{masteryPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${masteryPercentage}%` }}
                >
                  {masteryPercentage > 10 && (
                    <span className="text-xs font-bold text-white">{masteryPercentage}%</span>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {stats.greenProblems} of {stats.totalProblems} problems mastered
              </p>
            </div>

            {/* Review Coverage */}
            {nonGrayProblems > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Problems Needing Review</span>
                  <span className="text-sm font-bold text-gray-900">{reviewRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${reviewRate}%` }}
                  >
                    {reviewRate > 10 && (
                      <span className="text-xs font-bold text-white">{reviewRate}%</span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {stats.readyForReview} of {nonGrayProblems} active problems ready for review
                </p>
              </div>
            )}

            {/* Streak Indicator */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {stats.currentStreak > 0 ? (
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-orange-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2c1.658 0 3 1.342 3 3v1h3c.553 0 1 .447 1 1s-.447 1-1 1h-3v2h3c.553 0 1 .447 1 1s-.447 1-1 1h-3v2h3c.553 0 1 .447 1 1s-.447 1-1 1h-3v3c0 1.658-1.342 3-3 3s-3-1.342-3-3v-3H6c-.553 0-1-.447-1-1s.447-1 1-1h3v-2H6c-.553 0-1-.447-1-1s.447-1 1-1h3V7H6c-.553 0-1-.447-1-1s.447-1 1-1h3V5c0-1.658 1.342-3 3-3z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {stats.currentStreak > 0
                      ? `${stats.currentStreak} day streak! Keep it up!`
                      : 'Start your streak today!'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.currentStreak > 0
                      ? 'Complete your daily problems to maintain your streak'
                      : 'Complete all daily problems to start building a streak'}
                  </p>
                </div>
              </div>
            </div>

            {/* Empty state message */}
            {stats.totalProblems === 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    No problems yet! Add problems to your collection to start tracking your progress.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spaced Repetition Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg
            className="h-5 w-5 text-blue-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          How Spaced Repetition Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border-l-4 border-gray-400">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm font-semibold text-gray-900">Gray (New)</span>
            </div>
            <p className="text-xs text-gray-600">
              Never attempted. Always eligible for practice.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border-l-4 border-orange-400">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span className="text-sm font-semibold text-gray-900">Orange</span>
            </div>
            <p className="text-xs text-gray-600">
              Review every 3+ days. Building familiarity.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-400">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-sm font-semibold text-gray-900">Yellow</span>
            </div>
            <p className="text-xs text-gray-600">
              Review every 7+ days. Getting comfortable.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-semibold text-gray-900">Green</span>
            </div>
            <p className="text-xs text-gray-600">
              Review every 14+ days. Mastered!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
