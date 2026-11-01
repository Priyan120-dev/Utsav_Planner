import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibleBarChart } from '../components/charts/AccessibleBarChart.js';
import { initializeBudgetState } from '@utsav/shared';

describe('AccessibleBarChart Component', () => {
  const mockBudget = initializeBudgetState(
    1500000,
    'wedding',
    ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
    150
  );

  it('provides an accessible table alternative toggle that switches between bar chart and table', () => {
    render(<AccessibleBarChart budget={mockBudget} />);

    // Initially displays the bar chart and an accessible table toggle button
    const tableToggleBtn = screen.getByRole('button', { name: /Accessible Table/i });
    expect(tableToggleBtn).toBeInTheDocument();
    expect(tableToggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(tableToggleBtn).toHaveAttribute('aria-controls', 'budget-bar-data-table');

    // Click toggle to show accessible table
    fireEvent.click(tableToggleBtn);

    // Button should now indicate expanded state and show "Show Bar Chart"
    expect(tableToggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Show Bar Chart/i })).toBeInTheDocument();

    // Table container and elements must now exist in the DOM
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(
      screen.getByText('Detailed event budget allocation breakdown by category')
    ).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Category/i })).toBeInTheDocument();

    // Toggle back to chart
    fireEvent.click(screen.getByRole('button', { name: /Show Bar Chart/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders table directly when forcedView="table"', () => {
    render(<AccessibleBarChart budget={mockBudget} forcedView="table" />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show Bar Chart/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Accessible Table/i })).not.toBeInTheDocument();
  });

  it('supports mouse enter and leave interaction on bar items', () => {
    render(<AccessibleBarChart budget={mockBudget} />);

    const barSymbols = screen.getAllByRole('graphics-symbol');
    expect(barSymbols.length).toBeGreaterThan(0);

    fireEvent.mouseEnter(barSymbols[0]);
    fireEvent.mouseLeave(barSymbols[0]);
    fireEvent.focus(barSymbols[0]);
    fireEvent.blur(barSymbols[0]);
  });
});
