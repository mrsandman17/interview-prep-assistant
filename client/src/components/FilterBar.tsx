/**
 * FilterBar component - Search, color, and topic filters for problems table
 */

import type { ProblemColor, Topic } from '../api/types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedColor: ProblemColor | 'all';
  onColorChange: (color: ProblemColor | 'all') => void;
  selectedTopicIds: number[];
  onTopicIdsChange: (topicIds: number[]) => void;
  topics: Topic[];
}

const colorOptions: Array<{ value: ProblemColor | 'all'; label: string; badgeClass: string }> = [
  { value: 'all', label: 'All Colors', badgeClass: 'bg-gray-200 text-gray-800' },
  { value: 'gray', label: 'New', badgeClass: 'bg-gray-500 text-white' },
  { value: 'orange', label: 'Struggling', badgeClass: 'bg-problem-orange text-white' },
  { value: 'yellow', label: 'Okay', badgeClass: 'bg-problem-yellow text-white' },
  { value: 'green', label: 'Mastered', badgeClass: 'bg-problem-green text-white' },
];

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedColor,
  onColorChange,
  selectedTopicIds,
  onTopicIdsChange,
  topics,
}: FilterBarProps) {
  const selectedTopics = topics.filter(t => selectedTopicIds.includes(t.id));

  const handleTopicToggle = (topicId: number) => {
    if (selectedTopicIds.includes(topicId)) {
      onTopicIdsChange(selectedTopicIds.filter(id => id !== topicId));
    } else {
      onTopicIdsChange([...selectedTopicIds, topicId]);
    }
  };

  const handleRemoveTopic = (topicId: number) => {
    onTopicIdsChange(selectedTopicIds.filter(id => id !== topicId));
  };

  const hasActiveFilters = searchQuery || selectedColor !== 'all' || selectedTopicIds.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* First row: Search and Color */}
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

        {/* Second row: Topic Filter */}
        {topics.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Topics
            </label>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleTopicToggle(topic.id)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${
                      selectedTopicIds.includes(topic.id)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                >
                  {topic.name}
                  {selectedTopicIds.includes(topic.id) && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 flex-wrap">
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
          {selectedTopics.map((topic) => (
            <span
              key={topic.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
            >
              Topic: {topic.name}
              <button
                onClick={() => handleRemoveTopic(topic.id)}
                className="ml-1 hover:text-blue-900"
                aria-label={`Remove ${topic.name} filter`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            onClick={() => {
              onSearchChange('');
              onColorChange('all');
              onTopicIdsChange([]);
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
