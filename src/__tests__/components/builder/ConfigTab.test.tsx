import React from 'react';
import { render, screen } from '@testing-library/react';
import ConfigTab from '@/components/builder/ConfigTab';
import type { MCPServer } from '@/types';

function makeServer(overrides: Partial<MCPServer> = {}): MCPServer {
  return {
    name: 'test-server',
    description: 'A test server',
    transport: 'stdio',
    primitives: [],
    ...overrides,
  };
}

describe('ConfigTab component', () => {
  test('renders claude_desktop_config.json section', () => {
    render(<ConfigTab server={makeServer()} />);
    expect(screen.getByText('claude_desktop_config.json')).toBeInTheDocument();
  });

  test('renders package.json section', () => {
    render(<ConfigTab server={makeServer()} />);
    expect(screen.getByText('package.json')).toBeInTheDocument();
  });

  test('renders server stats section', () => {
    render(<ConfigTab server={makeServer()} />);
    expect(screen.getByText('Server Stats')).toBeInTheDocument();
  });

  test('displays zero counts when no primitives', () => {
    render(<ConfigTab server={makeServer()} />);
    // should see "0" for each primitive type count
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });

  test('displays correct count for tools', () => {
    const server = makeServer({
      primitives: [
        { id: 't1', type: 'tool', name: 'a', description: '', parameters: [] },
        { id: 't2', type: 'tool', name: 'b', description: '', parameters: [] },
      ],
    });
    render(<ConfigTab server={server} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('displays server name in config JSON', () => {
    const { container } = render(<ConfigTab server={makeServer({ name: 'quirk-mcp' })} />);
    const preElements = container.querySelectorAll('pre');
    // first pre is the config json
    expect(preElements[0].textContent).toContain('quirk-mcp');
  });

  test('displays package name in package.json', () => {
    const { container } = render(<ConfigTab server={makeServer({ name: 'quirk-mcp' })} />);
    const preElements = container.querySelectorAll('pre');
    // second pre is the package json
    expect(preElements[1].textContent).toContain('@mcpforge/quirk-mcp');
  });
});
