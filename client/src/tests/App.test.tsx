import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App.js';
import { EventProvider } from '../context/EventContext.js';
import { EventState, EventProfile, initializeBudgetState } from '@utsav/shared';

describe('App Component', () => {
  const STORAGE_KEY = 'utsav_planner_event_state_v1';

  const mockProfile: EventProfile = {
    occasion: 'wedding',
    title: 'Grand Jaipur Vivah',
    totalBudgetINR: 2000000,
    expectedGuests: 200,
    eventDate: '2026-11-20',
    city: 'Jaipur',
    atmosphereTheme: 'Heritage',
    culturalNeeds: ['Sangeet'],
    dietaryNeeds: ['Pure Veg'],
    accessibilityNeeds: [],
    mustHaves: ['Live shehnai'],
    priorities: ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
    followUpQuestions: []
  };

  const mockInitialState: EventState = {
    version: 1,
    id: 'evt-app-test',
    profile: mockProfile,
    budget: initializeBudgetState(2000000, 'wedding', mockProfile.priorities, 200),
    timeline: {
      tasks: [],
      eventDate: '2026-11-20',
      hasCycles: false,
      criticalPathTaskIds: []
    },
    vendorBriefs: {},
    quotes: [],
    changeLog: [
      {
        id: 'log-1',
        timestamp: '2026-05-01T10:00:00.000Z',
        fieldChanged: 'custom',
        previousValue: null,
        newValue: 'Initial Setup',
        reason: 'Event created',
        impactSummary: 'Initial setup of Grand Jaipur Vivah'
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders OnboardingWizard when eventState is null', () => {
    render(
      <EventProvider>
        <App />
      </EventProvider>
    );

    expect(screen.getByText('Plan Your Auspicious Celebration')).toBeInTheDocument();
  });

  it('renders dashboard with navigation tabs when eventState exists and allows tab switching', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockInitialState));

    render(
      <EventProvider>
        <App />
      </EventProvider>
    );

    expect(screen.getByRole('tab', { name: /Overview & Readiness/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Budget & Trade-offs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Timeline & Tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Vendors & Quotes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Changes & History/i })).toBeInTheDocument();

    // Switch to Budget tab
    fireEvent.click(screen.getByRole('tab', { name: /Budget & Trade-offs/i }));
    expect(screen.getByRole('tab', { name: /Budget & Trade-offs/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Switch to Timeline tab
    fireEvent.click(screen.getByRole('tab', { name: /Timeline & Tasks/i }));
    expect(screen.getByRole('tab', { name: /Timeline & Tasks/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Switch to Vendors tab
    fireEvent.click(screen.getByRole('tab', { name: /Vendors & Quotes/i }));
    expect(screen.getByRole('tab', { name: /Vendors & Quotes/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Switch to Changes tab
    fireEvent.click(screen.getByRole('tab', { name: /Changes & History/i }));
    expect(screen.getByRole('tab', { name: /Changes & History/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('supports keyboard navigation between tabs (ArrowRight, ArrowLeft, Home, End)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockInitialState));

    render(
      <EventProvider>
        <App />
      </EventProvider>
    );

    const overviewTab = screen.getByRole('tab', { name: /Overview & Readiness/i });
    fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Budget & Trade-offs/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    const budgetTab = screen.getByRole('tab', { name: /Budget & Trade-offs/i });
    fireEvent.keyDown(budgetTab, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /Overview & Readiness/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.keyDown(overviewTab, { key: 'End' });
    expect(screen.getByRole('tab', { name: /Changes & History/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    const changesTab = screen.getByRole('tab', { name: /Changes & History/i });
    fireEvent.keyDown(changesTab, { key: 'Home' });
    expect(screen.getByRole('tab', { name: /Overview & Readiness/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('opens and closes the "Something Changed" modal from the Header', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockInitialState));

    render(
      <EventProvider>
        <App />
      </EventProvider>
    );

    const somethingChangedBtn = screen.getByRole('button', { name: /Something Changed/i });
    fireEvent.click(somethingChangedBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Something Changed Mid-Planning')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close change modal/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
