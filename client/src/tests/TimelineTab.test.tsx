import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineTab } from '../components/dashboard/TimelineTab.js';
import { EventProvider } from '../context/EventContext.js';
import { initializeBudgetState, EventState, EventProfile } from '@utsav/shared';

describe('TimelineTab Component', () => {
  const STORAGE_KEY = 'utsav_planner_event_state_v1';

  const mockProfile: EventProfile = {
    occasion: 'wedding',
    title: 'Test Wedding Celebration',
    totalBudgetINR: 1500000,
    expectedGuests: 150,
    eventDate: '2026-12-25',
    city: 'Delhi',
    atmosphereTheme: 'Royal Festive',
    culturalNeeds: [],
    dietaryNeeds: [],
    accessibilityNeeds: [],
    mustHaves: [],
    priorities: ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
    followUpQuestions: []
  };

  const mockEventStateWithTasks: EventState = {
    version: 1,
    id: 'evt-timeline-test',
    profile: mockProfile,
    budget: initializeBudgetState(1500000, 'wedding', ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'], 150),
    timeline: {
      tasks: [
        {
          id: 'task-1',
          title: 'Finalize & Book Wedding Venue',
          category: 'venue',
          daysBeforeEvent: 120,
          targetDate: '2026-08-27',
          priority: 'critical',
          dependsOn: [],
          status: 'ready',
          isCriticalPath: true
        },
        {
          id: 'task-2',
          title: 'Finalize Mandap Theme & Decor Fabrication',
          category: 'decor',
          daysBeforeEvent: 60,
          targetDate: '2026-10-26',
          priority: 'high',
          dependsOn: ['task-1'], // Dependent on task-1!
          status: 'locked',
          isCriticalPath: true
        },
        {
          id: 'task-3',
          title: 'Print & Dispatch Digital Wedding Invitations',
          category: 'invitations',
          daysBeforeEvent: 45,
          targetDate: '2026-11-10',
          priority: 'medium',
          dependsOn: ['task-1'],
          status: 'locked'
        }
      ],
      eventDate: '2026-12-25',
      hasCycles: false,
      criticalPathTaskIds: ['task-1', 'task-2']
    },
    vendorBriefs: {},
    quotes: [],
    changeLog: [],
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockEventStateWithTasks));
  });

  it('renders locked tasks with disabled action buttons, prerequisite lock indicators, and filter support', () => {
    render(
      <EventProvider>
        <TimelineTab />
      </EventProvider>
    );

    // Initial check: total tasks completed count
    expect(screen.getByText('0/3 Completed')).toBeInTheDocument();

    // The ready task should have an active enabled button
    const readyBtn = screen.getByRole('button', { name: /Ready to Start/i });
    expect(readyBtn).toBeEnabled();

    // The locked tasks should have disabled buttons with "Locked (Prereqs Pending)"
    const lockedButtons = screen.getAllByRole('button', { name: /Locked \(Prereqs Pending\)/i });
    expect(lockedButtons).toHaveLength(2);
    expect(lockedButtons[0]).toBeDisabled();
    expect(lockedButtons[1]).toBeDisabled();

    // The locked task should show prerequisite badge with lock icon
    const prereqBadges = screen.getAllByText(/Finalize & Book Wedding Venue 🔒/i);
    expect(prereqBadges.length).toBeGreaterThanOrEqual(1);

    // Filter by locked tasks
    const lockedFilterTab = screen.getByRole('button', { name: /^locked$/i });
    fireEvent.click(lockedFilterTab);

    // Ready task should now be filtered out
    expect(screen.queryByText('Finalize & Book Wedding Venue')).not.toBeInTheDocument();

    // Locked tasks remain visible
    expect(screen.getByText('Finalize Mandap Theme & Decor Fabrication')).toBeInTheDocument();
    expect(screen.getByText('Print & Dispatch Digital Wedding Invitations')).toBeInTheDocument();
  });
});
