/**
 * Tests for Dashboard page
 * Tests problem rendering, stats display, refresh functionality, user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '../Dashboard';
import { useDaily } from '../../hooks/useDaily';
import { useStats } from '../../hooks/useStats';
import type { DailyProblem, Stats } from '../../api/types';

// Mock the hooks
vi.mock('../../hooks/useDaily');
vi.mock('../../hooks/useStats');

describe('Dashboard', () => {
  const mockDailyProblems: DailyProblem[] = [
    {
      id: 1,
      name: 'Two Sum',
      link: 'https://leetcode.com/problems/two-sum',
      color: 'gray',
      keyInsight: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      selectionId: 1,
      completed: false,
    },
    {
      id: 2,
      name: 'Valid Parentheses',
      link: 'https://leetcode.com/problems/valid-parentheses',
      color: 'orange',
      keyInsight: 'Use a stack',
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      selectionId: 2,
      completed: false,
    },
    {
      id: 3,
      name: 'Reverse String',
      link: 'https://leetcode.com/problems/reverse-string',
      color: 'green',
      keyInsight: 'Two pointers',
      createdAt: '2025-01-03T00:00:00Z',
      updatedAt: '2025-01-03T00:00:00Z',
      selectionId: 3,
      completed: true,
    },
  ];

  const mockStats: Stats = {
    totalProblems: 50,
    greenProblems: 15,
    currentStreak: 7,
    readyForReview: 12,
  };

  const mockUseDaily = {
    problems: mockDailyProblems,
    loading: false,
    error: null,
    completeProblem: vi.fn(),
    refreshSelection: vi.fn(),
    refetch: vi.fn(),
  };

  const mockUseStats = {
    stats: mockStats,
    loading: false,
    error: null,
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDaily).mockReturnValue(mockUseDaily);
    vi.mocked(useStats).mockReturnValue(mockUseStats);
  });

  describe('Loading state', () => {
    it('should show loading spinner when loading daily problems', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        loading: true,
        problems: [],
      });

      render(<Dashboard />);

      expect(screen.getByText(/loading today's problems/i)).toBeInTheDocument();
    });

    it('should not show content while loading', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        loading: true,
        problems: [],
      });

      render(<Dashboard />);

      expect(screen.queryByText('Today\'s Practice')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when daily fetch fails', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        loading: false,
        error: 'Failed to fetch daily selection',
        problems: [],
      });

      render(<Dashboard />);

      expect(screen.getByText('Failed to fetch daily selection')).toBeInTheDocument();
    });

    it('should not show content when there is an error', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        loading: false,
        error: 'Network error',
        problems: [],
      });

      render(<Dashboard />);

      expect(screen.queryByText('Today\'s Practice')).not.toBeInTheDocument();
    });

    it('should show error icon in error state', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        loading: false,
        error: 'Failed to fetch',
        problems: [],
      });

      render(<Dashboard />);

      const errorMessage = screen.getByText('Failed to fetch');
      // Find parent with bg-red-50 class
      const errorContainer = errorMessage.closest('.bg-red-50');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('Content rendering', () => {
    it('should render page title', () => {
      render(<Dashboard />);

      expect(screen.getByText('Today\'s Practice')).toBeInTheDocument();
    });

    it('should render page description', () => {
      render(<Dashboard />);

      expect(screen.getByText(/complete your daily problems to improve your skills/i)).toBeInTheDocument();
    });

    it('should render all problem cards', () => {
      render(<Dashboard />);

      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('Valid Parentheses')).toBeInTheDocument();
      expect(screen.getByText('Reverse String')).toBeInTheDocument();
    });

    it('should render progress indicator', () => {
      render(<Dashboard />);

      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('should show correct completion count (1 / 3)', () => {
      render(<Dashboard />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should render refresh button', () => {
      render(<Dashboard />);

      expect(screen.getByRole('button', { name: /new set/i })).toBeInTheDocument();
    });

    it('should show "New Set" button text when not refreshing', () => {
      render(<Dashboard />);

      expect(screen.getByRole('button', { name: /new set/i })).toHaveTextContent('New Set');
    });
  });

  describe('Progress bar', () => {
    it('should show progress bar with correct completion percentage', () => {
      const { container } = render(<Dashboard />);

      const progressBar = container.querySelector('.bg-blue-600');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '33.33333333333333%' });
    });

    it('should show 0% progress when no problems completed', () => {
      const allPendingProblems = mockDailyProblems.map(p => ({ ...p, completed: false }));
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        problems: allPendingProblems,
      });

      const { container } = render(<Dashboard />);

      const progressBar = container.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('should show 100% progress when all problems completed', () => {
      const allCompletedProblems = mockDailyProblems.map(p => ({ ...p, completed: true }));
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        problems: allCompletedProblems,
      });

      const { container } = render(<Dashboard />);

      const progressBar = container.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should handle zero problems gracefully', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        problems: [],
      });

      const { container } = render(<Dashboard />);

      const progressBar = container.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });
  });

  describe('Empty state', () => {
    it('should show warning message when no problems available', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        problems: [],
      });

      render(<Dashboard />);

      expect(screen.getByText(/no problems available/i)).toBeInTheDocument();
    });

    it('should show helpful message about adding problems', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        problems: [],
      });

      render(<Dashboard />);

      expect(screen.getByText(/add problems to your collection to get started/i)).toBeInTheDocument();
    });

    it('should not render problem grid when no problems', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        problems: [],
      });

      render(<Dashboard />);

      expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();
    });
  });

  describe('Stats display', () => {
    it('should render stats section when stats loaded', () => {
      render(<Dashboard />);

      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });

    it('should display ready for review stat', () => {
      render(<Dashboard />);

      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Ready for Review')).toBeInTheDocument();
    });

    it('should display current streak stat', () => {
      render(<Dashboard />);

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('Day Streak')).toBeInTheDocument();
    });

    it('should display mastered problems stat', () => {
      render(<Dashboard />);

      expect(screen.getByText('15')).toBeInTheDocument();
      // "Mastered" appears multiple times (badge + stat), so just check it exists
      const masteredTexts = screen.getAllByText('Mastered');
      expect(masteredTexts.length).toBeGreaterThan(0);
    });

    it('should display total problems stat', () => {
      render(<Dashboard />);

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('Total Problems')).toBeInTheDocument();
    });

    it('should not show stats when stats loading', () => {
      vi.mocked(useStats).mockReturnValue({
        ...mockUseStats,
        loading: true,
        stats: null,
      });

      render(<Dashboard />);

      expect(screen.queryByText('Your Progress')).not.toBeInTheDocument();
    });

    it('should not show stats when stats error', () => {
      vi.mocked(useStats).mockReturnValue({
        ...mockUseStats,
        error: 'Failed to fetch stats',
        stats: null,
      });

      render(<Dashboard />);

      expect(screen.queryByText('Your Progress')).not.toBeInTheDocument();
    });

    it('should not show stats when stats is null', () => {
      vi.mocked(useStats).mockReturnValue({
        ...mockUseStats,
        stats: null,
      });

      render(<Dashboard />);

      expect(screen.queryByText('Your Progress')).not.toBeInTheDocument();
    });
  });

  describe('Problem completion', () => {
    it('should call completeProblem when color button clicked', async () => {
      const user = userEvent.setup();
      const mockCompleteProblem = vi.fn().mockResolvedValue(undefined);

      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        completeProblem: mockCompleteProblem,
      });

      render(<Dashboard />);

      const greenButton = screen.getAllByRole('button', { name: /mark as mastered/i })[0];
      await user.click(greenButton);

      await waitFor(() => {
        expect(mockCompleteProblem).toHaveBeenCalledWith(1, 'green');
      });
    });

    it('should refetch stats after completing a problem', async () => {
      const user = userEvent.setup();
      const mockCompleteProblem = vi.fn().mockResolvedValue(undefined);
      const mockRefetchStats = vi.fn();

      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        completeProblem: mockCompleteProblem,
      });

      vi.mocked(useStats).mockReturnValue({
        ...mockUseStats,
        refetch: mockRefetchStats,
      });

      render(<Dashboard />);

      const greenButton = screen.getAllByRole('button', { name: /mark as mastered/i })[0];
      await user.click(greenButton);

      await waitFor(() => {
        expect(mockRefetchStats).toHaveBeenCalled();
      });
    });
  });

  describe('Refresh functionality', () => {
    it('should call refreshSelection when refresh button clicked', async () => {
      const user = userEvent.setup();
      const mockRefreshSelection = vi.fn().mockResolvedValue(undefined);

      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        refreshSelection: mockRefreshSelection,
      });

      render(<Dashboard />);

      const refreshButton = screen.getByRole('button', { name: /new set/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockRefreshSelection).toHaveBeenCalled();
      });
    });

    it('should refetch stats after refreshing selection', async () => {
      const user = userEvent.setup();
      const mockRefreshSelection = vi.fn().mockResolvedValue(undefined);
      const mockRefetchStats = vi.fn();

      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        refreshSelection: mockRefreshSelection,
      });

      vi.mocked(useStats).mockReturnValue({
        ...mockUseStats,
        refetch: mockRefetchStats,
      });

      render(<Dashboard />);

      const refreshButton = screen.getByRole('button', { name: /new set/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockRefetchStats).toHaveBeenCalled();
      });
    });

    it('should show "Refreshing..." text while refreshing', async () => {
      const user = userEvent.setup();
      let resolveRefresh: () => void;
      const refreshPromise = new Promise<void>((resolve) => {
        resolveRefresh = resolve;
      });

      const mockRefreshSelection = vi.fn().mockReturnValue(refreshPromise);

      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        refreshSelection: mockRefreshSelection,
      });

      render(<Dashboard />);

      const refreshButton = screen.getByRole('button', { name: /new set/i });
      await user.click(refreshButton);

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();

      resolveRefresh!();

      await waitFor(() => {
        expect(screen.getByText('New Set')).toBeInTheDocument();
      });
    });

    it('should disable refresh button while refreshing', async () => {
      const user = userEvent.setup();
      let resolveRefresh: () => void;
      const refreshPromise = new Promise<void>((resolve) => {
        resolveRefresh = resolve;
      });

      const mockRefreshSelection = vi.fn().mockReturnValue(refreshPromise);

      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        refreshSelection: mockRefreshSelection,
      });

      render(<Dashboard />);

      const refreshButton = screen.getByRole('button', { name: /new set/i });
      await user.click(refreshButton);

      expect(refreshButton).toBeDisabled();

      resolveRefresh!();

      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });

    it('should handle refresh errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockRefreshSelection = vi.fn().mockRejectedValue(new Error('Refresh failed'));

      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        refreshSelection: mockRefreshSelection,
      });

      render(<Dashboard />);

      const refreshButton = screen.getByRole('button', { name: /new set/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to refresh selection:',
          expect.any(Error)
        );
      });

      // Button should be enabled again after error
      expect(refreshButton).not.toBeDisabled();

      consoleError.mockRestore();
    });

    it('should re-enable button after failed refresh', async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockRefreshSelection = vi.fn().mockRejectedValue(new Error('Refresh failed'));

      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        refreshSelection: mockRefreshSelection,
      });

      render(<Dashboard />);

      const refreshButton = screen.getByRole('button', { name: /new set/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Dashboard />);

      const mainHeading = screen.getByRole('heading', { name: /today's practice/i, level: 2 });
      expect(mainHeading).toBeInTheDocument();
    });

    it('should have accessible progress label', () => {
      render(<Dashboard />);

      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<Dashboard />);

      expect(screen.getByRole('button', { name: /new set/i })).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle single problem', () => {
      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        problems: [mockDailyProblems[0]],
      });

      render(<Dashboard />);

      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('0 / 1')).toBeInTheDocument();
    });

    it('should handle large number of problems', () => {
      const manyProblems = Array.from({ length: 10 }, (_, i) => ({
        ...mockDailyProblems[0],
        id: i + 1,
        name: `Problem ${i + 1}`,
      }));

      vi.mocked(useDaily).mockReturnValue({
        ...mockUseDaily,
        problems: manyProblems,
      });

      render(<Dashboard />);

      expect(screen.getByText('0 / 10')).toBeInTheDocument();
    });

    it('should display stats with zero values', () => {
      const zeroStats: Stats = {
        totalProblems: 0,
        greenProblems: 0,
        currentStreak: 0,
        readyForReview: 0,
      };

      vi.mocked(useStats).mockReturnValue({
        ...mockUseStats,
        stats: zeroStats,
      });

      render(<Dashboard />);

      const statValues = screen.getAllByText('0');
      expect(statValues.length).toBeGreaterThan(0);
    });
  });
});
