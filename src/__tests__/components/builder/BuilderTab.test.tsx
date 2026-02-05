import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BuilderTab from '@/components/builder/BuilderTab';
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

describe('BuilderTab component', () => {
  test('renders Server Info section', () => {
    const server = makeServer();
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText('Server Info')).toBeInTheDocument();
  });

  test('renders transport selector', () => {
    const server = makeServer();
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  test('shows Primitives count of zero initially', () => {
    const server = makeServer();
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText('Primitives (0)')).toBeInTheDocument();
  });

  test('renders add buttons for tool, resource, and prompt', () => {
    const server = makeServer();
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText(/Tool/)).toBeInTheDocument();
    expect(screen.getByText(/Resource/)).toBeInTheDocument();
    expect(screen.getByText(/Prompt/)).toBeInTheDocument();
  });

  test('shows empty state message when no primitives', () => {
    const server = makeServer();
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText(/Add tools, resources, or prompts/)).toBeInTheDocument();
  });

  test('shows placeholder when no primitive is selected', () => {
    const server = makeServer();
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText('Select a primitive to edit')).toBeInTheDocument();
  });

  test('renders Generated Code section header', () => {
    const server = makeServer();
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText('Generated Code (TypeScript)')).toBeInTheDocument();
  });

  test('displays server name in the input', () => {
    const server = makeServer({ name: 'quirk-mcp' });
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    // first input is server name
    const nameInput = inputs.find(
      (input) => (input as HTMLInputElement).value === 'quirk-mcp'
    );
    expect(nameInput).toBeTruthy();
  });

  test('renders existing primitives in the list', () => {
    const server = makeServer({
      primitives: [
        { id: 't1', type: 'tool', name: 'search_cars', description: 'Search', parameters: [] },
        { id: 'r1', type: 'resource', name: 'config', description: 'Config', uri: '', mimeType: 'text/plain' },
      ],
    });
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText('search_cars')).toBeInTheDocument();
    expect(screen.getByText('config')).toBeInTheDocument();
    expect(screen.getByText('Primitives (2)')).toBeInTheDocument();
  });

  test('shows untitled label for primitives with empty name', () => {
    const server = makeServer({
      primitives: [
        { id: 't1', type: 'tool', name: '', description: '', parameters: [] },
      ],
    });
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText('untitled_tool')).toBeInTheDocument();
  });

  test('shows param count in primitive list for tools', () => {
    const server = makeServer({
      primitives: [
        {
          id: 't1',
          type: 'tool',
          name: 'search',
          description: '',
          parameters: [
            { name: 'q', type: 'string', description: '', required: true },
            { name: 'limit', type: 'number', description: '', required: false },
          ],
        },
      ],
    });
    render(<BuilderTab server={server} setServer={jest.fn()} />);
    expect(screen.getByText(/2 params/)).toBeInTheDocument();
  });

  test('calls setServer when adding a tool primitive', () => {
    const setServer = jest.fn();
    const server = makeServer();
    render(<BuilderTab server={server} setServer={setServer} />);

    // the "⚡ Tool" add button
    const toolBtns = screen.getAllByText(/Tool/);
    const addToolBtn = toolBtns.find((el) => el.closest('button'));
    fireEvent.click(addToolBtn!);

    expect(setServer).toHaveBeenCalled();
  });

  test('code preview contains import statements', () => {
    const server = makeServer();
    const { container } = render(<BuilderTab server={server} setServer={jest.fn()} />);
    const preElement = container.querySelector('pre');
    expect(preElement).toBeTruthy();
    expect(preElement!.textContent).toContain('import');
  });
});
