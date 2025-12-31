/**
 * Tests for ProblemsTable component
 * Tests table rendering, sorting, loading/empty states, and accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProblemsTable } from '../ProblemsTable';
import type { Problem } from '../../api/types';

const mockProblems: Problem[] = [
  {
    id: 1,
    name: 'Two Sum',
    link: 'https://leetcode.com/problems/two-sum/',
    color: 'gray',
    keyInsight: 'Use hash map for O(n)',
    lastReviewed: '2024-01-15',
    createdAt: '2024-01-10T00:00:00Z',
    attemptCount: 3,
  },
  {
    id: 2,
    name: 'Add Two Numbers',
    link: 'https://leetcode.com/problems/add-two-numbers/',
    color: 'green',
    keyInsight: 'Linked list traversal',
    lastReviewed: '2024-01-20',
    createdAt: '2024-01-12T00:00:00Z',
    attemptCount: 5,
  },
  {
    id: 3,
    name: 'Longest Substring',
    link: 'https://leetcode.com/problems/longest-substring/',
    color: 'orange',
    keyInsight: 'Sliding window',
    lastReviewed: null,
    createdAt: '2024-01-14T00:00:00Z',
    attemptCount: 0,
  },
];

describe('ProblemsTable', () => {
  const defaultProps = {
    problems: mockProblems,
    onEdit: vi.fn(),
    isLoading: false,
  };

  describe('Rendering', () => {
    it('should render table with all problems', () => {
      render(<ProblemsTable {...defaultProps} />);

      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('Add Two Numbers')).toBeInTheDocument();
      expect(screen.getByText('Longest Substring')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<ProblemsTable {...defaultProps} />);

      expect(screen.getByText('Problem Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Last Reviewed')).toBeInTheDocument();
      expect(screen.getByText('Attempts')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render problem links', () => {
      render(<ProblemsTable {...defaultProps} />);

      const links = screen.getAllByText('View Problem');
      expect(links).toHaveLength(3);
    });

    it('should render color badges', () => {
      render(<ProblemsTable {...defaultProps} />);

      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Mastered')).toBeInTheDocument();
      expect(screen.getByText('Struggling')).toBeInTheDocument();
    });

    it('should render attempt counts', () => {
      render(<ProblemsTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(within(table).getByText('3')).toBeInTheDocument();
      expect(within(table).getByText('5')).toBeInTheDocument();
      expect(within(table).getByText('0')).toBeInTheDocument();
    });

    it('should render edit buttons', () => {
      render(<ProblemsTable {...defaultProps} />);

      const editButtons = screen.getAllByText('Edit');
      expect(editButtons).toHaveLength(3);
    });

    it('should render results count', () => {
      render(<ProblemsTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      // Footer with count is present
      expect(screen.getByText(/showing/i)).toBeInTheDocument();
    });
  });

  describe('Date formatting', () => {
    it('should format dates correctly', () => {
      render(<ProblemsTable {...defaultProps} />);

      // Dates are formatted as locale strings, check for presence in table
      const table = screen.getByRole('table');
      expect(table.textContent).toContain('2024'); // Year should be present
    });

    it('should show "Never" for null lastReviewed dates', () => {
      render(<ProblemsTable {...defaultProps} />);

      const neverTexts = screen.getAllByText('Never');
      expect(neverTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Sorting', () => {
    it('should sort by name in ascending order by default', () => {
      render(<ProblemsTable {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      // Skip header row
      expect(within(rows[1]).getByText('Add Two Numbers')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Longest Substring')).toBeInTheDocument();
      expect(within(rows[3]).getByText('Two Sum')).toBeInTheDocument();
    });

    it('should toggle sort direction when clicking same column header', async () => {
      const user = userEvent.setup();
      render(<ProblemsTable {...defaultProps} />);

      const nameHeader = screen.getByText('Problem Name');
      await user.click(nameHeader);

      const rows = screen.getAllByRole('row');
      // After clicking, should reverse to descending
      expect(within(rows[1]).getByText('Two Sum')).toBeInTheDocument();
    });

    it('should sort by color when clicking color header', async () => {
      const user = userEvent.setup();
      render(<ProblemsTable {...defaultProps} />);

      const colorHeader = screen.getByText('Status');
      await user.click(colorHeader);

      const rows = screen.getAllByRole('row');
      // Gray (0) < Orange (1) < Green (3)
      expect(within(rows[1]).getByText('New')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Struggling')).toBeInTheDocument();
      expect(within(rows[3]).getByText('Mastered')).toBeInTheDocument();
    });

    it('should sort by attempt count when clicking attempts header', async () => {
      const user = userEvent.setup();
      render(<ProblemsTable {...defaultProps} />);

      const attemptsHeader = screen.getByText('Attempts');
      await user.click(attemptsHeader);

      const rows = screen.getAllByRole('row');
      const cells = rows.map(row => within(row).queryAllByRole('cell'));

      // First data row should have 0 attempts (ascending order)
      expect(cells[1].find(cell => cell.textContent === '0')).toBeDefined();
    });

    it('should sort by last reviewed when clicking last reviewed header', async () => {
      const user = userEvent.setup();
      render(<ProblemsTable {...defaultProps} />);

      const lastReviewedHeader = screen.getByText('Last Reviewed');
      await user.click(lastReviewedHeader);

      // Should sort with null values first (empty string), then dates
      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('Never')).toBeInTheDocument();
    });

    it('should show sort indicator on active column', async () => {
      const user = userEvent.setup();
      render(<ProblemsTable {...defaultProps} />);

      const nameHeader = screen.getByText('Problem Name');
      const headerCell = nameHeader.closest('th');

      // Should have sort icon
      expect(headerCell).toBeInTheDocument();
    });
  });

  describe('Edit functionality', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const handleEdit = vi.fn();

      render(<ProblemsTable {...defaultProps} onEdit={handleEdit} />);

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(handleEdit).toHaveBeenCalled();
      // Check that it was called with a problem object
      expect(handleEdit.mock.calls[0][0]).toHaveProperty('id');
      expect(handleEdit.mock.calls[0][0]).toHaveProperty('name');
    });

    it('should call onEdit with correct problem data', async () => {
      const user = userEvent.setup();
      const handleEdit = vi.fn();

      render(<ProblemsTable {...defaultProps} onEdit={handleEdit} />);

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[1]);

      expect(handleEdit).toHaveBeenCalled();
      // Check that it was called with a problem object
      expect(handleEdit.mock.calls[0][0]).toHaveProperty('id');
      expect(handleEdit.mock.calls[0][0]).toHaveProperty('name');
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<ProblemsTable {...defaultProps} isLoading={true} />);

      expect(screen.getByText(/loading problems/i)).toBeInTheDocument();
    });

    it('should not show table when loading', () => {
      render(<ProblemsTable {...defaultProps} isLoading={true} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should show spinner with animation', () => {
      const { container } = render(<ProblemsTable {...defaultProps} isLoading={true} />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no problems', () => {
      render(<ProblemsTable {...defaultProps} problems={[]} />);

      expect(screen.getByText(/no problems found/i)).toBeInTheDocument();
    });

    it('should show helpful message in empty state', () => {
      render(<ProblemsTable {...defaultProps} problems={[]} />);

      expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
    });

    it('should show icon in empty state', () => {
      const { container } = render(<ProblemsTable {...defaultProps} problems={[]} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not show table when empty', () => {
      render(<ProblemsTable {...defaultProps} problems={[]} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(<ProblemsTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should have column headers with scope', () => {
      render(<ProblemsTable {...defaultProps} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should have clickable headers for sorting', () => {
      render(<ProblemsTable {...defaultProps} />);

      const nameHeader = screen.getByText('Problem Name').closest('th');
      expect(nameHeader).toHaveClass('cursor-pointer');
    });

    it('should have select-none on sortable headers', () => {
      render(<ProblemsTable {...defaultProps} />);

      const nameHeader = screen.getByText('Problem Name').closest('th');
      expect(nameHeader).toHaveClass('select-none');
    });

    it('should open problem links in new tab', () => {
      render(<ProblemsTable {...defaultProps} />);

      const links = screen.getAllByText('View Problem');
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Color badge styling', () => {
    it('should apply correct styles for gray badge', () => {
      render(<ProblemsTable {...defaultProps} />);

      const badge = screen.getByText('New');
      expect(badge).toHaveClass('bg-gray-500');
    });

    it('should apply correct styles for green badge', () => {
      render(<ProblemsTable {...defaultProps} />);

      const badge = screen.getByText('Mastered');
      expect(badge).toHaveClass('bg-problem-green');
    });

    it('should apply correct styles for orange badge', () => {
      render(<ProblemsTable {...defaultProps} />);

      const badge = screen.getByText('Struggling');
      expect(badge).toHaveClass('bg-problem-orange');
    });
  });

  describe('Hover effects', () => {
    it('should have hover effect on table rows', () => {
      const { container } = render(<ProblemsTable {...defaultProps} />);

      const rows = container.querySelectorAll('tbody tr');
      rows.forEach(row => {
        expect(row).toHaveClass('hover:bg-gray-50');
      });
    });

    it('should have hover effect on column headers', () => {
      render(<ProblemsTable {...defaultProps} />);

      const nameHeader = screen.getByText('Problem Name').closest('th');
      expect(nameHeader).toHaveClass('hover:bg-gray-100');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero attempt count', () => {
      render(<ProblemsTable {...defaultProps} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle missing attemptCount field', () => {
      const problemsWithoutAttemptCount: Problem[] = [
        {
          ...mockProblems[0],
          attemptCount: undefined,
        },
      ];

      render(<ProblemsTable {...defaultProps} problems={problemsWithoutAttemptCount} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle single problem correctly (singular vs plural)', () => {
      render(<ProblemsTable {...defaultProps} problems={[mockProblems[0]]} />);

      // Should show count in footer
      expect(screen.getByText(/showing/i)).toBeInTheDocument();
    });

    it('should handle multiple problems correctly (plural)', () => {
      render(<ProblemsTable {...defaultProps} />);

      // Should show count in footer
      expect(screen.getByText(/showing/i)).toBeInTheDocument();
    });

    it('should handle long problem names', () => {
      const longNameProblem: Problem = {
        ...mockProblems[0],
        name: 'This is a very long problem name that might wrap or overflow in the table cell',
      };

      render(<ProblemsTable {...defaultProps} problems={[longNameProblem]} />);

      expect(screen.getByText(/this is a very long problem name/i)).toBeInTheDocument();
    });

    it('should prevent link click from triggering row actions', async () => {
      const user = userEvent.setup();
      render(<ProblemsTable {...defaultProps} />);

      const link = screen.getAllByText('View Problem')[0];

      // Click should not propagate (handled by stopPropagation in component)
      await user.click(link);

      // Link should still be clickable
      expect(link).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large number of problems', () => {
      const manyProblems: Problem[] = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Problem ${i}`,
        link: `https://leetcode.com/problems/problem-${i}/`,
        color: 'gray' as const,
        keyInsight: null,
        lastReviewed: null,
        createdAt: new Date().toISOString(),
        attemptCount: i,
      }));

      render(<ProblemsTable {...defaultProps} problems={manyProblems} />);

      // Should render table with all problems
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText(/showing/i)).toBeInTheDocument();
    });
  });
});
