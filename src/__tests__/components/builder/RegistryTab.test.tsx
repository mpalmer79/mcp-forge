import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RegistryTab from '@/components/builder/RegistryTab';

describe('RegistryTab component', () => {
  test('renders the search input', () => {
    render(<RegistryTab />);
    expect(screen.getByPlaceholderText('Search servers...')).toBeInTheDocument();
  });

  test('renders filter buttons', () => {
    render(<RegistryTab />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText(/Official/)).toBeInTheDocument();
    expect(screen.getByText(/Community/)).toBeInTheDocument();
  });

  test('renders server cards from registry', () => {
    render(<RegistryTab />);
    // these are from the REGISTRY_SERVERS data
    expect(screen.getByText('Filesystem')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  test('filters servers by search text', () => {
    render(<RegistryTab />);
    const input = screen.getByPlaceholderText('Search servers...');

    fireEvent.change(input, { target: { value: 'slack' } });

    expect(screen.getByText('Slack')).toBeInTheDocument();
    // filesystem shouldn't match "slack"
    expect(screen.queryByText('Filesystem')).not.toBeInTheDocument();
  });

  test('filters by official when clicking Official button', () => {
    render(<RegistryTab />);
    const officialBtn = screen.getByText(/Official/);

    fireEvent.click(officialBtn);

    // official servers should be visible
    expect(screen.getByText('Filesystem')).toBeInTheDocument();
    // community-only servers should be hidden
    expect(screen.queryByText('Supabase')).not.toBeInTheDocument();
  });

  test('filters by community when clicking Community button', () => {
    render(<RegistryTab />);
    const communityBtn = screen.getByText(/Community/);

    fireEvent.click(communityBtn);

    // community servers should be visible
    expect(screen.getByText('Supabase')).toBeInTheDocument();
    // official-only servers should be hidden
    expect(screen.queryByText('Filesystem')).not.toBeInTheDocument();
  });

  test('shows all servers when clicking All button after filtering', () => {
    render(<RegistryTab />);

    // first filter to official
    fireEvent.click(screen.getByText(/Official/));
    expect(screen.queryByText('Supabase')).not.toBeInTheDocument();

    // then go back to all
    fireEvent.click(screen.getByText('All'));
    expect(screen.getByText('Supabase')).toBeInTheDocument();
    expect(screen.getByText('Filesystem')).toBeInTheDocument();
  });

  test('shows install command when server card is clicked', () => {
    render(<RegistryTab />);
    const fsCard = screen.getByText('Filesystem');

    fireEvent.click(fsCard);

    // should show Quick Install section
    expect(screen.getByText('Quick Install')).toBeInTheDocument();
    expect(screen.getByText(/npx -y @modelcontextprotocol\/filesystem/)).toBeInTheDocument();
  });

  test('displays star counts', () => {
    render(<RegistryTab />);
    // Filesystem has 4200 stars => "4.2k"
    expect(screen.getByText(/4\.2k/)).toBeInTheDocument();
  });

  test('displays tags on server cards', () => {
    render(<RegistryTab />);
    expect(screen.getByText('#files')).toBeInTheDocument();
    expect(screen.getByText('#local')).toBeInTheDocument();
  });

  test('displays author names', () => {
    render(<RegistryTab />);
    // multiple servers by Anthropic
    const authors = screen.getAllByText(/by Anthropic/);
    expect(authors.length).toBeGreaterThan(0);
  });
});
