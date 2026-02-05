import React from 'react';
import { render, screen } from '@testing-library/react';
import CTA from '@/components/landing/CTA';

jest.mock('next/link', () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
});

describe('CTA component', () => {
  test('renders the heading', () => {
    render(<CTA />);
    expect(screen.getByText('Ready to build?')).toBeInTheDocument();
  });

  test('renders the description', () => {
    render(<CTA />);
    expect(screen.getByText(/Open the builder and create your first MCP server/)).toBeInTheDocument();
  });

  test('renders launch button linking to /builder', () => {
    render(<CTA />);
    const link = screen.getByText(/Launch MCP Forge/);
    expect(link.closest('a')).toHaveAttribute('href', '/builder');
  });
});
