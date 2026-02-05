import React from 'react';
import { render, screen } from '@testing-library/react';
import Features from '@/components/landing/Features';

describe('Features component', () => {
  test('renders the section heading', () => {
    render(<Features />);
    expect(screen.getByText('Everything you need to ship MCP servers')).toBeInTheDocument();
  });

  test('renders all four feature cards', () => {
    render(<Features />);
    expect(screen.getByText('Visual Builder')).toBeInTheDocument();
    expect(screen.getByText('Server Registry')).toBeInTheDocument();
    expect(screen.getByText('Live Playground')).toBeInTheDocument();
    expect(screen.getByText('Config Generator')).toBeInTheDocument();
  });

  test('renders feature descriptions', () => {
    render(<Features />);
    expect(screen.getByText(/Design MCP servers by clicking/)).toBeInTheDocument();
    expect(screen.getByText(/Browse 1,000\+ MCP servers/)).toBeInTheDocument();
    expect(screen.getByText(/Simulate JSON-RPC calls/)).toBeInTheDocument();
    expect(screen.getByText(/Auto-generates claude_desktop_config/)).toBeInTheDocument();
  });

  test('renders background images for each feature', () => {
    const { container } = render(<Features />);
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(4);
  });

  test('subtitle mentions the MCP server lifecycle', () => {
    render(<Features />);
    expect(screen.getByText(/entire MCP server lifecycle/)).toBeInTheDocument();
  });
});
