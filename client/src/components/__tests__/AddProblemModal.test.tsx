/**
 * Tests for AddProblemModal component
 * Tests modal rendering, form validation, save/cancel actions, and accessibility
 *
 * Following TDD principles - these tests define expected behavior before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProblemModal } from '../AddProblemModal';

describe('AddProblemModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<AddProblemModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add Problem')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<AddProblemModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<AddProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/problem name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/leetcode link/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/key insight/i)).toBeInTheDocument();
    });

    it('should have empty form fields by default', () => {
      render(<AddProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/problem name/i)).toHaveValue('');
      expect(screen.getByLabelText(/leetcode link/i)).toHaveValue('');
      expect(screen.getByLabelText(/key insight/i)).toHaveValue('');
    });

    it('should render Add Problem and Cancel buttons', () => {
      render(<AddProblemModal {...defaultProps} />);

      expect(screen.getByText('Add Problem')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<AddProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/close modal/i)).toBeInTheDocument();
    });
  });

  describe('Form interactions', () => {
    it('should update name field when typing', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.type(nameInput, 'Two Sum');

      expect(nameInput).toHaveValue('Two Sum');
    });

    it('should update link field when typing', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const linkInput = screen.getByLabelText(/leetcode link/i);
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      expect(linkInput).toHaveValue('https://leetcode.com/problems/two-sum/');
    });

    it('should update key insight when typing', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const insightInput = screen.getByLabelText(/key insight/i);
      await user.type(insightInput, 'Use hash map for O(n)');

      expect(insightInput).toHaveValue('Use hash map for O(n)');
    });

    it('should clear form after successful save', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalled();
      });

      // Modal should close, but if reopened, form should be empty
      const { rerender } = render(<AddProblemModal {...defaultProps} isOpen={false} onSave={handleSave} />);
      rerender(<AddProblemModal {...defaultProps} isOpen={true} onSave={handleSave} />);

      expect(screen.getByLabelText(/problem name/i)).toHaveValue('');
      expect(screen.getByLabelText(/leetcode link/i)).toHaveValue('');
    });
  });

  describe('Form validation - Required fields', () => {
    it('should have required attribute on name field', () => {
      render(<AddProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i) as HTMLInputElement;
      expect(nameInput).toBeRequired();
    });

    it('should have required attribute on link field', () => {
      render(<AddProblemModal {...defaultProps} />);

      const linkInput = screen.getByLabelText(/leetcode link/i) as HTMLInputElement;
      expect(linkInput).toBeRequired();
    });

    it('should not have required attribute on key insight field', () => {
      render(<AddProblemModal {...defaultProps} />);

      const insightInput = screen.getByLabelText(/key insight/i) as HTMLInputElement;
      expect(insightInput).not.toBeRequired();
    });

    it('should show error when name is empty', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const linkInput = screen.getByLabelText(/leetcode link/i);
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/problem name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when link is empty', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.type(nameInput, 'Two Sum');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/link is required/i)).toBeInTheDocument();
      });
    });

    it('should trim whitespace from name', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, '  Two Sum  ');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Two Sum',
        }));
      });
    });

    it('should trim whitespace from link', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, '  https://leetcode.com/problems/two-sum/  ');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
          link: 'https://leetcode.com/problems/two-sum/',
        }));
      });
    });

    it('should show error when name is only whitespace', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, '   ');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/problem name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when link is only whitespace', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, '   ');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/link is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form validation - URL format', () => {
    it('should have URL type on link field', () => {
      render(<AddProblemModal {...defaultProps} />);

      const linkInput = screen.getByLabelText(/leetcode link/i) as HTMLInputElement;
      expect(linkInput.type).toBe('url');
    });

    it('should show error for invalid URL format', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'not-a-valid-url');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/valid url/i)).toBeInTheDocument();
      });
    });

    it('should accept valid HTTP URL', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'http://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalled();
      });
    });

    it('should accept valid HTTPS URL', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalled();
      });
    });
  });

  describe('Form validation - Max lengths', () => {
    it('should show error when name exceeds 500 characters', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      const longName = 'a'.repeat(501);
      await user.type(nameInput, longName);
      await user.type(linkInput, 'https://leetcode.com/problems/test/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/500 characters or less/i)).toBeInTheDocument();
      });
    });

    it('should accept name with exactly 500 characters', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      const maxName = 'a'.repeat(500);
      await user.type(nameInput, maxName);
      await user.type(linkInput, 'https://leetcode.com/problems/test/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalled();
      });
    });

    it('should show error when URL exceeds 2048 characters', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      const longUrl = 'https://leetcode.com/' + 'a'.repeat(2030); // Total > 2048
      await user.type(linkInput, longUrl);

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/2048 characters or less/i)).toBeInTheDocument();
      });
    });

    it('should accept URL with exactly 2048 characters', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      // Create exactly 2048 char URL
      const maxUrl = 'https://leetcode.com/' + 'a'.repeat(2048 - 'https://leetcode.com/'.length);
      await user.type(linkInput, maxUrl);

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalled();
      });
    });

    it('should show error when key insight exceeds 5000 characters', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);
      const insightInput = screen.getByLabelText(/key insight/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');
      const longInsight = 'a'.repeat(5001);
      await user.type(insightInput, longInsight);

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/5000 characters or less/i)).toBeInTheDocument();
      });
    });

    it('should accept key insight with exactly 5000 characters', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);
      const insightInput = screen.getByLabelText(/key insight/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');
      const maxInsight = 'a'.repeat(5000);
      await user.type(insightInput, maxInsight);

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalled();
      });
    });
  });

  describe('Save functionality', () => {
    it('should call onSave with form data when all fields provided', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);
      const insightInput = screen.getByLabelText(/key insight/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');
      await user.type(insightInput, 'Use hash map for O(n)');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith({
          name: 'Two Sum',
          link: 'https://leetcode.com/problems/two-sum/',
          keyInsight: 'Use hash map for O(n)',
        });
      });
    });

    it('should call onSave without keyInsight when not provided', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith({
          name: 'Two Sum',
          link: 'https://leetcode.com/problems/two-sum/',
        });
      });
    });

    it('should call onSave without keyInsight when only whitespace', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);
      const insightInput = screen.getByLabelText(/key insight/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');
      await user.type(insightInput, '   ');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith({
          name: 'Two Sum',
          link: 'https://leetcode.com/problems/two-sum/',
        });
      });
    });

    it('should call onClose after successful save', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(<AddProblemModal {...defaultProps} onSave={handleSave} onClose={handleClose} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('should show loading state while saving', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      expect(screen.getByText(/adding/i)).toBeInTheDocument();
      expect(addButton).toBeDisabled();
    });

    it('should disable all inputs while saving', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      expect(nameInput).toBeDisabled();
      expect(linkInput).toBeDisabled();
      expect(screen.getByLabelText(/key insight/i)).toBeDisabled();
    });
  });

  describe('Error handling', () => {
    it('should show error message on save failure', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should not close modal on save failure', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockRejectedValue(new Error('Error'));
      const handleClose = vi.fn();

      render(<AddProblemModal {...defaultProps} onSave={handleSave} onClose={handleClose} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should show generic error message when error has no message', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockRejectedValue('string error');

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to add problem/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing after error', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Start typing again
      await user.type(nameInput, ' Updated');

      // Error should be cleared
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });

  describe('Cancel functionality', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<AddProblemModal {...defaultProps} onClose={handleClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(handleClose).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<AddProblemModal {...defaultProps} onClose={handleClose} />);

      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      const { container } = render(<AddProblemModal {...defaultProps} onClose={handleClose} />);

      // Find the backdrop by class
      const backdrop = container.querySelector('.fixed.inset-0.bg-gray-500.bg-opacity-75') as HTMLElement;
      expect(backdrop).toBeInTheDocument();

      await user.click(backdrop);

      expect(handleClose).toHaveBeenCalled();
    });

    it('should not close when saving', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const handleClose = vi.fn();

      render(<AddProblemModal {...defaultProps} onSave={handleSave} onClose={handleClose} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Should still be disabled
      expect(cancelButton).toBeDisabled();
    });

    it('should clear form when reopening modal after cancel', async () => {
      const user = userEvent.setup();

      const { rerender } = render(<AddProblemModal {...defaultProps} isOpen={true} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Close modal
      rerender(<AddProblemModal {...defaultProps} isOpen={false} />);

      // Reopen modal
      rerender(<AddProblemModal {...defaultProps} isOpen={true} />);

      expect(screen.getByLabelText(/problem name/i)).toHaveValue('');
      expect(screen.getByLabelText(/leetcode link/i)).toHaveValue('');
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should close modal on Escape key', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<AddProblemModal {...defaultProps} onClose={handleClose} />);

      await user.keyboard('{Escape}');

      expect(handleClose).toHaveBeenCalled();
    });

    it('should not close on Escape when saving', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const handleClose = vi.fn();

      render(<AddProblemModal {...defaultProps} onSave={handleSave} onClose={handleClose} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await user.keyboard('{Escape}');

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<AddProblemModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper labels for all form fields', () => {
      render(<AddProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/problem name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/leetcode link/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/key insight/i)).toBeInTheDocument();
    });

    it('should have required attribute on required fields', () => {
      render(<AddProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/problem name/i)).toBeRequired();
      expect(screen.getByLabelText(/leetcode link/i)).toBeRequired();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<AddProblemModal {...defaultProps} />);

      // Tab through form elements
      await user.tab(); // Close button
      await user.tab(); // Name input
      expect(screen.getByLabelText(/problem name/i)).toHaveFocus();
    });

    it('should have proper heading hierarchy', () => {
      render(<AddProblemModal {...defaultProps} />);

      const heading = screen.getByText('Add Problem');
      expect(heading.tagName).toBe('H3');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty key insight correctly', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith({
          name: 'Two Sum',
          link: 'https://leetcode.com/problems/two-sum/',
        });
      });
    });

    it('should handle special characters in name', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Problem with "quotes" & special <chars>');
      await user.type(linkInput, 'https://leetcode.com/problems/test/');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Problem with "quotes" & special <chars>',
        }));
      });
    });

    it('should handle URLs with query parameters', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/?tab=description&source=test');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
          link: 'https://leetcode.com/problems/two-sum/?tab=description&source=test',
        }));
      });
    });

    it('should handle multiline key insight', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<AddProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      const linkInput = screen.getByLabelText(/leetcode link/i);
      const insightInput = screen.getByLabelText(/key insight/i);

      await user.type(nameInput, 'Two Sum');
      await user.type(linkInput, 'https://leetcode.com/problems/two-sum/');
      await user.type(insightInput, 'Line 1{Enter}Line 2{Enter}Line 3');

      const addButton = screen.getByText('Add Problem');
      await user.click(addButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
          keyInsight: expect.stringContaining('Line 1'),
        }));
      });
    });
  });
});
