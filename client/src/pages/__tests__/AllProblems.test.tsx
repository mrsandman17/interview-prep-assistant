/**
 * Tests for AllProblems page
 * Tests table view, filtering, editing, and CSV import integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AllProblems } from '../AllProblems';
import { problemsApi } from '../../api/client';
import type { Problem } from '../../api/types';

// Mock the API client
vi.mock('../../api/client', () => ({
  problemsApi: {
    getAll: vi.fn(),
    update: vi.fn(),
  },
}));

const mockProblems: Problem[] = [
  {
    id: 1,
    name: 'Two Sum',
    link: 'https://leetcode.com/problems/two-sum/',
    color: 'gray',
    keyInsight: 'Use hash map',
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
];

describe('AllProblems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(problemsApi.getAll).mockResolvedValue(mockProblems);
  });

  describe('Page Structure', () => {
    it('should render page title', async () => {
      render(<AllProblems />);

      expect(screen.getByText('All Problems')).toBeInTheDocument();
    });

    it('should render page description', () => {
      render(<AllProblems />);

      expect(screen.getByText('Manage your LeetCode problem collection')).toBeInTheDocument();
    });

    it('should render Import CSV button', () => {
      render(<AllProblems />);

      expect(screen.getByRole('button', { name: /import csv/i })).toBeInTheDocument();
    });

    it('should have proper heading levels', () => {
      render(<AllProblems />);

      const heading = screen.getByRole('heading', { name: /all problems/i, level: 2 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Problems table', () => {
    it('should fetch and display problems on mount', async () => {
      render(<AllProblems />);

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
        expect(screen.getByText('Add Two Numbers')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<AllProblems />);

      expect(screen.getByText(/loading problems/i)).toBeInTheDocument();
    });

    it('should display FilterBar component', async () => {
      render(<AllProblems />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by problem name/i)).toBeInTheDocument();
      });
    });

    it('should display ProblemsTable component', async () => {
      render(<AllProblems />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter problems by search query', async () => {
      const user = userEvent.setup();
      render(<AllProblems />);

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by problem name/i);
      await user.type(searchInput, 'Add');

      expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();
      expect(screen.getByText('Add Two Numbers')).toBeInTheDocument();
    });

    it('should filter problems by color', async () => {
      const user = userEvent.setup();
      render(<AllProblems />);

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
      });

      const colorSelect = screen.getByLabelText(/filter by color/i);
      await user.selectOptions(colorSelect, 'green');

      expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();
      expect(screen.getByText('Add Two Numbers')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should display error message when fetch fails', async () => {
      vi.mocked(problemsApi.getAll).mockRejectedValue(new Error('Network error'));

      render(<AllProblems />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      vi.mocked(problemsApi.getAll).mockRejectedValueOnce(new Error('Network error'));

      render(<AllProblems />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      vi.mocked(problemsApi.getAll).mockResolvedValue(mockProblems);

      const retryButton = screen.getByText(/try again/i);
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Two Sum')).toBeInTheDocument();
      });
    });
  });

  describe('Import CSV Modal Integration', () => {
    it('should not show import modal initially', () => {
      render(<AllProblems />);

      expect(screen.queryByText('Import Problems from CSV')).not.toBeInTheDocument();
    });

    it('should open import modal when Import CSV button clicked', async () => {
      const user = userEvent.setup();
      render(<AllProblems />);

      const importButton = screen.getByRole('button', { name: /import csv/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import Problems from CSV')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button with icon and text', () => {
      render(<AllProblems />);

      const importButton = screen.getByRole('button', { name: /import csv/i });
      expect(importButton).toBeInTheDocument();
      expect(importButton).toHaveAccessibleName();
    });
  });
});
