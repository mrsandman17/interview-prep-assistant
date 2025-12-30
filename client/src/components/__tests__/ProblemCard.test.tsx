/**
 * Tests for ProblemCard component
 * Tests pending and completed states, color selection, user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProblemCard } from '../ProblemCard';
import type { DailyProblem } from '../../api/types';

describe('ProblemCard', () => {
  const baseProblem: DailyProblem = {
    id: 1,
    name: 'Two Sum',
    link: 'https://leetcode.com/problems/two-sum',
    color: 'gray',
    keyInsight: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    selectionId: 1,
    completed: false,
  };

  describe('Pending state rendering', () => {
    it('should render problem name', () => {
      render(<ProblemCard problem={baseProblem} onComplete={vi.fn()} />);

      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    it('should render problem link with correct attributes', () => {
      render(<ProblemCard problem={baseProblem} onComplete={vi.fn()} />);

      const link = screen.getByRole('link', { name: /view problem/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://leetcode.com/problems/two-sum');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render color badge for gray problem', () => {
      render(<ProblemCard problem={baseProblem} onComplete={vi.fn()} />);

      const badge = screen.getByText('New');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-500');
    });

    it('should render color badge for orange problem', () => {
      const problem = { ...baseProblem, color: 'orange' as const };
      render(<ProblemCard problem={problem} onComplete={vi.fn()} />);

      // Find the badge by class (not the button text)
      const badges = screen.getAllByText('Struggling');
      const badge = badges.find(el => el.tagName === 'SPAN');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-problem-orange');
    });

    it('should render color badge for yellow problem', () => {
      const problem = { ...baseProblem, color: 'yellow' as const };
      render(<ProblemCard problem={problem} onComplete={vi.fn()} />);

      // Find the badge by class (not the button text)
      const badges = screen.getAllByText('Okay');
      const badge = badges.find(el => el.tagName === 'SPAN');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-problem-yellow');
    });

    it('should render color badge for green problem', () => {
      const problem = { ...baseProblem, color: 'green' as const };
      render(<ProblemCard problem={problem} onComplete={vi.fn()} />);

      // Find the badge by class (not the button text)
      const badges = screen.getAllByText('Mastered');
      const badge = badges.find(el => el.tagName === 'SPAN');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-problem-green');
    });

    it('should render "How did you do?" prompt', () => {
      render(<ProblemCard problem={baseProblem} onComplete={vi.fn()} />);

      expect(screen.getByText('How did you do?')).toBeInTheDocument();
    });

    it('should render all three color selection buttons', () => {
      render(<ProblemCard problem={baseProblem} onComplete={vi.fn()} />);

      expect(screen.getByRole('button', { name: /mark as struggling/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark as okay/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark as mastered/i })).toBeInTheDocument();
    });

    it('should not render completed checkmark when not completed', () => {
      render(<ProblemCard problem={baseProblem} onComplete={vi.fn()} />);

      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });
  });

  describe('Completed state rendering', () => {
    const completedProblem: DailyProblem = {
      ...baseProblem,
      completed: true,
      color: 'green',
    };

    it('should render completed checkmark', () => {
      render(<ProblemCard problem={completedProblem} onComplete={vi.fn()} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should not render color selection buttons when completed', () => {
      render(<ProblemCard problem={completedProblem} onComplete={vi.fn()} />);

      expect(screen.queryByRole('button', { name: /mark as struggling/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /mark as okay/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /mark as mastered/i })).not.toBeInTheDocument();
    });

    it('should not render "How did you do?" prompt when completed', () => {
      render(<ProblemCard problem={completedProblem} onComplete={vi.fn()} />);

      expect(screen.queryByText('How did you do?')).not.toBeInTheDocument();
    });

    it('should render key insight when present', () => {
      const problemWithInsight = {
        ...completedProblem,
        keyInsight: 'Use a hash map for O(n) time complexity',
      };

      render(<ProblemCard problem={problemWithInsight} onComplete={vi.fn()} />);

      expect(screen.getByText('Key Insight:')).toBeInTheDocument();
      expect(screen.getByText(/Use a hash map for O\(n\) time complexity/)).toBeInTheDocument();
    });

    it('should not render key insight section when insight is null', () => {
      render(<ProblemCard problem={completedProblem} onComplete={vi.fn()} />);

      expect(screen.queryByText('Key Insight:')).not.toBeInTheDocument();
    });

    it('should not render key insight section when insight is empty string', () => {
      const problemWithEmptyInsight = {
        ...completedProblem,
        keyInsight: '',
      };

      render(<ProblemCard problem={problemWithEmptyInsight} onComplete={vi.fn()} />);

      expect(screen.queryByText('Key Insight:')).not.toBeInTheDocument();
    });

    it('should render key insight with long text', () => {
      const longInsight = 'This is a very long key insight that contains multiple sentences and should wrap properly. Use a hash map to store complements. Iterate through the array once.';
      const problemWithLongInsight = {
        ...completedProblem,
        keyInsight: longInsight,
      };

      render(<ProblemCard problem={problemWithLongInsight} onComplete={vi.fn()} />);

      expect(screen.getByText(longInsight)).toBeInTheDocument();
    });
  });

  describe('Color selection interactions', () => {
    let mockOnComplete: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockOnComplete = vi.fn().mockResolvedValue(undefined);
    });

    it('should call onComplete with orange when orange button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProblemCard problem={baseProblem} onComplete={mockOnComplete} />);

      const orangeButton = screen.getByRole('button', { name: /mark as struggling/i });
      await user.click(orangeButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(1, 'orange');
      });
    });

    it('should call onComplete with yellow when yellow button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProblemCard problem={baseProblem} onComplete={mockOnComplete} />);

      const yellowButton = screen.getByRole('button', { name: /mark as okay/i });
      await user.click(yellowButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(1, 'yellow');
      });
    });

    it('should call onComplete with green when green button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProblemCard problem={baseProblem} onComplete={mockOnComplete} />);

      const greenButton = screen.getByRole('button', { name: /mark as mastered/i });
      await user.click(greenButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(1, 'green');
      });
    });

    it('should disable all buttons during submission', async () => {
      const user = userEvent.setup();
      let resolveComplete: () => void;
      const completePromise = new Promise<void>((resolve) => {
        resolveComplete = resolve;
      });

      mockOnComplete = vi.fn().mockReturnValue(completePromise);

      render(<ProblemCard problem={baseProblem} onComplete={mockOnComplete} />);

      const greenButton = screen.getByRole('button', { name: /mark as mastered/i });
      await user.click(greenButton);

      // All buttons should be disabled during submission
      const orangeButton = screen.getByRole('button', { name: /mark as struggling/i });
      const yellowButton = screen.getByRole('button', { name: /mark as okay/i });

      expect(orangeButton).toBeDisabled();
      expect(yellowButton).toBeDisabled();
      expect(greenButton).toBeDisabled();

      // Resolve the promise
      resolveComplete!();

      await waitFor(() => {
        expect(orangeButton).not.toBeDisabled();
      });
    });

    it('should re-enable buttons after successful submission', async () => {
      const user = userEvent.setup();
      render(<ProblemCard problem={baseProblem} onComplete={mockOnComplete} />);

      const greenButton = screen.getByRole('button', { name: /mark as mastered/i });
      await user.click(greenButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });

      // Buttons should be enabled again
      expect(screen.getByRole('button', { name: /mark as struggling/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /mark as okay/i })).not.toBeDisabled();
      expect(greenButton).not.toBeDisabled();
    });

    it('should re-enable buttons after failed submission', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockOnComplete = vi.fn().mockRejectedValue(new Error('Failed to complete'));

      render(<ProblemCard problem={baseProblem} onComplete={mockOnComplete} />);

      const greenButton = screen.getByRole('button', { name: /mark as mastered/i });
      await user.click(greenButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });

      // Buttons should be enabled again even after error
      await waitFor(() => {
        expect(greenButton).not.toBeDisabled();
      });

      consoleError.mockRestore();
    });

    it('should log error to console when completion fails', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Failed to complete');

      mockOnComplete = vi.fn().mockRejectedValue(error);

      render(<ProblemCard problem={baseProblem} onComplete={mockOnComplete} />);

      const greenButton = screen.getByRole('button', { name: /mark as mastered/i });
      await user.click(greenButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to complete problem:', error);
      });

      consoleError.mockRestore();
    });

    it('should handle multiple button clicks for different colors', async () => {
      const user = userEvent.setup();
      render(<ProblemCard problem={baseProblem} onComplete={mockOnComplete} />);

      const orangeButton = screen.getByRole('button', { name: /mark as struggling/i });
      await user.click(orangeButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(1, 'orange');
      });

      const yellowButton = screen.getByRole('button', { name: /mark as okay/i });
      await user.click(yellowButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(1, 'yellow');
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<ProblemCard problem={baseProblem} onComplete={vi.fn()} />);

      const heading = screen.getByRole('heading', { name: 'Two Sum' });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible link text', () => {
      render(<ProblemCard problem={baseProblem} onComplete={vi.fn()} />);

      const link = screen.getByRole('link', { name: /view problem/i });
      expect(link).toBeInTheDocument();
    });

    it('should have checkmark icon with proper attributes', () => {
      const completedProblem = { ...baseProblem, completed: true };
      render(<ProblemCard problem={completedProblem} onComplete={vi.fn()} />);

      const checkmark = screen.getByText('Completed').previousElementSibling;
      expect(checkmark).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle problem with very long name', () => {
      const longNameProblem = {
        ...baseProblem,
        name: 'This is a Very Long Problem Name That Should Still Display Correctly Without Breaking the Layout',
      };

      render(<ProblemCard problem={longNameProblem} onComplete={vi.fn()} />);

      expect(screen.getByText(longNameProblem.name)).toBeInTheDocument();
    });

    it('should handle problem with special characters in name', () => {
      const specialCharProblem = {
        ...baseProblem,
        name: 'Problem: "Array & String" [Easy] (LC #1)',
      };

      render(<ProblemCard problem={specialCharProblem} onComplete={vi.fn()} />);

      expect(screen.getByText(specialCharProblem.name)).toBeInTheDocument();
    });

    it('should handle different problem IDs correctly', () => {
      const mockOnComplete = vi.fn().mockResolvedValue(undefined);
      const problem1 = { ...baseProblem, id: 100 };
      const problem2 = { ...baseProblem, id: 200 };

      const { rerender } = render(<ProblemCard problem={problem1} onComplete={mockOnComplete} />);

      expect(screen.getByText('Two Sum')).toBeInTheDocument();

      rerender(<ProblemCard problem={problem2} onComplete={mockOnComplete} />);

      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    it('should handle URL with query parameters', () => {
      const problemWithQueryParams = {
        ...baseProblem,
        link: 'https://leetcode.com/problems/two-sum?envType=study-plan&id=algorithms',
      };

      render(<ProblemCard problem={problemWithQueryParams} onComplete={vi.fn()} />);

      const link = screen.getByRole('link', { name: /view problem/i });
      expect(link).toHaveAttribute('href', problemWithQueryParams.link);
    });
  });
});
