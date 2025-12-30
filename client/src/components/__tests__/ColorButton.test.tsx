/**
 * Tests for ColorButton component
 * Tests rendering, click handling, disabled state, and accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorButton } from '../ColorButton';

describe('ColorButton', () => {
  describe('Rendering', () => {
    it('should render orange button with correct label', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Struggling');
    });

    it('should render yellow button with correct label', () => {
      render(<ColorButton color="yellow" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /okay/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Okay');
    });

    it('should render green button with correct label', () => {
      render(<ColorButton color="green" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /mastered/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Mastered');
    });
  });

  describe('Click handling', () => {
    it('should call onClick when orange button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ColorButton color="orange" onClick={handleClick} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when yellow button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ColorButton color="yellow" onClick={handleClick} />);

      const button = screen.getByRole('button', { name: /okay/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when green button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ColorButton color="green" onClick={handleClick} />);

      const button = screen.getByRole('button', { name: /mastered/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick multiple times when clicked multiple times', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ColorButton color="green" onClick={handleClick} />);

      const button = screen.getByRole('button', { name: /mastered/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Disabled state', () => {
    it('should be enabled by default', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} disabled={true} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).toBeDisabled();
    });

    it('should be enabled when disabled prop is false', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} disabled={false} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).not.toBeDisabled();
    });

    it('should not call onClick when disabled and clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ColorButton color="green" onClick={handleClick} disabled={true} />);

      const button = screen.getByRole('button', { name: /mastered/i });
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have opacity-50 class when disabled', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} disabled={true} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should have cursor-not-allowed class when disabled', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} disabled={true} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Styling', () => {
    it('should have orange background styles for orange button', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).toHaveClass('bg-problem-orange');
    });

    it('should have yellow background styles for yellow button', () => {
      render(<ColorButton color="yellow" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /okay/i });
      expect(button).toHaveClass('bg-problem-yellow');
    });

    it('should have green background styles for green button', () => {
      render(<ColorButton color="green" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /mastered/i });
      expect(button).toHaveClass('bg-problem-green');
    });

    it('should have white text color', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).toHaveClass('text-white');
    });

    it('should have rounded-lg class', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).toHaveClass('rounded-lg');
    });

    it('should have font-medium class', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).toHaveClass('font-medium');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for orange button', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: 'Mark as Struggling' });
      expect(button).toBeInTheDocument();
    });

    it('should have proper aria-label for yellow button', () => {
      render(<ColorButton color="yellow" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: 'Mark as Okay' });
      expect(button).toBeInTheDocument();
    });

    it('should have proper aria-label for green button', () => {
      render(<ColorButton color="green" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: 'Mark as Mastered' });
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ColorButton color="green" onClick={handleClick} />);

      const button = screen.getByRole('button', { name: /mastered/i });

      // Tab to button and press Enter
      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be activatable with Space key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ColorButton color="green" onClick={handleClick} />);

      const button = screen.getByRole('button', { name: /mastered/i });

      // Tab to button and press Space
      await user.tab();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not be keyboard activatable when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ColorButton color="green" onClick={handleClick} disabled={true} />);

      const button = screen.getByRole('button', { name: /mastered/i });

      // Tab to button (it should still be focusable but not activatable)
      await user.tab();
      await user.keyboard('{Enter}');

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<ColorButton color="orange" onClick={handleClick} />);

      const button = screen.getByRole('button', { name: /struggling/i });

      // Simulate rapid clicks
      await user.tripleClick(button);

      expect(handleClick).toHaveBeenCalled();
      expect(handleClick.mock.calls.length).toBeGreaterThan(0);
    });

    it('should maintain button type as button', () => {
      render(<ColorButton color="orange" onClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /struggling/i });
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
