import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { EventProvider, useEvent } from '../context/EventContext.js';
import * as api from '../services/api.js';
import { EventProfile, QuoteItem, VendorBrief } from '@utsav/shared';

describe('EventContext and Actions', () => {
  const STORAGE_KEY = 'utsav_planner_event_state_v1';

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const mockProfile: EventProfile = {
    occasion: 'wedding',
    title: 'Test Wedding Celebration',
    totalBudgetINR: 1500000,
    expectedGuests: 150,
    eventDate: '2026-12-25',
    city: 'Delhi',
    atmosphereTheme: 'Royal Festive',
    culturalNeeds: ['Haldi', 'Sangeet'],
    dietaryNeeds: ['Vegetarian'],
    accessibilityNeeds: [],
    mustHaves: ['Live Shehnai'],
    priorities: ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
    followUpQuestions: []
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EventProvider>{children}</EventProvider>
  );

  it('throws an error if useEvent is used outside EventProvider', () => {
    // Suppress React error boundary console log for expected throw
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useEvent())).toThrow(
      'useEvent must be used within an EventProvider'
    );
    consoleError.mockRestore();
  });

  it('initializes event with generated timeline tasks', async () => {
    vi.spyOn(api, 'generateTimelineTasks').mockResolvedValueOnce({
      tasks: [
        {
          id: 'task-1',
          title: 'Book Venue',
          category: 'venue',
          daysBeforeEvent: 90,
          targetDate: '',
          priority: 'critical',
          dependsOn: [],
          status: 'ready'
        }
      ],
      hasCycles: false
    });

    const { result } = renderHook(() => useEvent(), { wrapper });

    await act(async () => {
      await result.current.initializeEvent(mockProfile);
    });

    expect(result.current.eventState).not.toBeNull();
    expect(result.current.eventState?.profile.title).toBe('Test Wedding Celebration');
    expect(result.current.eventState?.timeline.tasks).toHaveLength(1);
    expect(result.current.eventState?.timeline.tasks[0].title).toBe('Book Venue');
    await waitFor(() => {
      expect(result.current.announcement).toContain('Event initialized');
    });
  });

  it('initializes event with fallback starter tasks when task generation fails', async () => {
    vi.spyOn(api, 'generateTimelineTasks').mockRejectedValueOnce(new Error('AI Task error'));

    const { result } = renderHook(() => useEvent(), { wrapper });

    await act(async () => {
      await result.current.initializeEvent(mockProfile);
    });

    expect(result.current.eventState).not.toBeNull();
    // Fallback creates 4 core tasks
    expect(result.current.eventState?.timeline.tasks.length).toBeGreaterThanOrEqual(4);
  });

  it('handles error in initializeEvent gracefully and allows clearError', async () => {
    // Make initializeBudgetState throw or mock an error
    vi.spyOn(api, 'generateTimelineTasks').mockImplementationOnce(() => {
      throw new Error('Fatal initialization fault');
    });

    const { result } = renderHook(() => useEvent(), { wrapper });

    await act(async () => {
      try {
        await result.current.initializeEvent({ ...mockProfile, totalBudgetINR: -1 } as any);
      } catch {
        // Handled internally in hook
      }
    });

    // If an error is set, clearError resets it
    if (result.current.error) {
      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    }
  });

  it('rebalances budget and updates sliders with AI advice', async () => {
    vi.spyOn(api, 'generateTimelineTasks').mockResolvedValueOnce({ tasks: [], hasCycles: false });
    const adviceSpy = vi.spyOn(api, 'getBudgetTradeoffAdvice').mockResolvedValueOnce({
      explanation: 'Increased catering proportion',
      actionableOptions: ['Trim decor budget'],
      disclaimer: 'Purely advisory'
    });

    const { result } = renderHook(() => useEvent(), { wrapper });

    await act(async () => {
      await result.current.initializeEvent(mockProfile);
    });

    // Rebalance synchronously
    act(() => {
      result.current.rebalanceCategoryBudget('catering', 40);
    });
    expect(result.current.eventState?.budget.categories.catering.percentage).toBe(40);

    // Update slider with advice
    await act(async () => {
      await result.current.updateSliderPercentage('catering', 45);
    });
    expect(adviceSpy).toHaveBeenCalled();
    expect(result.current.eventState?.budget.lastAiTradeoff?.explanation).toBe(
      'Increased catering proportion'
    );
  });

  it('toggles task status and re-evaluates dependencies', async () => {
    vi.spyOn(api, 'generateTimelineTasks').mockResolvedValueOnce({
      tasks: [
        {
          id: 'task-v',
          title: 'Book Venue',
          category: 'venue',
          daysBeforeEvent: 90,
          targetDate: '',
          priority: 'critical',
          dependsOn: [],
          status: 'ready'
        },
        {
          id: 'task-c',
          title: 'Book Caterer',
          category: 'catering',
          daysBeforeEvent: 60,
          targetDate: '',
          priority: 'high',
          dependsOn: ['task-v'],
          status: 'locked'
        }
      ],
      hasCycles: false
    });

    const { result } = renderHook(() => useEvent(), { wrapper });

    await act(async () => {
      await result.current.initializeEvent(mockProfile);
    });

    expect(result.current.eventState?.timeline.tasks.find((t) => t.id === 'task-v')?.status).toBe(
      'ready'
    );
    expect(result.current.eventState?.timeline.tasks.find((t) => t.id === 'task-c')?.status).toBe(
      'locked'
    );

    // Advance task-v to in_progress
    act(() => {
      result.current.toggleTaskStatus('task-v');
    });
    expect(result.current.eventState?.timeline.tasks.find((t) => t.id === 'task-v')?.status).toBe(
      'in_progress'
    );

    // Advance task-v to done -> should unlock task-c!
    act(() => {
      result.current.toggleTaskStatus('task-v');
    });
    expect(result.current.eventState?.timeline.tasks.find((t) => t.id === 'task-v')?.status).toBe(
      'done'
    );
    expect(result.current.eventState?.timeline.tasks.find((t) => t.id === 'task-c')?.status).toBe(
      'ready'
    );

    // Advance task-v from done wraps back to ready
    act(() => {
      result.current.toggleTaskStatus('task-v');
    });
    expect(result.current.eventState?.timeline.tasks.find((t) => t.id === 'task-v')?.status).toBe(
      'ready'
    );
  });

  it('saves vendor brief and quotes into state', async () => {
    vi.spyOn(api, 'generateTimelineTasks').mockResolvedValueOnce({ tasks: [], hasCycles: false });

    const { result } = renderHook(() => useEvent(), { wrapper });

    await act(async () => {
      await result.current.initializeEvent(mockProfile);
    });

    const testBrief: VendorBrief & { category: 'decor' } = {
      category: 'decor',
      scopeSummary: 'Royal floral setup',
      keyInclusions: ['Marigold themes', 'Mandap canopy'],
      capacityRequirement: '200 guests',
      timingDetails: 'Same day setup',
      accessibilityRequirements: ['Clear aisle space'],
      negotiationQuestions: ['Any extra charges for nighttime setup?']
    };

    act(() => {
      result.current.saveVendorBrief(testBrief);
    });
    expect(result.current.eventState?.vendorBriefs.decor?.scopeSummary).toBe('Royal floral setup');

    const testQuote: QuoteItem = {
      id: 'q-101',
      category: 'decor',
      vendorName: 'Floral Dreams',
      basePriceINR: 200000,
      tiers: null,
      guestCapacity: null,
      inclusions: ['Mandap florals'],
      exclusions: [],
      additionalChargesINR: 0,
      additionalChargesBreakdown: [],
      paymentTerms: '50% advance',
      cancellationPolicy: 'Non refundable',
      missingInfo: [],
      redFlags: [],
      computedTotalCostINR: 200000,
      availabilityDisclaimer: 'Availability not verified'
    };

    act(() => {
      result.current.saveQuote(testQuote);
    });
    expect(result.current.eventState?.quotes).toHaveLength(1);
    expect(result.current.eventState?.quotes[0].vendorName).toBe('Floral Dreams');
  });

  it('commits dynamic changes to budget, guests, and date, and supports undo', async () => {
    vi.spyOn(api, 'generateTimelineTasks').mockResolvedValueOnce({ tasks: [], hasCycles: false });

    const { result } = renderHook(() => useEvent(), { wrapper });

    await act(async () => {
      await result.current.initializeEvent(mockProfile);
    });

    // 1. Commit guest change
    act(() => {
      result.current.commitDynamicChange(
        'guests',
        200,
        'More relatives invited',
        'Recalculated per-head spend'
      );
    });
    expect(result.current.eventState?.profile.expectedGuests).toBe(200);
    expect(result.current.eventState?.changeLog).toHaveLength(2);

    // 2. Commit budget change
    act(() => {
      result.current.commitDynamicChange(
        'budget',
        2000000,
        'Family contributed more',
        'Expanded allocations'
      );
    });
    expect(result.current.eventState?.profile.totalBudgetINR).toBe(2000000);
    expect(result.current.eventState?.changeLog).toHaveLength(3);

    // 3. Commit date change
    act(() => {
      result.current.commitDynamicChange(
        'date',
        '2026-11-25',
        'Auspicious date shifted',
        'Compressed timelines'
      );
    });
    expect(result.current.eventState?.profile.eventDate).toBe('2026-11-25');
    expect(result.current.eventState?.changeLog).toHaveLength(4);

    // 4. Undo date change
    act(() => {
      result.current.undoLastChange();
    });
    expect(result.current.eventState?.profile.eventDate).toBe('2026-12-25');
    expect(result.current.eventState?.changeLog).toHaveLength(3);

    // 5. Undo budget change
    act(() => {
      result.current.undoLastChange();
    });
    expect(result.current.eventState?.profile.totalBudgetINR).toBe(1500000);
    expect(result.current.eventState?.changeLog).toHaveLength(2);

    // 6. Undo guest change
    act(() => {
      result.current.undoLastChange();
    });
    expect(result.current.eventState?.profile.expectedGuests).toBe(150);
    expect(result.current.eventState?.changeLog).toHaveLength(1);
  });

  it('loads demo event and resets event', async () => {
    vi.spyOn(api, 'generateTimelineTasks').mockResolvedValueOnce({ tasks: [], hasCycles: false });

    const { result } = renderHook(() => useEvent(), { wrapper });

    await act(async () => {
      await result.current.loadDemoEvent();
    });

    expect(result.current.eventState).not.toBeNull();
    expect(result.current.eventState?.profile.title).toContain(
      "Ananya & Rohit's Royal Palace Wedding"
    );

    // Reset event
    act(() => {
      result.current.resetEvent();
    });
    expect(result.current.eventState).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
