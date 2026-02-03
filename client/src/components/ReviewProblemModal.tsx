/**
 * ReviewProblemModal - Modal for manually reviewing a problem from All Problems page
 *
 * Allows users to mark how they performed on a problem outside of daily practice.
 * Updates problem color, last reviewed date, and review count.
 */

import { useState, useEffect } from 'react';
import { ColorButton } from './ColorButton';
import type { Problem, ProblemColor } from '../api/types';

interface ReviewProblemModalProps {
  problem: Problem | null;
  isOpen: boolean;
  onClose: () => void;
  onReview: (problemId: number, colorResult: Exclude<ProblemColor, 'gray'>, keyInsight?: string) => Promise<void>;
}

const colorLabels: Record<ProblemColor, string> = {
  gray: 'New',
  orange: 'Struggling',
  yellow: 'Okay',
  green: 'Mastered',
};

export function ReviewProblemModal({ problem, isOpen, onClose, onReview }: ReviewProblemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyInsight, setKeyInsight] = useState('');

  // Initialize keyInsight when problem changes or modal opens
  useEffect(() => {
    if (isOpen && problem) {
      setKeyInsight(problem.keyInsight || '');
      setError(null);
    } else if (!isOpen) {
      // Reset state when modal closes
      setKeyInsight('');
      setError(null);
    }
  }, [isOpen, problem]);

  if (!isOpen || !problem) return null;

  const handleColorSelect = async (color: Exclude<ProblemColor, 'gray'>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onReview(problem.id, color, keyInsight || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review problem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleEscapeKey}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 id="review-modal-title" className="text-xl font-semibold text-gray-900">
              Review Problem
            </h2>
            <p className="text-sm text-gray-600 mt-1">{problem.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
            aria-label="Close modal"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Current Status:</p>
          <span
            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              problem.color === 'gray'
                ? 'bg-gray-500 text-white'
                : problem.color === 'orange'
                ? 'bg-problem-orange text-white'
                : problem.color === 'yellow'
                ? 'bg-problem-yellow text-white'
                : 'bg-problem-green text-white'
            }`}
          >
            {colorLabels[problem.color]}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Key Insight */}
        <div className="mb-6">
          <label htmlFor="keyInsight" className="block text-sm font-medium text-gray-700 mb-2">
            Key Insight
          </label>
          <textarea
            id="keyInsight"
            value={keyInsight}
            onChange={(e) => setKeyInsight(e.target.value)}
            disabled={isSubmitting}
            placeholder="Add notes about the problem approach, patterns, or key insights..."
            rows={4}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              text-sm
            "
          />
        </div>

        {/* Color Selection */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">How did you do?</p>
          <div className="grid grid-cols-3 gap-3">
            <ColorButton
              color="orange"
              onClick={() => handleColorSelect('orange')}
              disabled={isSubmitting}
            />
            <ColorButton
              color="yellow"
              onClick={() => handleColorSelect('yellow')}
              disabled={isSubmitting}
            />
            <ColorButton
              color="green"
              onClick={() => handleColorSelect('green')}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Cancel Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
