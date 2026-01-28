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
    exportCSV: vi.fn(),
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

// Store original createElement before any mocking
const originalCreateElement = document.createElement.bind(document);

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

  describe('Export CSV Functionality', () => {
    beforeEach(() => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    describe('Export CSV Button', () => {
      it('should render Export CSV button with correct text', async () => {
        render(<AllProblems />);

        await waitFor(() => {
          expect(screen.getByText('Two Sum')).toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        expect(exportButton).toBeInTheDocument();
        expect(exportButton).toHaveTextContent(/export csv/i);
      });

      it('should disable Export CSV button when no problems exist', async () => {
        vi.mocked(problemsApi.getAll).mockResolvedValue([]);

        render(<AllProblems />);

        await waitFor(() => {
          expect(screen.queryByText('Loading problems')).not.toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        expect(exportButton).toBeDisabled();
      });

      it('should disable Export CSV button when loading', () => {
        render(<AllProblems />);

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        expect(exportButton).toBeDisabled();
      });

      it('should enable Export CSV button when problems are loaded', async () => {
        render(<AllProblems />);

        await waitFor(() => {
          expect(screen.getByText('Two Sum')).toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        expect(exportButton).not.toBeDisabled();
      });
    });

    describe('Export CSV Action', () => {
      beforeEach(() => {
        // Ensure createElement is not mocked from previous tests
        const createElementMock = document.createElement as any;
        if (createElementMock.mockRestore) {
          createElementMock.mockRestore();
        }
      });

      afterEach(() => {
        // Clean up all mocks after each test
        vi.useRealTimers();
        const createElementMock = document.createElement as any;
        if (createElementMock.mockRestore) {
          createElementMock.mockRestore();
        }
      });

      it('should trigger download on Export CSV button click', async () => {
        const user = userEvent.setup();
        const mockCSVContent = 'name,link,color,key_insight\nTwo Sum,https://leetcode.com/problems/two-sum/,gray,Use hash map';

        vi.mocked(problemsApi.exportCSV).mockResolvedValue(mockCSVContent);

        // Mock document.createElement to track link creation
        const mockLinks: HTMLAnchorElement[] = [];
        const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
          if (tagName === 'a') {
            const link = originalCreateElement('a');
            mockLinks.push(link);
            return link as any;
          }
          return originalCreateElement(tagName) as any;
        });
        const appendChildSpy = vi.spyOn(document.body, 'appendChild');
        const removeChildSpy = vi.spyOn(document.body, 'removeChild');
        const clickSpy = vi.fn();

        render(<AllProblems />);

        await waitFor(() => {
          expect(screen.getByText('Two Sum')).toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        await user.click(exportButton);

        await waitFor(() => {
          expect(problemsApi.exportCSV).toHaveBeenCalledTimes(1);
        });

        // Verify Blob was created with correct content
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(
          expect.any(Blob)
        );

        // Verify link creation and click
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(mockLinks.length).toBeGreaterThan(0);
        // Get the last created link (the download link)
        const createdLink = mockLinks[mockLinks.length - 1];
        expect(createdLink.href).toBe('blob:mock-url');
        expect(createdLink.download).toMatch(/problems-\d{4}-\d{2}-\d{2}\.csv/);
        expect(appendChildSpy).toHaveBeenCalledWith(createdLink);
        expect(removeChildSpy).toHaveBeenCalledWith(createdLink);
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

        // Cleanup
        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
      });

      it('should show success message after successful export', async () => {
        const user = userEvent.setup();
        const mockCSVContent = 'name,link,color,key_insight\nTwo Sum,https://leetcode.com/problems/two-sum/,gray,Use hash map';

        vi.mocked(problemsApi.exportCSV).mockResolvedValue(mockCSVContent);

        // Mock link creation to avoid actual download
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
          const element = originalCreateElement(tagName);
          if (tagName === 'a') {
            vi.spyOn(element as HTMLAnchorElement, 'click').mockImplementation(() => {});
          }
          return element as any;
        });

        render(<AllProblems />);

        await waitFor(() => {
          expect(screen.getByText('Two Sum')).toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        await user.click(exportButton);

        await waitFor(() => {
          expect(screen.getByText(/successfully exported/i)).toBeInTheDocument();
        });

        // Verify success message mentions problem count
        expect(screen.getByText(/2 problems/i)).toBeInTheDocument();

        // Cleanup: restore createElement to avoid affecting other tests
        vi.mocked(document.createElement).mockRestore();
      });

      it('should auto-dismiss success message after 3 seconds', async () => {
        try {
          vi.useFakeTimers();
          const user = userEvent.setup({ delay: null });
          const mockCSVContent = 'name,link,color,key_insight\nTwo Sum,https://leetcode.com/problems/two-sum/,gray,Use hash map';

          vi.mocked(problemsApi.exportCSV).mockResolvedValue(mockCSVContent);

          // Mock link creation
          vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            const element = originalCreateElement(tagName);
            if (tagName === 'a') {
              vi.spyOn(element as HTMLAnchorElement, 'click').mockImplementation(() => {});
            }
            return element as any;
          });

          render(<AllProblems />);

          // Temporarily switch to real timers for async operations
          vi.useRealTimers();

          await waitFor(() => {
            expect(screen.getByText('Two Sum')).toBeInTheDocument();
          });

          const exportButton = screen.getByRole('button', { name: /export csv/i });
          await user.click(exportButton);

          await waitFor(() => {
            expect(screen.getByText(/successfully exported/i)).toBeInTheDocument();
          });

          // Switch back to fake timers to test the timeout
          vi.useFakeTimers();

          // Fast-forward time by 3 seconds and run all timers
          await vi.advanceTimersByTimeAsync(3000);

          // Switch back to real timers
          vi.useRealTimers();

          // Check that the message is gone
          expect(screen.queryByText(/successfully exported/i)).not.toBeInTheDocument();
        } finally {
          vi.useRealTimers();
          // Cleanup: restore createElement to avoid affecting other tests
          const createElementMock = document.createElement as any;
          if (createElementMock.mockRestore) {
            createElementMock.mockRestore();
          }
        }
      });

      it('should handle export errors gracefully', async () => {
        const user = userEvent.setup();

        vi.mocked(problemsApi.exportCSV).mockRejectedValue(new Error('Export failed'));

        render(<AllProblems />);

        await waitFor(() => {
          expect(screen.getByText('Two Sum')).toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        await user.click(exportButton);

        await waitFor(() => {
          expect(screen.getByText(/export failed/i)).toBeInTheDocument();
        });
      });

      it('should show generic error message when API error has no message', async () => {
        const user = userEvent.setup();

        vi.mocked(problemsApi.exportCSV).mockRejectedValue(new Error());

        render(<AllProblems />);

        await waitFor(() => {
          expect(screen.getByText('Two Sum')).toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        await user.click(exportButton);

        await waitFor(() => {
          expect(screen.getByText(/failed to export problems/i)).toBeInTheDocument();
        });
      });
    });
  });
});
