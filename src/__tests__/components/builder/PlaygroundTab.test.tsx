import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PlaygroundTab from '@/components/builder/PlaygroundTab';
import type { MCPServer } from '@/types';

function makeServer(overrides: Partial<MCPServer> = {}): MCPServer {
  return {
    name: 'test-server',
    description: 'Test',
    transport: 'stdio',
    primitives: [],
    ...overrides,
  };
}

describe('PlaygroundTab component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows empty state when no tools defined', () => {
    render(<PlaygroundTab server={makeServer()} />);
    expect(screen.getByText(/No tools defined yet/)).toBeInTheDocument();
  });

  test('shows placeholder message in log area', () => {
    render(<PlaygroundTab server={makeServer()} />);
    expect(screen.getByText(/Click a tool to simulate a call/)).toBeInTheDocument();
  });

  test('displays available tools count', () => {
    render(<PlaygroundTab server={makeServer()} />);
    expect(screen.getByText(/Available Tools \(0\)/)).toBeInTheDocument();
  });

  test('renders tool buttons when tools exist', () => {
    const server = makeServer({
      primitives: [
        { id: 't1', type: 'tool', name: 'get_weather', description: 'Gets weather', parameters: [] },
      ],
    });
    render(<PlaygroundTab server={server} />);
    expect(screen.getByText(/get_weather/)).toBeInTheDocument();
    expect(screen.getByText('Available Tools (1)')).toBeInTheDocument();
  });

  test('renders List All Tools button', () => {
    render(<PlaygroundTab server={makeServer()} />);
    expect(screen.getByText(/List All Tools/)).toBeInTheDocument();
  });

  test('simulates a tool call and shows request log', () => {
    const server = makeServer({
      primitives: [
        {
          id: 't1',
          type: 'tool',
          name: 'search',
          description: 'Search',
          parameters: [{ name: 'query', type: 'string', description: 'Query', required: true }],
        },
      ],
    });
    render(<PlaygroundTab server={server} />);

    // click the tool button
    const toolBtn = screen.getByText(/search/).closest('button');
    fireEvent.click(toolBtn!);

    // request log should appear immediately
    expect(screen.getByText(/→ REQ/)).toBeInTheDocument();
    expect(screen.getByText(/tools\/call/)).toBeInTheDocument();
  });

  test('simulates tool call and shows response after delay', () => {
    const server = makeServer({
      primitives: [
        { id: 't1', type: 'tool', name: 'ping', description: 'Ping', parameters: [] },
      ],
    });
    render(<PlaygroundTab server={server} />);

    const toolBtn = screen.getByText(/ping/).closest('button');
    fireEvent.click(toolBtn!);

    // advance past the simulated response delay (800 + 400 max)
    act(() => {
      jest.advanceTimersByTime(1300);
    });

    // response should now appear
    expect(screen.getByText(/← RES/)).toBeInTheDocument();
  });

  test('simulates list tools call', () => {
    const server = makeServer({
      primitives: [
        { id: 't1', type: 'tool', name: 'get_data', description: 'Gets data', parameters: [] },
      ],
    });
    render(<PlaygroundTab server={server} />);

    const listBtn = screen.getByText(/List All Tools/);
    fireEvent.click(listBtn);

    expect(screen.getByText(/tools\/list/)).toBeInTheDocument();

    // advance past the list response delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText(/← RES/)).toBeInTheDocument();
  });

  test('shows param count on tool buttons', () => {
    const server = makeServer({
      primitives: [
        {
          id: 't1',
          type: 'tool',
          name: 'multi_param',
          description: 'Test',
          parameters: [
            { name: 'a', type: 'string', description: '', required: true },
            { name: 'b', type: 'number', description: '', required: false },
          ],
        },
      ],
    });
    render(<PlaygroundTab server={server} />);
    expect(screen.getByText('2 params')).toBeInTheDocument();
  });

  test('only shows tool-type primitives, not resources or prompts', () => {
    const server = makeServer({
      primitives: [
        { id: 't1', type: 'tool', name: 'my_tool', description: '', parameters: [] },
        { id: 'r1', type: 'resource', name: 'my_resource', description: '', uri: '', mimeType: 'text/plain' },
        { id: 'p1', type: 'prompt', name: 'my_prompt', description: '', template: '' },
      ],
    });
    render(<PlaygroundTab server={server} />);

    expect(screen.getByText('Available Tools (1)')).toBeInTheDocument();
    expect(screen.getByText(/my_tool/)).toBeInTheDocument();
  });

  test('renders JSON-RPC Log header', () => {
    render(<PlaygroundTab server={makeServer()} />);
    expect(screen.getByText('JSON-RPC Log')).toBeInTheDocument();
  });
});
