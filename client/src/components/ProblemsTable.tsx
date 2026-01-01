/**
 * ProblemsTable component - Sortable table for displaying all problems
 */

import { useState, useMemo } from 'react';
import type { Problem, ProblemColor } from '../api/types';

interface ProblemsTableProps {
  problems: Problem[];
  onEdit: (problem: Problem) => void;
  isLoading: boolean;
}

type SortField = 'name' | 'color' | 'lastReviewed' | 'attemptCount';
type SortDirection = 'asc' | 'desc';

const colorBadgeStyles: Record<ProblemColor, string> = {
  gray: 'bg-gray-500 text-white',
  orange: 'bg-problem-orange text-white',
  yellow: 'bg-problem-yellow text-white',
  green: 'bg-problem-green text-white',
};

const colorLabels: Record<ProblemColor, string> = {
  gray: 'New',
  orange: 'Struggling',
  yellow: 'Okay',
  green: 'Mastered',
};

const colorOrder: Record<ProblemColor, number> = {
  gray: 0,
  orange: 1,
  yellow: 2,
  green: 3,
};

export function ProblemsTable({ problems, onEdit, isLoading }: ProblemsTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new field
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProblems = useMemo(() => {
    const sorted = [...problems].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'color':
          aValue = colorOrder[a.color];
          bValue = colorOrder[b.color];
          break;
        case 'lastReviewed':
          aValue = a.lastReviewed || '';
          bValue = b.lastReviewed || '';
          break;
        case 'attemptCount':
          aValue = a.attemptCount || 0;
          bValue = b.attemptCount || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [problems, sortField, sortDirection]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading problems...</p>
        </div>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No problems found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or import problems to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  <span>Problem Name</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('color')}
              >
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  <SortIcon field="color" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('lastReviewed')}
              >
                <div className="flex items-center gap-2">
                  <span>Last Reviewed</span>
                  <SortIcon field="lastReviewed" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('attemptCount')}
              >
                <div className="flex items-center gap-2">
                  <span>Attempts</span>
                  <SortIcon field="attemptCount" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProblems.map((problem) => (
              <tr key={problem.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{problem.name}</div>
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Problem
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      colorBadgeStyles[problem.color]
                    }`}
                  >
                    {colorLabels[problem.color]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(problem.lastReviewed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {problem.attemptCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(problem)}
                    className="text-blue-600 hover:text-blue-900 focus:outline-none focus:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{sortedProblems.length}</span> problem
          {sortedProblems.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
