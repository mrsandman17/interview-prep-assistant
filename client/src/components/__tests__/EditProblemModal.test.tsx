/**
 * Tests for EditProblemModal component
 * Tests modal rendering, form validation, save/cancel actions, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditProblemModal } from '../EditProblemModal';
import type { Problem } from '../../api/types';

const mockProblem: Problem = {
  id: 1,
  name: 'Two Sum',
  link: 'https://leetcode.com/problems/two-sum/',
  color: 'gray',
  keyInsight: 'Use hash map for O(n)',
  lastReviewed: '2024-01-15',
  createdAt: '2024-01-10T00:00:00Z',
  attemptCount: 3,
};

describe('EditProblemModal', () => {
  const defaultProps = {
    problem: mockProblem,
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<EditProblemModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Problem')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<EditProblemModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should not render modal when problem is null', () => {
      render(<EditProblemModal {...defaultProps} problem={null} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<EditProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/problem name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/leetcode link/i)).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument(); // Status is a label for buttons, not a form control
      expect(screen.getByLabelText(/key insight/i)).toBeInTheDocument();
    });

    it('should populate form with problem data', () => {
      render(<EditProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/problem name/i)).toHaveValue('Two Sum');
      expect(screen.getByLabelText(/leetcode link/i)).toHaveValue('https://leetcode.com/problems/two-sum/');
      expect(screen.getByLabelText(/key insight/i)).toHaveValue('Use hash map for O(n)');
    });

    it('should render Save and Cancel buttons', () => {
      render(<EditProblemModal {...defaultProps} />);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<EditProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/close modal/i)).toBeInTheDocument();
    });

    it('should render all color option buttons', () => {
      render(<EditProblemModal {...defaultProps} />);

      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Struggling')).toBeInTheDocument();
      expect(screen.getByText('Okay')).toBeInTheDocument();
      expect(screen.getByText('Mastered')).toBeInTheDocument();
    });
  });

  describe('Form initialization', () => {
    it('should select current color by default', () => {
      render(<EditProblemModal {...defaultProps} />);

      const grayButton = screen.getByText('New');
      expect(grayButton).toHaveClass('ring-2');
    });

    it('should handle problem with null keyInsight', () => {
      const problemWithoutInsight = { ...mockProblem, keyInsight: null };
      render(<EditProblemModal {...defaultProps} problem={problemWithoutInsight} />);

      expect(screen.getByLabelText(/key insight/i)).toHaveValue('');
    });

    it('should update form when problem changes', () => {
      const { rerender } = render(<EditProblemModal {...defaultProps} />);

      const newProblem: Problem = {
        ...mockProblem,
        id: 2,
        name: 'Add Two Numbers',
        link: 'https://leetcode.com/problems/add-two-numbers/',
      };

      rerender(<EditProblemModal {...defaultProps} problem={newProblem} />);

      expect(screen.getByLabelText(/problem name/i)).toHaveValue('Add Two Numbers');
      expect(screen.getByLabelText(/leetcode link/i)).toHaveValue('https://leetcode.com/problems/add-two-numbers/');
    });
  });

  describe('Form interactions', () => {
    it('should update name field when typing', async () => {
      const user = userEvent.setup();
      render(<EditProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Three Sum');

      expect(nameInput).toHaveValue('Three Sum');
    });

    it('should update link field when typing', async () => {
      const user = userEvent.setup();
      render(<EditProblemModal {...defaultProps} />);

      const linkInput = screen.getByLabelText(/leetcode link/i);
      await user.clear(linkInput);
      await user.type(linkInput, 'https://leetcode.com/problems/three-sum/');

      expect(linkInput).toHaveValue('https://leetcode.com/problems/three-sum/');
    });

    it('should update key insight when typing', async () => {
      const user = userEvent.setup();
      render(<EditProblemModal {...defaultProps} />);

      const insightInput = screen.getByLabelText(/key insight/i);
      await user.clear(insightInput);
      await user.type(insightInput, 'Two pointers approach');

      expect(insightInput).toHaveValue('Two pointers approach');
    });

    it('should change color when clicking color button', async () => {
      const user = userEvent.setup();
      render(<EditProblemModal {...defaultProps} />);

      const greenButton = screen.getByText('Mastered');
      await user.click(greenButton);

      expect(greenButton).toHaveClass('ring-2');
    });
  });

  describe('Form validation', () => {
    it('should have required validation on name field', async () => {
      render(<EditProblemModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/problem name/i) as HTMLInputElement;
      expect(nameInput).toBeRequired();
      expect(nameInput.validationMessage).toBe(''); // Empty when valid
    });

    it('should have required validation on link field', async () => {
      render(<EditProblemModal {...defaultProps} />);

      const linkInput = screen.getByLabelText(/leetcode link/i) as HTMLInputElement;
      expect(linkInput).toBeRequired();
      expect(linkInput.type).toBe('url'); // URL type provides built-in validation
    });

    it('should validate URL format with type=url', async () => {
      render(<EditProblemModal {...defaultProps} />);

      const linkInput = screen.getByLabelText(/leetcode link/i) as HTMLInputElement;
      expect(linkInput.type).toBe('url');
      // HTML5 will handle URL validation automatically
    });

    it('should trim whitespace from name', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<EditProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, '  Trimmed Name  ');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(1, expect.objectContaining({
          name: 'Trimmed Name',
        }));
      });
    });

    it('should trim whitespace from link', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<EditProblemModal {...defaultProps} onSave={handleSave} />);

      const linkInput = screen.getByLabelText(/leetcode link/i);
      await user.clear(linkInput);
      await user.type(linkInput, '  https://leetcode.com/test/  ');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(1, expect.objectContaining({
          link: 'https://leetcode.com/test/',
        }));
      });
    });
  });

  describe('Save functionality', () => {
    it('should call onSave with updated fields', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<EditProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(1, { name: 'Updated Name' });
      });
    });

    it('should call onSave with only changed fields', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<EditProblemModal {...defaultProps} onSave={handleSave} />);

      const greenButton = screen.getByText('Mastered');
      await user.click(greenButton);

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(1, { color: 'green' });
      });
    });

    it('should call onClose after successful save', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(<EditProblemModal {...defaultProps} onSave={handleSave} onClose={handleClose} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('should not call onSave when no changes are made', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn();
      const handleClose = vi.fn();

      render(<EditProblemModal {...defaultProps} onSave={handleSave} onClose={handleClose} />);

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(handleSave).not.toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('should show loading state while saving', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<EditProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('should show error message on save failure', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<EditProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should not close modal on save failure', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockRejectedValue(new Error('Error'));
      const handleClose = vi.fn();

      render(<EditProblemModal {...defaultProps} onSave={handleSave} onClose={handleClose} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Cancel functionality', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<EditProblemModal {...defaultProps} onClose={handleClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(handleClose).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<EditProblemModal {...defaultProps} onClose={handleClose} />);

      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      const { container } = render(<EditProblemModal {...defaultProps} onClose={handleClose} />);

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

      render(<EditProblemModal {...defaultProps} onSave={handleSave} onClose={handleClose} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Should still be disabled
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should close modal on Escape key', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<EditProblemModal {...defaultProps} onClose={handleClose} />);

      await user.keyboard('{Escape}');

      expect(handleClose).toHaveBeenCalled();
    });

    it('should have Escape key listener', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<EditProblemModal {...defaultProps} onClose={handleClose} />);

      // Escape key should work
      await user.keyboard('{Escape}');

      // onClose should be called
      await waitFor(() => {
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<EditProblemModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper labels for all form fields', () => {
      render(<EditProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/problem name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/leetcode link/i)).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument(); // Status is a label for button group
      expect(screen.getByLabelText(/key insight/i)).toBeInTheDocument();
    });

    it('should have required attribute on required fields', () => {
      render(<EditProblemModal {...defaultProps} />);

      expect(screen.getByLabelText(/problem name/i)).toBeRequired();
      expect(screen.getByLabelText(/leetcode link/i)).toBeRequired();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<EditProblemModal {...defaultProps} />);

      // Tab through form elements
      await user.tab(); // Close button
      await user.tab(); // Name input
      expect(screen.getByLabelText(/problem name/i)).toHaveFocus();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty key insight', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<EditProblemModal {...defaultProps} onSave={handleSave} />);

      const insightInput = screen.getByLabelText(/key insight/i);
      await user.clear(insightInput);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(1, expect.objectContaining({
          keyInsight: undefined,
        }));
      });
    });

    it('should handle very long inputs', async () => {
      const user = userEvent.setup();
      render(<EditProblemModal {...defaultProps} />);

      const longText = 'a'.repeat(1000);
      const insightInput = screen.getByLabelText(/key insight/i);
      await user.clear(insightInput);
      await user.type(insightInput, longText);

      expect(insightInput).toHaveValue(longText);
    });

    it('should handle form submission with valid data', async () => {
      const user = userEvent.setup();
      const handleSave = vi.fn().mockResolvedValue(undefined);

      render(<EditProblemModal {...defaultProps} onSave={handleSave} />);

      const nameInput = screen.getByLabelText(/problem name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(1, { name: 'Updated Name' });
      });
    });
  });
});
