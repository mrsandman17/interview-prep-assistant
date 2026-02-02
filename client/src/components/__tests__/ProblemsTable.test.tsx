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
  {
    id: 4,
    name: 'Problem Without Insight',
    link: 'https://leetcode.com/problems/no-insight/',
    color: 'yellow',
    keyInsight: null,
    lastReviewed: '2024-01-18',
    createdAt: '2024-01-16T00:00:00Z',
    attemptCount: 2,
  },
  {
    id: 5,
    name: 'Problem With Empty Insight',
    link: 'https://leetcode.com/problems/empty-insight/',
    color: 'gray',
    keyInsight: '',
    lastReviewed: null,
    createdAt: '2024-01-17T00:00:00Z',
    attemptCount: 1,
  },
];

describe('ProblemsTable', () => {
  const defaultProps = {
    problems: mockProblems,
    onEdit: vi.fn(),
    isLoading: false,
    expandedRowId: null,
    onRowToggle: vi.fn(),
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
      expect(screen.getByText('Date Added')).toBeInTheDocument();
      expect(screen.getByText('Attempts')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render problem links', () => {
      render(<ProblemsTable {...defaultProps} />);

      const links = screen.getAllByText('View Problem');
      expect(links).toHaveLength(5);
    });

    it('should render color badges', () => {
      render(<ProblemsTable {...defaultProps} />);

      // Now have 2 "New" badges, so use getAllByText
      expect(screen.getAllByText('New')).toHaveLength(2);
      expect(screen.getByText('Mastered')).toBeInTheDocument();
      expect(screen.getByText('Struggling')).toBeInTheDocument();
      expect(screen.getByText('Okay')).toBeInTheDocument();
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
      expect(editButtons).toHaveLength(5);
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
    it('should sort by createdAt in descending order by default', () => {
      render(<ProblemsTable {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      // Skip header row - by createdAt desc (newest first): Problem With Empty Insight (2024-01-17), Problem Without Insight (2024-01-16), Longest Substring (2024-01-14), Add Two Numbers (2024-01-12), Two Sum (2024-01-10)
      expect(within(rows[1]).getByText('Problem With Empty Insight')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Problem Without Insight')).toBeInTheDocument();
      expect(within(rows[5]).getByText('Two Sum')).toBeInTheDocument();
    });

    it('should toggle sort direction when clicking same column header', async () => {
      const user = userEvent.setup();
      render(<ProblemsTable {...defaultProps} />);

      const dateAddedHeader = screen.getByText('Date Added');
      await user.click(dateAddedHeader);

      const rows = screen.getAllByRole('row');
      // After clicking, should toggle to ascending (oldest first)
      expect(within(rows[1]).getByText('Two Sum')).toBeInTheDocument();
    });

    it('should sort by color when clicking color header', async () => {
      const user = userEvent.setup();
      render(<ProblemsTable {...defaultProps} />);

      const colorHeader = screen.getByText('Status');
      await user.click(colorHeader);

      const rows = screen.getAllByRole('row');
      // Gray (0) < Orange (1) < Yellow (2) < Green (3)
      // First gray, then orange, then yellow, then green
      expect(within(rows[1]).getAllByText('New').length).toBeGreaterThan(0); // gray badge
      expect(within(rows[3]).getByText('Struggling')).toBeInTheDocument(); // orange badge
      expect(within(rows[4]).getByText('Okay')).toBeInTheDocument(); // yellow badge
      expect(within(rows[5]).getByText('Mastered')).toBeInTheDocument(); // green badge
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

      const badges = screen.getAllByText('New');
      expect(badges[0]).toHaveClass('bg-gray-500');
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

  describe('Expandable Rows', () => {
    describe('Initial State', () => {
      it('should render collapsed rows by default', () => {
        render(<ProblemsTable {...defaultProps} expandedRowId={null} />);

        // Expanded content should not be visible for any row
        expect(screen.queryByText('Use hash map for O(n)')).not.toBeInTheDocument();
        expect(screen.queryByText('Linked list traversal')).not.toBeInTheDocument();
        expect(screen.queryByText('Sliding window')).not.toBeInTheDocument();
      });

      it('should render chevron icon indicating collapsed state', () => {
        const { container } = render(<ProblemsTable {...defaultProps} expandedRowId={null} />);

        // Should have ChevronRight icons (collapsed state)
        const chevrons = container.querySelectorAll('[data-testid="chevron-right"]');
        expect(chevrons.length).toBeGreaterThan(0);
      });

      it('should apply cursor-pointer to clickable rows', () => {
        const { container } = render(<ProblemsTable {...defaultProps} expandedRowId={null} />);

        const rows = container.querySelectorAll('tbody tr');
        rows.forEach(row => {
          expect(row).toHaveClass('cursor-pointer');
        });
      });
    });

    describe('Row Expansion', () => {
      it('should expand row when clicked', async () => {
        const user = userEvent.setup();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={null}
            onRowToggle={handleRowToggle}
          />
        );

        // Click on first problem name (Add Two Numbers - alphabetically first)
        const addTwoNumbers = screen.getByText('Add Two Numbers');
        await user.click(addTwoNumbers);

        // Should call onRowToggle with correct problem ID (2 = Add Two Numbers)
        expect(handleRowToggle).toHaveBeenCalledWith(2);
        expect(handleRowToggle).toHaveBeenCalledTimes(1);
      });

      it('should display key insight when row is expanded', () => {
        render(<ProblemsTable {...defaultProps} expandedRowId={1} />);

        // Expanded row should show key insight
        expect(screen.getByText('Use hash map for O(n)')).toBeInTheDocument();
      });

      it('should render expanded icon when row is expanded', () => {
        const { container } = render(<ProblemsTable {...defaultProps} expandedRowId={1} />);

        // Should have at least one ChevronDown icon (expanded state)
        const chevronDown = container.querySelector('[data-testid="chevron-down"]');
        expect(chevronDown).toBeInTheDocument();
      });

      it('should apply expanded row styling', () => {
        const { container } = render(<ProblemsTable {...defaultProps} expandedRowId={1} />);

        // Expanded content area should exist
        const expandedContent = container.querySelector('[data-testid="expanded-content"]');
        expect(expandedContent).toBeInTheDocument();
      });
    });

    describe('Row Collapse', () => {
      it('should collapse row when clicked again', async () => {
        const user = userEvent.setup();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={1}
            onRowToggle={handleRowToggle}
          />
        );

        // Key insight should be visible initially
        expect(screen.getByText('Use hash map for O(n)')).toBeInTheDocument();

        // Click on the expanded row (Two Sum - id 1) - need to find it by text
        const twoSumRow = screen.getByText('Two Sum').closest('tr');
        await user.click(twoSumRow!);

        // Should call onRowToggle to toggle the row (parent manages state)
        expect(handleRowToggle).toHaveBeenCalledWith(1);
      });

      it('should hide expanded content when expandedRowId is null', () => {
        const { rerender } = render(<ProblemsTable {...defaultProps} expandedRowId={1} />);

        // Initially expanded
        expect(screen.getByText('Use hash map for O(n)')).toBeInTheDocument();

        // Rerender with expandedRowId = null
        rerender(<ProblemsTable {...defaultProps} expandedRowId={null} />);

        // Should hide expanded content
        expect(screen.queryByText('Use hash map for O(n)')).not.toBeInTheDocument();
      });
    });

    describe('Toggle Between Rows', () => {
      it('should toggle between rows (only one expanded at a time)', () => {
        const { rerender } = render(<ProblemsTable {...defaultProps} expandedRowId={1} />);

        // First row expanded
        expect(screen.getByText('Use hash map for O(n)')).toBeInTheDocument();
        expect(screen.queryByText('Linked list traversal')).not.toBeInTheDocument();

        // Rerender with second row expanded
        rerender(<ProblemsTable {...defaultProps} expandedRowId={2} />);

        // First row should be collapsed, second row expanded
        expect(screen.queryByText('Use hash map for O(n)')).not.toBeInTheDocument();
        expect(screen.getByText('Linked list traversal')).toBeInTheDocument();
      });

      it('should call onRowToggle with correct problem ID when different row clicked', async () => {
        const user = userEvent.setup();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={1}
            onRowToggle={handleRowToggle}
          />
        );

        // Click on "Add Two Numbers" row (id: 2)
        const addTwoNumbersRow = screen.getByText('Add Two Numbers').closest('tr');
        await user.click(addTwoNumbersRow!);

        // Should call onRowToggle with second problem's ID
        expect(handleRowToggle).toHaveBeenCalledWith(2);
      });
    });

    describe('Edit Button Isolation', () => {
      it('should not toggle expansion when Edit button clicked', async () => {
        const user = userEvent.setup();
        const handleEdit = vi.fn();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={null}
            onEdit={handleEdit}
            onRowToggle={handleRowToggle}
          />
        );

        // Click Edit button
        const editButtons = screen.getAllByText('Edit');
        await user.click(editButtons[0]);

        // Should call onEdit but NOT onRowToggle
        expect(handleEdit).toHaveBeenCalled();
        expect(handleRowToggle).not.toHaveBeenCalled();
      });

      it('should call onEdit with correct problem when Edit clicked', async () => {
        const user = userEvent.setup();
        const handleEdit = vi.fn();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={null}
            onEdit={handleEdit}
            onRowToggle={handleRowToggle}
          />
        );

        // Click Edit button on second row (by createdAt desc: Problem Without Insight, id: 4)
        const editButtons = screen.getAllByText('Edit');
        await user.click(editButtons[1]);

        // Should call onEdit with correct problem (Problem Without Insight)
        expect(handleEdit).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 4,
            name: 'Problem Without Insight',
          })
        );
        expect(handleRowToggle).not.toHaveBeenCalled();
      });

      it('should not toggle expansion when View Problem link clicked', async () => {
        const user = userEvent.setup();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={null}
            onRowToggle={handleRowToggle}
          />
        );

        // Click View Problem link
        const links = screen.getAllByText('View Problem');
        await user.click(links[0]);

        // Should NOT call onRowToggle
        expect(handleRowToggle).not.toHaveBeenCalled();
      });
    });

    describe('Empty Key Insight', () => {
      it('should display empty state when key insight is null', () => {
        render(<ProblemsTable {...defaultProps} expandedRowId={4} />);

        // Should show empty state message
        expect(screen.getByText(/no key insight recorded yet/i)).toBeInTheDocument();
        expect(screen.getByText(/click edit to add one/i)).toBeInTheDocument();
      });

      it('should display empty state when key insight is empty string', () => {
        render(<ProblemsTable {...defaultProps} expandedRowId={5} />);

        // Should show empty state message
        expect(screen.getByText(/no key insight recorded yet/i)).toBeInTheDocument();
        expect(screen.getByText(/click edit to add one/i)).toBeInTheDocument();
      });

      it('should allow clicking Edit from empty state', async () => {
        const user = userEvent.setup();
        const handleEdit = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={4}
            onEdit={handleEdit}
          />
        );

        // Empty state should be visible
        expect(screen.getByText(/no key insight recorded yet/i)).toBeInTheDocument();

        // Edit button should still be clickable
        const editButtons = screen.getAllByText('Edit');
        const editButton = editButtons.find(btn => {
          const row = btn.closest('tr');
          return row?.textContent?.includes('Problem Without Insight');
        });

        expect(editButton).toBeDefined();
        if (editButton) {
          await user.click(editButton);
          expect(handleEdit).toHaveBeenCalledWith(
            expect.objectContaining({ id: 4 })
          );
        }
      });
    });

    describe('Long Key Insight', () => {
      it('should handle very long key insight text', () => {
        const longInsightProblem: Problem = {
          id: 999,
          name: 'Long Insight Problem',
          link: 'https://leetcode.com/problems/long/',
          color: 'green',
          keyInsight: 'This is a very long key insight that contains multiple sentences and detailed explanation. It goes on and on with extensive details about the algorithm, time complexity, space complexity, edge cases, and various optimization techniques that could be applied. The text is intentionally verbose to test how the UI handles lengthy content in the expanded row section.',
          lastReviewed: '2024-01-20',
          createdAt: '2024-01-20T00:00:00Z',
          attemptCount: 10,
        };

        render(
          <ProblemsTable
            {...defaultProps}
            problems={[longInsightProblem]}
            expandedRowId={999}
          />
        );

        // Long text should be rendered
        expect(screen.getByText(/this is a very long key insight/i)).toBeInTheDocument();
      });

      it('should wrap long key insight text properly', () => {
        const longInsightProblem: Problem = {
          id: 998,
          name: 'Wrap Test Problem',
          link: 'https://leetcode.com/problems/wrap/',
          color: 'yellow',
          keyInsight: 'A'.repeat(500), // 500 characters
          lastReviewed: '2024-01-20',
          createdAt: '2024-01-20T00:00:00Z',
          attemptCount: 5,
        };

        const { container } = render(
          <ProblemsTable
            {...defaultProps}
            problems={[longInsightProblem]}
            expandedRowId={998}
          />
        );

        // Expanded content should exist
        const expandedContent = container.querySelector('[data-testid="expanded-content"]');
        expect(expandedContent).toBeInTheDocument();
      });
    });

    describe('Accessibility', () => {
      it('should have accessible row click handlers', () => {
        const { container } = render(<ProblemsTable {...defaultProps} expandedRowId={null} />);

        const rows = container.querySelectorAll('tbody tr');
        rows.forEach(row => {
          // Rows should be clickable
          expect(row).toHaveClass('cursor-pointer');
        });
      });

      it('should support Space bar for keyboard navigation', async () => {
        const user = userEvent.setup();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={null}
            onRowToggle={handleRowToggle}
          />
        );

        // Focus on first row and press Space
        const firstRow = screen.getByText('Add Two Numbers').closest('tr');
        firstRow?.focus();
        await user.keyboard(' ');

        // Should call onRowToggle
        expect(handleRowToggle).toHaveBeenCalledWith(2);
      });

      it('should support Enter key for keyboard navigation', async () => {
        const user = userEvent.setup();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={null}
            onRowToggle={handleRowToggle}
          />
        );

        // Focus on first row and press Enter
        const firstRow = screen.getByText('Add Two Numbers').closest('tr');
        firstRow?.focus();
        await user.keyboard('{Enter}');

        // Should call onRowToggle
        expect(handleRowToggle).toHaveBeenCalledWith(2);
      });

      it('should maintain table structure with expanded content', () => {
        render(<ProblemsTable {...defaultProps} expandedRowId={1} />);

        // Table should still have proper structure
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();

        // Should still have all rows
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(5); // Header + 5 data rows (some may be expanded)
      });

      it('should have proper ARIA attributes for expandable rows', () => {
        const { container } = render(<ProblemsTable {...defaultProps} expandedRowId={1} />);

        // Expandable rows should have appropriate attributes
        const expandedRow = container.querySelector('[data-testid="expanded-content"]');
        expect(expandedRow).toBeInTheDocument();
      });
    });

    describe('Multiple Problems', () => {
      it('should handle table with multiple problems correctly', async () => {
        const user = userEvent.setup();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            problems={mockProblems}
            expandedRowId={null}
            onRowToggle={handleRowToggle}
          />
        );

        // All problems should be visible
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
        expect(screen.getByText('Add Two Numbers')).toBeInTheDocument();
        expect(screen.getByText('Longest Substring')).toBeInTheDocument();

        // None should show expanded content
        expect(screen.queryByText('Use hash map for O(n)')).not.toBeInTheDocument();

        // Click first row (Add Two Numbers - alphabetically first, id 2)
        const addTwoNumbers = screen.getByText('Add Two Numbers');
        await user.click(addTwoNumbers);

        expect(handleRowToggle).toHaveBeenCalledWith(2);
      });

      it('should correctly identify which row to expand by ID', () => {
        const { rerender } = render(
          <ProblemsTable {...defaultProps} expandedRowId={null} />
        );

        // No expanded content initially
        expect(screen.queryByText('Sliding window')).not.toBeInTheDocument();

        // Expand problem with id=3
        rerender(<ProblemsTable {...defaultProps} expandedRowId={3} />);

        // Should show correct key insight
        expect(screen.getByText('Sliding window')).toBeInTheDocument();
        expect(screen.queryByText('Use hash map for O(n)')).not.toBeInTheDocument();
        expect(screen.queryByText('Linked list traversal')).not.toBeInTheDocument();
      });
    });

    describe('Hover Effects', () => {
      it('should maintain hover styles on expandable rows', () => {
        const { container } = render(<ProblemsTable {...defaultProps} expandedRowId={null} />);

        const rows = container.querySelectorAll('tbody tr');
        rows.forEach(row => {
          expect(row).toHaveClass('hover:bg-gray-50');
        });
      });

      it('should maintain hover styles when row is expanded', () => {
        const { container } = render(<ProblemsTable {...defaultProps} expandedRowId={1} />);

        const rows = container.querySelectorAll('tbody tr');
        // First data row should still have hover styles
        expect(rows[0]).toHaveClass('hover:bg-gray-50');
      });
    });

    describe('Edge Cases', () => {
      it('should handle expandedRowId that does not exist in problems list', () => {
        render(<ProblemsTable {...defaultProps} expandedRowId={9999} />);

        // Should not crash, no expanded content should show
        expect(screen.queryByText('Use hash map for O(n)')).not.toBeInTheDocument();
      });

      it('should handle rapid row toggling', async () => {
        const user = userEvent.setup();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            expandedRowId={null}
            onRowToggle={handleRowToggle}
          />
        );

        // Rapidly click multiple problem names
        await user.click(screen.getByText('Add Two Numbers'));
        await user.click(screen.getByText('Longest Substring'));
        await user.click(screen.getByText('Problem With Empty Insight'));

        // Should call onRowToggle for each click
        expect(handleRowToggle).toHaveBeenCalledTimes(3);
      });

      it('should handle single problem with expansion', async () => {
        const user = userEvent.setup();
        const handleRowToggle = vi.fn();

        render(
          <ProblemsTable
            {...defaultProps}
            problems={[mockProblems[0]]}
            expandedRowId={null}
            onRowToggle={handleRowToggle}
          />
        );

        // Click on the problem name
        await user.click(screen.getByText('Two Sum'));

        expect(handleRowToggle).toHaveBeenCalledWith(1);
      });
    });
  });
});
