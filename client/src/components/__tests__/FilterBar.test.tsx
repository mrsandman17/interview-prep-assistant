/**
 * Tests for FilterBar component
 * Tests search input, color filter, active filters display, and accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../FilterBar';

describe('FilterBar', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    selectedColor: 'all' as const,
    onColorChange: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<FilterBar {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should render color filter dropdown', () => {
      render(<FilterBar {...defaultProps} />);

      const colorSelect = screen.getByLabelText(/filter by color/i);
      expect(colorSelect).toBeInTheDocument();
    });

    it('should display all color options in dropdown', () => {
      render(<FilterBar {...defaultProps} />);

      const colorSelect = screen.getByLabelText(/filter by color/i);
      const options = Array.from(colorSelect.querySelectorAll('option'));
      const optionTexts = options.map(opt => opt.textContent);

      expect(optionTexts).toContain('All Colors');
      expect(optionTexts).toContain('New');
      expect(optionTexts).toContain('Struggling');
      expect(optionTexts).toContain('Okay');
      expect(optionTexts).toContain('Mastered');
    });

    it('should show search icon', () => {
      render(<FilterBar {...defaultProps} />);

      const searchIcon = screen.getByLabelText(/search problems by name/i);
      expect(searchIcon.previousSibling).toBeInTheDocument(); // Icon is in the same container
    });
  });

  describe('Search input', () => {
    it('should display current search query', () => {
      render(<FilterBar {...defaultProps} searchQuery="Two Sum" />);

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      expect(searchInput).toHaveValue('Two Sum');
    });

    it('should call onSearchChange when typing', async () => {
      const user = userEvent.setup();
      const handleSearchChange = vi.fn();

      render(<FilterBar {...defaultProps} onSearchChange={handleSearchChange} />);

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      await user.type(searchInput, 'Array');

      expect(handleSearchChange).toHaveBeenCalled();
      // userEvent.type triggers onChange for each character, so last call will be with full string
      const lastCall = handleSearchChange.mock.calls[handleSearchChange.mock.calls.length - 1][0];
      expect(lastCall).toContain('y'); // Last character of "Array"
    });

    it('should call onSearchChange for each character typed', async () => {
      const user = userEvent.setup();
      const handleSearchChange = vi.fn();

      render(<FilterBar {...defaultProps} onSearchChange={handleSearchChange} />);

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      await user.type(searchInput, 'abc');

      expect(handleSearchChange).toHaveBeenCalledTimes(3);
    });

    it('should clear search when cleared', async () => {
      const user = userEvent.setup();
      const handleSearchChange = vi.fn();

      render(<FilterBar {...defaultProps} searchQuery="test" onSearchChange={handleSearchChange} />);

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      await user.clear(searchInput);

      expect(handleSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Color filter', () => {
    it('should display current selected color', () => {
      render(<FilterBar {...defaultProps} selectedColor="orange" />);

      const colorSelect = screen.getByLabelText(/filter by color/i) as HTMLSelectElement;
      expect(colorSelect.value).toBe('orange');
    });

    it('should call onColorChange when color is selected', async () => {
      const user = userEvent.setup();
      const handleColorChange = vi.fn();

      render(<FilterBar {...defaultProps} onColorChange={handleColorChange} />);

      const colorSelect = screen.getByLabelText(/filter by color/i);
      await user.selectOptions(colorSelect, 'green');

      expect(handleColorChange).toHaveBeenCalledWith('green');
    });

    it('should call onColorChange with "all" when All Colors is selected', async () => {
      const user = userEvent.setup();
      const handleColorChange = vi.fn();

      render(<FilterBar {...defaultProps} selectedColor="orange" onColorChange={handleColorChange} />);

      const colorSelect = screen.getByLabelText(/filter by color/i);
      await user.selectOptions(colorSelect, 'all');

      expect(handleColorChange).toHaveBeenCalledWith('all');
    });
  });

  describe('Active filters display', () => {
    it('should not show active filters section when no filters are active', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.queryByText(/active filters/i)).not.toBeInTheDocument();
    });

    it('should show active filters section when search query is present', () => {
      render(<FilterBar {...defaultProps} searchQuery="Array" />);

      expect(screen.getByText(/active filters/i)).toBeInTheDocument();
    });

    it('should show active filters section when color filter is applied', () => {
      render(<FilterBar {...defaultProps} selectedColor="orange" />);

      expect(screen.getByText(/active filters/i)).toBeInTheDocument();
    });

    it('should display search filter badge with query', () => {
      render(<FilterBar {...defaultProps} searchQuery="Two Sum" />);

      expect(screen.getByText(/search: "Two Sum"/i)).toBeInTheDocument();
    });

    it('should display color filter badge with label', () => {
      render(<FilterBar {...defaultProps} selectedColor="orange" />);

      expect(screen.getByText(/color: struggling/i)).toBeInTheDocument();
    });

    it('should show both filter badges when both are active', () => {
      render(<FilterBar {...defaultProps} searchQuery="Array" selectedColor="green" />);

      expect(screen.getByText(/search: "Array"/i)).toBeInTheDocument();
      expect(screen.getByText(/color: mastered/i)).toBeInTheDocument();
    });

    it('should show clear all button when filters are active', () => {
      render(<FilterBar {...defaultProps} searchQuery="test" />);

      expect(screen.getByText(/clear all/i)).toBeInTheDocument();
    });
  });

  describe('Clear filter actions', () => {
    it('should clear search filter when clicking its close button', async () => {
      const user = userEvent.setup();
      const handleSearchChange = vi.fn();

      render(<FilterBar {...defaultProps} searchQuery="Array" onSearchChange={handleSearchChange} />);

      const clearSearchButton = screen.getByLabelText(/clear search filter/i);
      await user.click(clearSearchButton);

      expect(handleSearchChange).toHaveBeenCalledWith('');
    });

    it('should clear color filter when clicking its close button', async () => {
      const user = userEvent.setup();
      const handleColorChange = vi.fn();

      render(<FilterBar {...defaultProps} selectedColor="orange" onColorChange={handleColorChange} />);

      const clearColorButton = screen.getByLabelText(/clear color filter/i);
      await user.click(clearColorButton);

      expect(handleColorChange).toHaveBeenCalledWith('all');
    });

    it('should clear all filters when clicking clear all button', async () => {
      const user = userEvent.setup();
      const handleSearchChange = vi.fn();
      const handleColorChange = vi.fn();

      render(
        <FilterBar
          {...defaultProps}
          searchQuery="Array"
          selectedColor="orange"
          onSearchChange={handleSearchChange}
          onColorChange={handleColorChange}
        />
      );

      const clearAllButton = screen.getByText(/clear all/i);
      await user.click(clearAllButton);

      expect(handleSearchChange).toHaveBeenCalledWith('');
      expect(handleColorChange).toHaveBeenCalledWith('all');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for search input', () => {
      render(<FilterBar {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search problems by name/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should have proper labels for color filter', () => {
      render(<FilterBar {...defaultProps} />);

      const colorSelect = screen.getByLabelText(/filter by color/i);
      expect(colorSelect).toBeInTheDocument();
    });

    it('should have proper labels for clear filter buttons', () => {
      render(<FilterBar {...defaultProps} searchQuery="test" selectedColor="orange" />);

      expect(screen.getByLabelText(/clear search filter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/clear color filter/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable between inputs', async () => {
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      const colorSelect = screen.getByLabelText(/filter by color/i);

      await user.tab();
      expect(searchInput).toHaveFocus();

      await user.tab();
      expect(colorSelect).toHaveFocus();
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(<FilterBar {...defaultProps} />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty search query', () => {
      render(<FilterBar {...defaultProps} searchQuery="" />);

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      expect(searchInput).toHaveValue('');
    });

    it('should handle long search queries', () => {
      const longQuery = 'This is a very long search query that might overflow the input field';
      render(<FilterBar {...defaultProps} searchQuery={longQuery} />);

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      expect(searchInput).toHaveValue(longQuery);
    });

    it('should handle special characters in search query', () => {
      const specialQuery = '<script>alert("test")</script>';
      render(<FilterBar {...defaultProps} searchQuery={specialQuery} />);

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      expect(searchInput).toHaveValue(specialQuery);
    });

    it('should maintain filter state when re-rendered', () => {
      const { rerender } = render(<FilterBar {...defaultProps} searchQuery="test" selectedColor="orange" />);

      rerender(<FilterBar {...defaultProps} searchQuery="test" selectedColor="orange" />);

      expect(screen.getByText(/search: "test"/i)).toBeInTheDocument();
      expect(screen.getByText(/color: struggling/i)).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('should have responsive flex classes', () => {
      const { container } = render(<FilterBar {...defaultProps} />);

      const flexContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have responsive width for color select', () => {
      const { container } = render(<FilterBar {...defaultProps} />);

      const selectContainer = container.querySelector('.sm\\:w-48');
      expect(selectContainer).toBeInTheDocument();
    });
  });
});
