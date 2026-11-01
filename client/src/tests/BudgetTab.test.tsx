import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetTab } from '../components/dashboard/BudgetTab.js';
import { EventProvider } from '../context/EventContext.js';
import { initializeBudgetState, EventState, EventProfile } from '@utsav/shared';
import * as api from '../services/api.js';

describe('BudgetTab Component', () => {
  const STORAGE_KEY = 'utsav_planner_event_state_v1';

  const mockProfile: EventProfile = {
    occasion: 'wedding',
    title: 'Aarav & Meera Wedding',
    totalBudgetINR: 1000000,
    expectedGuests: 100,
    eventDate: '2026-12-15',
    city: 'Jaipur',
    atmosphereTheme: 'Royal Heritage',
    culturalNeeds: [],
    dietaryNeeds: [],
    accessibilityNeeds: [],
    mustHaves: [],
    priorities: ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
    followUpQuestions: []
  };

  const mockEventState: EventState = {
    version: 1,
    id: 'evt-budget-test',
    profile: mockProfile,
    budget: initializeBudgetState(
      1000000,
      'wedding',
      ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
      100
    ),
    timeline: {
      tasks: [],
      eventDate: '2026-12-15',
      hasCycles: false,
      criticalPathTaskIds: []
    },
    vendorBriefs: {},
    quotes: [],
    changeLog: [],
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    // Pre-populate eventState in localStorage so EventProvider mounts with active state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockEventState));
    // Mock debounced AI advice call
    vi.spyOn(api, 'getBudgetTradeoffAdvice').mockResolvedValue({
      explanation: 'Adjusted allocation rebalanced in pure code.',
      actionableOptions: ['Lever 1', 'Lever 2'],
      disclaimer: 'Estimate, not a verified vendor price.'
    });
  });

  it('renders budget categories and updates totals when a slider is adjusted', async () => {
    render(
      <EventProvider>
        <BudgetTab />
      </EventProvider>
    );

    // Initial total allocation display check
    expect(screen.getByText(/Total Allocated: ₹10,00,000/i)).toBeInTheDocument();

    // Find the catering slider
    const cateringSlider = screen.getByLabelText(/Catering & Dining allocation percentage/i);
    expect(cateringSlider).toBeInTheDocument();

    // Adjust slider value to 40%
    fireEvent.change(cateringSlider, { target: { value: 40 } });

    // Slider value should now reflect 40
    expect(cateringSlider).toHaveValue('40');

    // Category allocation card and legend should display updated 40% and ₹4,00,000
    expect(screen.getAllByText('40%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('₹4,00,000')).toBeInTheDocument();

    // Overall total allocated amount remains strictly preserved at 10,00,000
    expect(screen.getByText(/Total Allocated: ₹10,00,000/i)).toBeInTheDocument();
  });

  it('allows toggling between Donut, Bar, and Table views via accessible view buttons', () => {
    render(
      <EventProvider>
        <BudgetTab />
      </EventProvider>
    );

    const donutBtn = screen.getByRole('button', { name: /Donut/i });
    const barBtn = screen.getByRole('button', { name: /Bar/i });
    const tableBtn = screen.getByRole('button', { name: /Table/i });

    expect(donutBtn).toHaveAttribute('aria-pressed', 'true');
    expect(barBtn).toHaveAttribute('aria-pressed', 'false');

    // Click Bar view
    fireEvent.click(barBtn);
    expect(barBtn).toHaveAttribute('aria-pressed', 'true');
    expect(donutBtn).toHaveAttribute('aria-pressed', 'false');

    // Click Table view
    fireEvent.click(tableBtn);
    expect(tableBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
