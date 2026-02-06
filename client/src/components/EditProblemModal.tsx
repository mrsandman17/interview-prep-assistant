/**
 * EditProblemModal component - Modal for editing problem details
 */

import { useState, useEffect } from 'react';
import type { Problem, ProblemColor } from '../api/types';
import { TopicSelect } from './TopicSelect';

interface EditProblemModalProps {
  problem: Problem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (problemId: number, updates: {
    name?: string;
    link?: string;
    keyInsight?: string;
    color?: ProblemColor;
    topicIds?: number[];
  }) => Promise<void>;
}

// Max length constants matching backend validation
const MAX_NAME_LENGTH = 500;
const MAX_URL_LENGTH = 2048;
const MAX_INSIGHT_LENGTH = 5000;

const colorOptions: Array<{ value: ProblemColor; label: string; badgeClass: string }> = [
  { value: 'gray', label: 'New', badgeClass: 'bg-gray-500' },
  { value: 'orange', label: 'Struggling', badgeClass: 'bg-problem-orange' },
  { value: 'yellow', label: 'Okay', badgeClass: 'bg-problem-yellow' },
  { value: 'green', label: 'Mastered', badgeClass: 'bg-problem-green' },
];

export function EditProblemModal({ problem, isOpen, onClose, onSave }: EditProblemModalProps) {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [keyInsight, setKeyInsight] = useState('');
  const [color, setColor] = useState<ProblemColor>('gray');
  const [topicIds, setTopicIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when problem changes
  useEffect(() => {
    if (problem) {
      setName(problem.name);
      setLink(problem.link);
      setKeyInsight(problem.keyInsight || '');
      setColor(problem.color);
      setTopicIds(problem.topics?.map(t => t.id) || []);
      setError(null);
    }
  }, [problem]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSaving]);

  const handleClose = () => {
    if (!isSaving) {
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!problem) return;

    setError(null);
    setIsSaving(true);

    try {
      // Validate required fields
      const trimmedName = name.trim();
      const trimmedLink = link.trim();

      if (!trimmedName) {
        throw new Error('Problem name is required');
      }

      if (!trimmedLink) {
        throw new Error('Problem link is required');
      }

      // Validate URL format
      try {
        new URL(trimmedLink);
      } catch {
        throw new Error('Please enter a valid URL');
      }

      // Validate field lengths
      if (trimmedName.length > MAX_NAME_LENGTH) {
        throw new Error(`Problem name must be ${MAX_NAME_LENGTH} characters or less`);
      }

      if (trimmedLink.length > MAX_URL_LENGTH) {
        throw new Error(`URL must be ${MAX_URL_LENGTH} characters or less`);
      }

      const trimmedInsight = keyInsight.trim();
      if (trimmedInsight.length > MAX_INSIGHT_LENGTH) {
        throw new Error(`Key insight must be ${MAX_INSIGHT_LENGTH} characters or less`);
      }

      // Build updates object (only include changed fields)
      const updates: {
        name?: string;
        link?: string;
        keyInsight?: string;
        color?: ProblemColor;
        topicIds?: number[];
      } = {};

      if (trimmedName !== problem.name) updates.name = trimmedName;
      if (trimmedLink !== problem.link) updates.link = trimmedLink;
      if (trimmedInsight !== (problem.keyInsight || '')) {
        // Send undefined (which becomes null in backend) instead of empty string
        updates.keyInsight = trimmedInsight || undefined;
      }
      if (color !== problem.color) updates.color = color;

      // Check if topics changed
      const originalTopicIds = problem.topics?.map(t => t.id) || [];
      const topicsChanged =
        topicIds.length !== originalTopicIds.length ||
        !topicIds.every(id => originalTopicIds.includes(id));
      if (topicsChanged) {
        updates.topicIds = topicIds;
      }

      // Only save if there are changes
      if (Object.keys(updates).length === 0) {
        handleClose();
        return;
      }

      await onSave(problem.id, updates);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update problem');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !problem) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-visible shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Modal Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Edit Problem
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close modal"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Problem Name */}
                <div>
                  <label htmlFor="problem-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Problem Name *
                  </label>
                  <input
                    id="problem-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving}
                    required
                    className="
                      block w-full px-3 py-2 border border-gray-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                    "
                    placeholder="Two Sum"
                  />
                </div>

                {/* Problem Link */}
                <div>
                  <label htmlFor="problem-link" className="block text-sm font-medium text-gray-700 mb-1">
                    LeetCode Link *
                  </label>
                  <input
                    id="problem-link"
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    disabled={isSaving}
                    required
                    className="
                      block w-full px-3 py-2 border border-gray-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                    "
                    placeholder="https://leetcode.com/problems/two-sum/"
                  />
                </div>

                {/* Color Status */}
                <div>
                  <label htmlFor="problem-color" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setColor(option.value)}
                        disabled={isSaving}
                        className={`
                          px-4 py-2 rounded-lg font-medium text-white transition-all
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${option.badgeClass}
                          ${color === option.value ? 'ring-2 ring-offset-2 ring-blue-500' : 'opacity-60 hover:opacity-100'}
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key Insight */}
                <div>
                  <label htmlFor="problem-insight" className="block text-sm font-medium text-gray-700 mb-1">
                    Key Insight
                  </label>
                  <textarea
                    id="problem-insight"
                    value={keyInsight}
                    onChange={(e) => setKeyInsight(e.target.value)}
                    disabled={isSaving}
                    rows={3}
                    className="
                      block w-full px-3 py-2 border border-gray-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      resize-none
                    "
                    placeholder="Describe your key insight or approach. Add #tags to categorize patterns (e.g., #arrays #hash-map #two-pointers)"
                  />
                </div>

                {/* Topics */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topics
                  </label>
                  <TopicSelect
                    selectedTopicIds={topicIds}
                    onChange={setTopicIds}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="
                  w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm
                  px-4 py-2 bg-blue-600 text-base font-medium text-white
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  sm:ml-3 sm:w-auto sm:text-sm
                  disabled:bg-gray-400 disabled:cursor-not-allowed
                "
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="
                  mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm
                  px-4 py-2 bg-white text-base font-medium text-gray-700
                  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
