/**
 * Reusable color selection button component
 */

import type { ProblemColor } from '../api/types';

interface ColorButtonProps {
  color: Exclude<ProblemColor, 'gray'>;
  onClick: () => void;
  disabled?: boolean;
}

const colorStyles: Record<Exclude<ProblemColor, 'gray'>, string> = {
  orange: 'bg-problem-orange hover:bg-orange-600 focus:ring-orange-500',
  yellow: 'bg-problem-yellow hover:bg-yellow-500 focus:ring-yellow-400',
  green: 'bg-problem-green hover:bg-green-600 focus:ring-green-500',
};

const colorLabels: Record<Exclude<ProblemColor, 'gray'>, string> = {
  orange: 'Struggling',
  yellow: 'Okay',
  green: 'Mastered',
};

export function ColorButton({ color, onClick, disabled = false }: ColorButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-lg font-medium text-white
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${colorStyles[color]}
      `}
      aria-label={`Mark as ${colorLabels[color]}`}
    >
      {colorLabels[color]}
    </button>
  );
}
