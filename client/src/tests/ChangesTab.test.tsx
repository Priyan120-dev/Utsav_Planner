import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangesTab } from '../components/dashboard/ChangesTab.js';
import { EventProvider } from '../context/EventContext.js';
import * as api from '../services/api.js';
import { EventState, EventProfile, initializeBudgetState } from '@utsav/shared';

describe('ChangesTab Component', () => {
  const STORAGE_KEY = 'utsav_planner_event_state_v1';

  const mockProfile: EventProfile = {
    occasion: 'wedding',
    title: 'Jaipur Palace Wedding',
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
    id: 'evt-changes-test',
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
        id: 'log-2',
        timestamp: '2026-05-02T10:00:00.000Z',
        fieldChanged: 'budget',
        previousValue: 1500000,
        newValue: 2000000,
        reason: 'Increased catering budget',
        impactSummary: 'Scaled total budget by 5 Lakhs'
      },
      {
        id: 'log-1',
        timestamp: '2026-05-01T10:00:00.000Z',
        fieldChanged: 'custom',
        previousValue: null,
        newValue: 'Initial Setup',
        reason: 'Event created',
        impactSummary: 'Initial setup of Jaipur Palace Wedding'
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockInitialState));
  });

  it('renders top banner, radio options, change history and undo button when multiple logs exist', () => {
    render(
      <EventProvider>
        <ChangesTab />
      </EventProvider>
    );

    expect(screen.getByText('Resilience to Dynamic In-Flight Changes')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Update Guest Count/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Update Budget/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Update Event Date/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Undo Last Change/i })).toBeInTheDocument();
    expect(screen.getByText('Scaled total budget by 5 Lakhs')).toBeInTheDocument();
  });

  it('switches between adjustment categories (budget, guests, date)', () => {
    render(
      <EventProvider>
        <ChangesTab />
      </EventProvider>
    );

    const budgetRadio = screen.getByRole('radio', { name: /Update Budget/i });
    fireEvent.click(budgetRadio);
    expect(budgetRadio).toHaveAttribute('aria-checked', 'true');

    const dateRadio = screen.getByRole('radio', { name: /Update Event Date/i });
    fireEvent.click(dateRadio);
    expect(dateRadio).toHaveAttribute('aria-checked', 'true');
  });

  it('evaluates change impact and commits the dynamic change', async () => {
    const mockImpact = {
      oldValue: 200,
      newValue: 250,
      delta: 50,
      updatedBudget: mockInitialState.budget,
      advice: {
        impactSummary: 'Per-guest spend rebalanced smoothly for 250 guests.',
        budgetAdvice: 'Scale catering allocation by 15%',
        vendorAdvice: 'Inform venue about 50 additional guests',
        suggestedActionItems: ['Scale catering by 15%']
      }
    };

    const evalSpy = vi.spyOn(api, 'assessDynamicChangeImpact').mockResolvedValueOnce(mockImpact);
    const closeModalMock = vi.fn();

    render(
      <EventProvider>
        <ChangesTab onCloseModal={closeModalMock} />
      </EventProvider>
    );

    const evalBtn = screen.getByRole('button', { name: /Evaluate Impact Diff/i });
    fireEvent.click(evalBtn);

    expect(evalSpy).toHaveBeenCalledWith(
      expect.any(Object),
      'guests',
      250,
      'Expanded family and outstation guest list'
    );

    expect(await screen.findByText('Per-guest spend rebalanced smoothly for 250 guests.')).toBeInTheDocument();
    expect(screen.getByText('Scale catering by 15%')).toBeInTheDocument();

    // Confirm and Commit
    const commitBtn = screen.getByRole('button', { name: /Confirm & Commit Change to Plan/i });
    fireEvent.click(commitBtn);

    expect(closeModalMock).toHaveBeenCalled();
  });

  it('handles evaluation error gracefully', async () => {
    vi.spyOn(api, 'assessDynamicChangeImpact').mockRejectedValueOnce(new Error('Assessment API timeout'));

    render(
      <EventProvider>
        <ChangesTab />
      </EventProvider>
    );

    const evalBtn = screen.getByRole('button', { name: /Evaluate Impact Diff/i });
    fireEvent.click(evalBtn);

    expect(await screen.findByText('Assessment API timeout')).toBeInTheDocument();
  });

  it('calls undoLastChange when Undo button is clicked', () => {
    render(
      <EventProvider>
        <ChangesTab />
      </EventProvider>
    );

    const undoBtn = screen.getByRole('button', { name: /Undo Last Change/i });
    fireEvent.click(undoBtn);

    // After undoing, the second log is removed
    expect(screen.queryByText('Scaled total budget by 5 Lakhs')).not.toBeInTheDocument();
  });
});
