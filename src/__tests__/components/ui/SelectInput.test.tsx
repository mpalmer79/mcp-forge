import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectInput from '@/components/ui/SelectInput';

const opts = ['stdio', 'http', 'sse'] as const;

describe('SelectInput component', () => {
  test('renders a select element', () => {
    render(<SelectInput value="stdio" onChange={() => {}} options={opts} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  test('renders all options', () => {
    render(<SelectInput value="stdio" onChange={() => {}} options={opts} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
  });

  test('displays option text correctly', () => {
    render(<SelectInput value="stdio" onChange={() => {}} options={opts} />);
    expect(screen.getByText('stdio')).toBeInTheDocument();
    expect(screen.getByText('http')).toBeInTheDocument();
    expect(screen.getByText('sse')).toBeInTheDocument();
  });

  test('reflects the selected value', () => {
    render(<SelectInput value="http" onChange={() => {}} options={opts} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('http');
  });

  test('calls onChange when selection changes', () => {
    const handleChange = jest.fn();
    render(<SelectInput value="stdio" onChange={handleChange} options={opts} />);
    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'sse' } });
    expect(handleChange).toHaveBeenCalledWith('sse');
  });

  test('merges custom style prop', () => {
    const { container } = render(
      <SelectInput value="stdio" onChange={() => {}} options={opts} style={{ width: 200 }} />
    );
    const select = container.querySelector('select');
    expect(select).toBeTruthy();
  });
});
