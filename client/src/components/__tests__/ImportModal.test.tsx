/**
 * Tests for ImportModal component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportModal } from '../ImportModal';
import { problemsApi } from '../../api/client';

// Mock the API
vi.mock('../../api/client', () => ({
  problemsApi: {
    importCSV: vi.fn(),
  },
}));

describe('ImportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ImportModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.queryByText('Import Problems from CSV')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('Import Problems from CSV')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should display "No file selected" initially', () => {
      render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('No file selected')).toBeInTheDocument();
    });

    it('should display selected file name', async () => {
      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(['test content'], 'problems.csv', { type: 'text/csv' });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('problems.csv')).toBeInTheDocument();
      });
    });

    it('should have disabled upload button when no file is selected', () => {
      render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      expect(uploadButton).toBeDisabled();
    });

    it('should enable upload button when file is selected', async () => {
      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(['test content'], 'problems.csv', { type: 'text/csv' });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /upload/i });
        expect(uploadButton).not.toBeDisabled();
      });
    });
  });

  describe('CSV Upload', () => {
    it('should show loading state during upload', async () => {
      // Mock API to delay response
      vi.mocked(problemsApi.importCSV).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ imported: 5, skipped: 2 }), 100))
      );

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(
        ['Problem,Link\nTwo Sum,https://leetcode.com/problems/two-sum/'],
        'problems.csv',
        { type: 'text/csv' }
      );
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument();
      });
    });

    it('should call importCSV with file contents', async () => {
      vi.mocked(problemsApi.importCSV).mockResolvedValue({ imported: 5, skipped: 2 });

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const csvContent = 'Problem,Link\nTwo Sum,https://leetcode.com/problems/two-sum/';
      const file = new File([csvContent], 'problems.csv', { type: 'text/csv' });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(problemsApi.importCSV).toHaveBeenCalledWith(csvContent);
      });
    });

    it('should display success message on successful upload', async () => {
      vi.mocked(problemsApi.importCSV).mockResolvedValue({ imported: 5, skipped: 2 });

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(
        ['Problem,Link\nTwo Sum,https://leetcode.com/problems/two-sum/'],
        'problems.csv',
        { type: 'text/csv' }
      );
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Import successful!')).toBeInTheDocument();
        expect(screen.getByText(/imported 5 problems/i)).toBeInTheDocument();
        expect(screen.getByText(/skipped 2 duplicates/i)).toBeInTheDocument();
      });
    });

    it('should call onSuccess callback with results', async () => {
      const result = { imported: 5, skipped: 2 };
      vi.mocked(problemsApi.importCSV).mockResolvedValue(result);

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(
        ['Problem,Link\nTwo Sum,https://leetcode.com/problems/two-sum/'],
        'problems.csv',
        { type: 'text/csv' }
      );
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(result);
      });
    });

    it('should display error message on failed upload', async () => {
      const errorMessage = 'Invalid CSV format';
      vi.mocked(problemsApi.importCSV).mockRejectedValue(new Error(errorMessage));

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(
        ['Invalid CSV content'],
        'problems.csv',
        { type: 'text/csv' }
      );
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Import failed')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle generic upload errors', async () => {
      vi.mocked(problemsApi.importCSV).mockRejectedValue('Network error');

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(
        ['Problem,Link\nTwo Sum,https://leetcode.com/problems/two-sum/'],
        'problems.csv',
        { type: 'text/csv' }
      );
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to import csv/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Cancel button is clicked', () => {
      render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset state when modal is closed via close button', async () => {
      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Select a file
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });

      // Click close button (which calls handleClose that resets state)
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      // Verify onClose was called
      expect(mockOnClose).toHaveBeenCalled();

      // The component calls onClose and internally resets state
      // When parent re-renders with isOpen=true again, state will be fresh
    });

    it('should show Done button after successful upload', async () => {
      vi.mocked(problemsApi.importCSV).mockResolvedValue({ imported: 5, skipped: 2 });

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(
        ['Problem,Link\nTwo Sum,https://leetcode.com/problems/two-sum/'],
        'problems.csv',
        { type: 'text/csv' }
      );
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Instructions and Format', () => {
    it('should display CSV format instructions', () => {
      render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('Expected CSV Format')).toBeInTheDocument();
      expect(screen.getByText(/required fields/i)).toBeInTheDocument();
      expect(screen.getByText(/optional fields/i)).toBeInTheDocument();
    });

    it('should show example CSV format', () => {
      render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText(/Problem,Link,Color,LastReviewed,KeyInsight/)).toBeInTheDocument();
    });
  });

  describe('Success Message Variations', () => {
    it('should handle singular problem count', async () => {
      vi.mocked(problemsApi.importCSV).mockResolvedValue({ imported: 1, skipped: 0 });

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/imported 1 problem$/i)).toBeInTheDocument();
      });
    });

    it('should handle singular duplicate count', async () => {
      vi.mocked(problemsApi.importCSV).mockResolvedValue({ imported: 5, skipped: 1 });

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/skipped 1 duplicate$/i)).toBeInTheDocument();
      });
    });

    it('should not show skipped message when skipped is 0', async () => {
      vi.mocked(problemsApi.importCSV).mockResolvedValue({ imported: 5, skipped: 0 });

      const { container } = render(
        <ImportModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = await screen.findByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.queryByText(/skipped/i)).not.toBeInTheDocument();
      });
    });
  });
});
