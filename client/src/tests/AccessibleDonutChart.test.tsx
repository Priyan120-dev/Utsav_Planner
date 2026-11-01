import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibleDonutChart } from '../components/charts/AccessibleDonutChart.js';
import { initializeBudgetState } from '@utsav/shared';

describe('AccessibleDonutChart Component', () => {
  const mockBudget = initializeBudgetState(
    1000000,
    'wedding',
    ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
    100
  );

  it('provides an accessible table alternative toggle that renders a structured data table', () => {
    render(<AccessibleDonutChart budget={mockBudget} />);

    // Initially displays the SVG chart and an accessible table toggle button
    const tableToggleBtn = screen.getByRole('button', { name: /Accessible Table/i });
    expect(tableToggleBtn).toBeInTheDocument();
    expect(tableToggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(tableToggleBtn).toHaveAttribute('aria-controls', 'budget-data-table');

    // Click toggle to show accessible table
    fireEvent.click(tableToggleBtn);

    // Button should now indicate expanded state and show "Show Chart"
    expect(tableToggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Show Chart/i })).toBeInTheDocument();

    // Table container and elements must now exist in the DOM
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Verify table caption and structure
    expect(
      screen.getByText('Detailed event budget allocation breakdown by category')
    ).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Category/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Share \(%\)/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Amount \(₹\)/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Cost Per Guest \(₹\)/i })).toBeInTheDocument();

    // Verify row headers exist for categories
    expect(screen.getByRole('rowheader', { name: /Venue & Grounds/i })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /Catering & Dining/i })).toBeInTheDocument();
  });

  it('renders the table directly when forcedView="table" is specified', () => {
    render(<AccessibleDonutChart budget={mockBudget} forcedView="table" />);

    // Table is immediately present without clicking
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(
      screen.getByText('Detailed event budget allocation breakdown by category')
    ).toBeInTheDocument();
    // In forcedView mode, internal toggle button is suppressed
    expect(screen.queryByRole('button', { name: /Show Chart/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Accessible Table/i })).not.toBeInTheDocument();
  });
});
