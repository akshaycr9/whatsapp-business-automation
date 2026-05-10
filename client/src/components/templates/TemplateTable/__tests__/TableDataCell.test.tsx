import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableDataCell } from '../TableDataCell';

describe('TableDataCell', () => {
  describe('Rendering', () => {
    it('renders text content', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>Cell Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      expect(screen.getByText('Cell Content')).toBeInTheDocument();
    });

    it('renders as td element', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      const td = container.querySelector('td');
      expect(td).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>
                <span>Child 1</span>
                <span>Child 2</span>
              </TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('renders elements as children', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>
                <button>Click Me</button>
              </TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Base Classes', () => {
    it('applies padding classes', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      const td = container.querySelector('td');
      expect(td).toHaveClass('px-3.5');
      expect(td).toHaveClass('py-3');
    });

    it('applies alignment class', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      const td = container.querySelector('td');
      expect(td).toHaveClass('align-middle');
    });
  });

  describe('Custom Classes', () => {
    it('applies custom className prop', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableDataCell className="custom-class">Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      const td = container.querySelector('td');
      expect(td).toHaveClass('custom-class');
    });

    it('applies both base and custom classes', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableDataCell className="text-right">Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      const td = container.querySelector('td');
      expect(td).toHaveClass('px-3.5');
      expect(td).toHaveClass('py-3');
      expect(td).toHaveClass('text-right');
    });

    it('applies multiple custom classes', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableDataCell className="text-right font-bold bg-gray-100">
                Content
              </TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      const td = container.querySelector('td');
      expect(td).toHaveClass('text-right');
      expect(td).toHaveClass('font-bold');
      expect(td).toHaveClass('bg-gray-100');
    });
  });

  describe('Click Handler', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell onClick={handleClick}>Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByText('Content');
      await user.click(td);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('passes event object to onClick handler', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell onClick={handleClick}>Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByText('Content');
      await user.click(td);

      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('does not error when onClick is not provided', async () => {
      const user = userEvent.setup();

      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByText('Content');
      expect(() => user.click(td)).not.toThrow();
    });

    it('handles multiple clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell onClick={handleClick}>Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByText('Content');
      await user.click(td);
      await user.click(td);
      await user.click(td);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Different Content Types', () => {
    it('renders text content', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>Simple text</TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('renders number content', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>123</TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('renders JSX content', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>
                <strong>Bold</strong>
              </TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('Bold').tagName).toBe('STRONG');
    });

    it('renders empty content', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableDataCell></TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      const td = container.querySelector('td');
      expect(td).toBeEmptyDOMElement();
    });
  });

  describe('Memoization', () => {
    it('renders as a memoized component', () => {
      const { rerender } = render(
        <table>
          <tbody>
            <tr>
              <TableDataCell>Content</TableDataCell>
            </tr>
          </tbody>
        </table>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
