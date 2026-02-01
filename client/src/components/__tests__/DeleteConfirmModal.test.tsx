/**
 * Tests for DeleteConfirmModal component
 * Tests modal rendering, confirmation/cancel actions, loading state, error handling, and accessibility
 *
 * Following TDD principles - these tests define expected behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    problemName: 'Two Sum',
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Problem')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<DeleteConfirmModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display problem name in confirmation message', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByText(/"Two Sum"/)).toBeInTheDocument();
    });

    it('should display warning message about permanent deletion', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    it('should render Delete and Cancel buttons', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should display warning icon', () => {
      const { container } = render(<DeleteConfirmModal {...defaultProps} />);

      // Warning icon should be in the red circle
      const warningIcon = container.querySelector('.bg-red-100');
      expect(warningIcon).toBeInTheDocument();
    });
  });

  describe('Confirmation functionality', () => {
    it('should call onConfirm when Delete button is clicked', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockResolvedValue(undefined);

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalled();
      });
    });

    it('should not close modal immediately when Delete is clicked', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const handleClose = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} onClose={handleClose} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      // onClose should not be called during deletion
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should allow parent to close modal after successful deletion', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockResolvedValue(undefined);

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalled();
      });

      // Parent component is responsible for closing the modal after success
    });
  });

  describe('Cancel functionality', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onClose={handleClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(handleClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      const { container } = render(<DeleteConfirmModal {...defaultProps} onClose={handleClose} />);

      // Find the backdrop by class
      const backdrop = container.querySelector('.fixed.inset-0.bg-gray-500.bg-opacity-75') as HTMLElement;
      expect(backdrop).toBeInTheDocument();

      await user.click(backdrop);

      expect(handleClose).toHaveBeenCalled();
    });

    it('should not call onConfirm when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(handleConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should show loading state during deletion', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    it('should disable Delete button during deletion', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(deleteButton).toBeDisabled();
    });

    it('should disable Cancel button during deletion', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });

    it('should show loading spinner during deletion', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { container } = render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      // Check for spinner with animation class
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not close when Cancel is clicked during deletion', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const handleClose = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} onClose={handleClose} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should not close when backdrop is clicked during deletion', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const handleClose = vi.fn();

      const { container } = render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} onClose={handleClose} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      const backdrop = container.querySelector('.fixed.inset-0.bg-gray-500.bg-opacity-75') as HTMLElement;
      await user.click(backdrop);

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should display error message when deletion fails', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should show generic error message when error has no message', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockRejectedValue('string error');

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete problem/i)).toBeInTheDocument();
      });
    });

    it('should not close modal when deletion fails', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockRejectedValue(new Error('Error'));
      const handleClose = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} onClose={handleClose} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should re-enable buttons after deletion failure', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Buttons should be enabled again after error
      expect(deleteButton).not.toBeDisabled();
      expect(screen.getByText('Cancel')).not.toBeDisabled();
    });

    it('should allow retry after deletion failure', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Try again
      await user.click(deleteButton);

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear error on retry attempt', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Try again - error should clear
      await user.click(deleteButton);

      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });

    it('should display error with icon', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockRejectedValue(new Error('Network error'));

      const { container } = render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Error message should be in red box
      const errorBox = container.querySelector('.bg-red-50');
      expect(errorBox).toBeInTheDocument();
    });
  });

  describe('Problem name variations', () => {
    it('should handle problem names with special characters', () => {
      render(<DeleteConfirmModal {...defaultProps} problemName='Problem with "quotes"' />);

      expect(screen.getByText(/"Problem with "quotes""/)).toBeInTheDocument();
    });

    it('should handle very long problem names', () => {
      const longName = 'A'.repeat(100) + ' Very Long Problem Name';
      render(<DeleteConfirmModal {...defaultProps} problemName={longName} />);

      expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
    });

    it('should handle problem names with ampersands', () => {
      render(<DeleteConfirmModal {...defaultProps} problemName='Arrays & Strings' />);

      expect(screen.getByText(/"Arrays & Strings"/)).toBeInTheDocument();
    });

    it('should handle empty problem name', () => {
      render(<DeleteConfirmModal {...defaultProps} problemName='' />);

      // Should still render the modal, just with empty quotes
      expect(screen.getByText('Delete Problem')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have proper heading with id for aria-labelledby', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const heading = screen.getByText('Delete Problem');
      expect(heading).toHaveAttribute('id', 'modal-title');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmModal {...defaultProps} />);

      // Tab to first button (Delete in this case due to flex-row-reverse)
      await user.tab();

      // One of the buttons should have focus
      const deleteButton = screen.getByText('Delete');
      const cancelButton = screen.getByText('Cancel');
      const hasFocus = deleteButton === document.activeElement || cancelButton === document.activeElement;
      expect(hasFocus).toBe(true);
    });

    it('should have descriptive button text', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      // Buttons should have clear, action-oriented text
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should have proper color coding for danger action', () => {
      const { container } = render(<DeleteConfirmModal {...defaultProps} />);

      // Delete button should have red background (danger)
      const deleteButton = screen.getByText('Delete');
      expect(deleteButton).toHaveClass('bg-red-600');

      // Warning icon container should have red background
      const warningIconContainer = container.querySelector('.bg-red-100');
      expect(warningIconContainer).toBeInTheDocument();
    });
  });

  describe('Button interactions', () => {
    it('should have hover state on Delete button', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const deleteButton = screen.getByText('Delete');
      expect(deleteButton).toHaveClass('hover:bg-red-700');
    });

    it('should have hover state on Cancel button', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveClass('hover:bg-gray-50');
    });

    it('should have focus ring on Delete button', () => {
      render(<DeleteConfirmModal {...defaultProps} />);

      const deleteButton = screen.getByText('Delete');
      expect(deleteButton).toHaveClass('focus:ring-red-500');
    });

    it('should have disabled styling when deleting', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(deleteButton).toHaveClass('disabled:bg-gray-400');
      expect(deleteButton).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should have disabled styling on Cancel during deletion', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveClass('disabled:opacity-50');
      expect(cancelButton).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid clicks on Delete button', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');

      // Click multiple times rapidly
      await user.click(deleteButton);
      await user.click(deleteButton);
      await user.click(deleteButton);

      // onConfirm should only be called once (button is disabled after first click)
      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle rapid clicks on Cancel button', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onClose={handleClose} />);

      const cancelButton = screen.getByText('Cancel');

      // Click multiple times rapidly
      await user.click(cancelButton);
      await user.click(cancelButton);

      // onClose should be called multiple times (no protection needed)
      expect(handleClose).toHaveBeenCalled();
    });

    it('should handle simultaneous Delete and Cancel clicks', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const handleClose = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} onClose={handleClose} />);

      const deleteButton = screen.getByText('Delete');
      const cancelButton = screen.getByText('Cancel');

      // Click Delete first
      await user.click(deleteButton);
      // Try to click Cancel immediately (should not work)
      await user.click(cancelButton);

      expect(handleConfirm).toHaveBeenCalledTimes(1);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should handle onConfirm returning void instead of Promise', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn();

      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(handleConfirm).toHaveBeenCalled();
    });

    it('should clear error state when modal is closed and reopened', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockRejectedValue(new Error('Network error'));

      const { unmount } = render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Unmount component (simulates closing modal)
      unmount();

      // Remount component (simulates reopening modal)
      render(<DeleteConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

      // Error should not be visible (fresh component state)
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });

  describe('Visual styling', () => {
    it('should have proper modal positioning classes', () => {
      const { container } = render(<DeleteConfirmModal {...defaultProps} />);

      const modalWrapper = container.querySelector('.fixed.inset-0.z-50');
      expect(modalWrapper).toBeInTheDocument();
    });

    it('should have backdrop with opacity', () => {
      const { container } = render(<DeleteConfirmModal {...defaultProps} />);

      const backdrop = container.querySelector('.bg-opacity-75');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have rounded corners on modal', () => {
      const { container } = render(<DeleteConfirmModal {...defaultProps} />);

      const modal = container.querySelector('.rounded-lg');
      expect(modal).toBeInTheDocument();
    });

    it('should have shadow on modal', () => {
      const { container } = render(<DeleteConfirmModal {...defaultProps} />);

      const modal = container.querySelector('.shadow-xl');
      expect(modal).toBeInTheDocument();
    });
  });
});
