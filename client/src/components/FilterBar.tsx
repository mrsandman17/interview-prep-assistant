/**
 * FilterBar component - Search and color filter for problems table
 */

import type { ProblemColor } from '../api/types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedColor: ProblemColor | 'all';
  onColorChange: (color: ProblemColor | 'all') => void;
}

const colorOptions: Array<{ value: ProblemColor | 'all'; label: string; badgeClass: string }> = [
  { value: 'all', label: 'All Colors', badgeClass: 'bg-gray-200 text-gray-800' },
  { value: 'gray', label: 'New', badgeClass: 'bg-gray-500 text-white' },
  { value: 'orange', label: 'Struggling', badgeClass: 'bg-problem-orange text-white' },
  { value: 'yellow', label: 'Okay', badgeClass: 'bg-problem-yellow text-white' },
  { value: 'green', label: 'Mastered', badgeClass: 'bg-problem-green text-white' },
];

export function FilterBar({ searchQuery, onSearchChange, selectedColor, onColorChange }: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search problems
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by problem name..."
              className="
                block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder-gray-400
              "
              aria-label="Search problems by name"
            />
          </div>
        </div>

        {/* Color Filter */}
        <div className="sm:w-48">
          <label htmlFor="color-filter" className="sr-only">
            Filter by color
          </label>
          <select
            id="color-filter"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value as ProblemColor | 'all')}
            className="
              block w-full px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              bg-white
            "
            aria-label="Filter problems by color"
          >
            {colorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchQuery || selectedColor !== 'all') && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
              Search: "{searchQuery}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:text-blue-900"
                aria-label="Clear search filter"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {selectedColor !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
              Color: {colorOptions.find((opt) => opt.value === selectedColor)?.label}
              <button
                onClick={() => onColorChange('all')}
                className="ml-1 hover:text-blue-900"
                aria-label="Clear color filter"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          <button
            onClick={() => {
              onSearchChange('');
              onColorChange('all');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
