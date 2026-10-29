import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/common/Header.js';
import { EventProvider, useEvent } from '../context/EventContext.js';
import { EventState, EventProfile, initializeBudgetState } from '@utsav/shared';

describe('Header Component', () => {
  const STORAGE_KEY = 'utsav_planner_event_state_v1';

  const mockProfile: EventProfile = {
    occasion: 'wedding',
    title: 'Jaipur Vivah',
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

  const mockState: EventState = {
    version: 1,
    id: 'evt-header-test',
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
    changeLog: [],
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders brand and Load Demo Event button when eventState is null', () => {
    render(
      <EventProvider>
        <Header onOpenSomethingChanged={vi.fn()} />
      </EventProvider>
    );

    expect(screen.getByText('Utsav Planner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load Demo Event/i })).toBeInTheDocument();
  });

  it('renders Something Changed and Reset buttons when eventState exists', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));
    const openSomethingChangedMock = vi.fn();

    render(
      <EventProvider>
        <Header onOpenSomethingChanged={openSomethingChangedMock} />
      </EventProvider>
    );

    expect(screen.getByRole('button', { name: /Something Changed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Something Changed/i }));
    expect(openSomethingChangedMock).toHaveBeenCalledTimes(1);
  });

  it('resets event when user confirms Reset dialog', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const Consumer = () => {
      const { eventState } = useEvent();
      return (
        <div>
          <Header onOpenSomethingChanged={vi.fn()} />
          <div data-testid="has-event">{eventState ? 'yes' : 'no'}</div>
        </div>
      );
    };

    render(
      <EventProvider>
        <Consumer />
      </EventProvider>
    );

    expect(screen.getByTestId('has-event')).toHaveTextContent('yes');

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));

    expect(screen.getByTestId('has-event')).toHaveTextContent('no');
  });

  it('does not reset event when user cancels Reset dialog', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const Consumer = () => {
      const { eventState } = useEvent();
      return (
        <div>
          <Header onOpenSomethingChanged={vi.fn()} />
          <div data-testid="has-event">{eventState ? 'yes' : 'no'}</div>
        </div>
      );
    };

    render(
      <EventProvider>
        <Consumer />
      </EventProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));

    expect(screen.getByTestId('has-event')).toHaveTextContent('yes');
  });
});
