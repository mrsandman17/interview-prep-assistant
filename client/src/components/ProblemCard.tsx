/**
 * Problem card component with two states: Pending and Completed
 */

import { useState } from 'react';
import type { DailyProblem, ProblemColor } from '../api/types';
import { ColorButton } from './ColorButton';

interface ProblemCardProps {
  problem: DailyProblem;
  onComplete: (problemId: number, colorResult: Exclude<ProblemColor, 'gray'>) => Promise<void>;
  onReplace: (problemId: number) => Promise<void>;
}

const colorBadgeStyles: Record<ProblemColor, string> = {
  gray: 'bg-gray-500',
  orange: 'bg-problem-orange',
  yellow: 'bg-problem-yellow',
  green: 'bg-problem-green',
};

const colorLabels: Record<ProblemColor, string> = {
  gray: 'New',
  orange: 'Struggling',
  yellow: 'Okay',
  green: 'Mastered',
};

export function ProblemCard({ problem, onComplete, onReplace }: ProblemCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const handleColorSelect = async (color: Exclude<ProblemColor, 'gray'>) => {
    try {
      setIsSubmitting(true);
      await onComplete(problem.id, color);
    } catch (err) {
      console.error('Failed to complete problem:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplace = async () => {
    try {
      setIsReplacing(true);
      await onReplace(problem.id);
    } catch (err) {
      console.error('Failed to replace problem:', err);
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* Problem Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {problem.name}
          </h3>
          <a
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
          >
            View Problem
          </a>
        </div>
        <span
          className={`
            px-3 py-1 rounded-full text-xs font-medium text-white
            ${colorBadgeStyles[problem.color]}
          `}
        >
          {colorLabels[problem.color]}
        </span>
      </div>

      {/* Pending State: Color Selection Buttons */}
      {!problem.completed && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">How did you do?</p>
          <div className="flex gap-2 flex-wrap">
            <ColorButton
              color="orange"
              onClick={() => handleColorSelect('orange')}
              disabled={isSubmitting || isReplacing}
            />
            <ColorButton
              color="yellow"
              onClick={() => handleColorSelect('yellow')}
              disabled={isSubmitting || isReplacing}
            />
            <ColorButton
              color="green"
              onClick={() => handleColorSelect('green')}
              disabled={isSubmitting || isReplacing}
            />
          </div>
          <button
            onClick={handleReplace}
            disabled={isReplacing || isSubmitting}
            className="
              mt-3 w-full px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-300 rounded-lg
              hover:bg-gray-100 hover:text-gray-700
              focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            {isReplacing ? 'Replacing...' : '↻ Skip This Problem'}
          </button>
        </div>
      )}

      {/* Completed State: Show Key Insight */}
      {problem.completed && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium text-green-700">Completed</span>
          </div>
          {problem.keyInsight && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Key Insight:</span> {problem.keyInsight}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
