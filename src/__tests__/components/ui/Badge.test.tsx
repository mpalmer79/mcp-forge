import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge component', () => {
  test('renders children text', () => {
    render(<Badge>Official</Badge>);
    expect(screen.getByText('Official')).toBeInTheDocument();
  });

  test('applies default green color', () => {
    const { container } = render(<Badge>Test</Badge>);
    const span = container.querySelector('span');
    expect(span).toBeTruthy();
    // default color prop is #22c55e
    expect(span!.style.color).toBe('#22c55e');
  });

  test('applies custom color', () => {
    const { container } = render(<Badge color="#f59e0b">Warning</Badge>);
    const span = container.querySelector('span');
    expect(span!.style.color).toBe('#f59e0b');
  });

  test('merges custom style prop', () => {
    const { container } = render(<Badge style={{ marginTop: 10 }}>Styled</Badge>);
    const span = container.querySelector('span');
    expect(span!.style.marginTop).toBe('10px');
  });

  test('renders with inline-flex display', () => {
    const { container } = render(<Badge>Flex</Badge>);
    const span = container.querySelector('span');
    expect(span!.style.display).toBe('inline-flex');
  });
});
