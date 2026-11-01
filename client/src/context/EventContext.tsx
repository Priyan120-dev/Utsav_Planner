import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react';
import {
  EventState,
  EventProfile,
  BudgetCategory,
  QuoteItem,
  VendorBrief,
  TaskItem,
  initializeBudgetState,
  rebalanceBudget,
  evaluateTaskStatuses
} from '@utsav/shared';
import * as api from '../services/api.js';
import { useLiveAnnounce } from '../hooks/useLiveAnnounce.js';
import { createFallbackStarterTasks } from './fallbackTasks.js';
import { createDemoProfile } from './demoProfile.js';
import {
  applyDynamicChange,
  applyUndoLastChange,
  createInitialEventState
} from './eventStateReducers.js';
import { EventContextType } from './eventContextTypes.js';

export type { EventContextType };

const STORAGE_KEY = 'utsav_planner_event_state_v1';

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [eventState, setEventState] = useState<EventState | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved event state from localStorage:', e);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { announcement, announce } = useLiveAnnounce();

  // Announce errors to screen readers
  useEffect(() => {
    if (error) {
      announce(`Error: ${error}`);
    }
  }, [error, announce]);

  // Sync state to localStorage whenever eventState changes
  useEffect(() => {
    if (eventState) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(eventState));
      } catch (e) {
        console.error('Failed to persist eventState to localStorage:', e);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [eventState]);

  const clearError = () => setError(null);

  /**
   * Initializes a new EventState from an EventProfile
   */
  const initializeEvent = useCallback(
    async (profile: EventProfile) => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Pure code computes budget distribution and per-head math
        const initialBudget = initializeBudgetState(
          profile.totalBudgetINR,
          profile.occasion,
          profile.priorities,
          profile.expectedGuests
        );

        // 2. Call AI service to generate sequenced tasks with dependencies
        let initialTasks: TaskItem[] = [];
        try {
          const tasksRes = await api.generateTimelineTasks(profile);
          initialTasks = tasksRes.tasks || [];
        } catch (err: unknown) {
          const errMessage = err instanceof Error ? err.message : String(err);
          console.warn(
            'Task generation failed or skipped, creating fallback starter tasks:',
            errMessage
          );
          // Fallback core foundation tasks
          initialTasks = createFallbackStarterTasks(profile);
        }

        // Evaluate locks and target dates with pure logic
        const evaluatedTasks = evaluateTaskStatuses(initialTasks, profile.eventDate);
        const newState = createInitialEventState(profile, initialBudget, evaluatedTasks);

        setEventState(newState);
        announce(`Event initialized with ${evaluatedTasks.length} timeline tasks generated.`);
      } catch (err: unknown) {
        const msg =
          err instanceof Error && err.message ? err.message : 'Failed to initialize event.';
        setError(msg);
        announce(`Error: ${msg}`);
      } finally {
        setIsLoading(false);
      }
    },
    [announce]
  );

  /**
   * Synchronous pure rebalancing: instantly updates all categories,
   * donut chart slices, per-guest amounts, and safety buffer with zero debounce.
   */
  const rebalanceCategoryBudget = useCallback(
    (category: BudgetCategory, newPercentage: number) => {
      setEventState((current) => {
        if (!current) return null;
        const rebalancedBudget = rebalanceBudget(
          current.budget,
          category,
          newPercentage,
          current.profile.expectedGuests
        );
        return {
          ...current,
          budget: rebalancedBudget,
          lastUpdated: new Date().toISOString()
        };
      });
      announce(`Budget rebalanced for ${category}.`);
    },
    [announce]
  );

  /**
   * Updates lastAiTradeoff in state
   */
  const setBudgetTradeoffAdvice = useCallback(
    (tradeoff: { explanation: string; actionableOptions: string[]; disclaimer: string }) => {
      setEventState((current) => {
        if (!current) return null;
        return {
          ...current,
          budget: {
            ...current.budget,
            lastAiTradeoff: tradeoff
          }
        };
      });
    },
    []
  );

  /**
   * Interactive slider update: pure code instantly rebalances deltas,
   * then calls AI service to fetch trade-off explanation and options.
   */
  const updateSliderPercentage = useCallback(
    async (category: BudgetCategory, newPercentage: number, signal?: AbortSignal) => {
      if (!eventState) return;

      // 1. Instant pure arithmetic rebalancing
      rebalanceCategoryBudget(category, newPercentage);

      // 2. Fetch AI trade-off analysis
      try {
        const tradeoff = await api.getBudgetTradeoffAdvice(
          eventState,
          category,
          newPercentage,
          signal
        );
        if (signal?.aborted) return;
        setBudgetTradeoffAdvice(tradeoff);
      } catch (err: unknown) {
        if ((err instanceof Error && err.name === 'AbortError') || signal?.aborted) return;
        console.warn('AI budget tradeoff evaluation error:', err);
      }
    },
    [eventState, rebalanceCategoryBudget, setBudgetTradeoffAdvice]
  );

  /**
   * Toggles task status (ready -> in_progress -> done)
   * and automatically unlocks dependent tasks using pure logic
   */
  const toggleTaskStatus = useCallback((taskId: string) => {
    setEventState((current) => {
      if (!current) return null;

      const nextTasks = current.timeline.tasks.map((t) => {
        if (t.id === taskId) {
          let nextStatus = t.status;
          if (t.status === 'ready') nextStatus = 'in_progress';
          else if (t.status === 'in_progress') nextStatus = 'done';
          else if (t.status === 'done') nextStatus = 'ready';
          return { ...t, status: nextStatus };
        }
        return t;
      });

      // Pure code re-evaluates all locks and critical path
      const evaluated = evaluateTaskStatuses(nextTasks, current.timeline.eventDate);

      return {
        ...current,
        timeline: {
          ...current.timeline,
          tasks: evaluated
        },
        lastUpdated: new Date().toISOString()
      };
    });
  }, []);

  /**
   * Saves a generated vendor brief for a category
   */
  const saveVendorBrief = useCallback((brief: VendorBrief & { category: BudgetCategory }) => {
    setEventState((current) => {
      if (!current) return null;
      return {
        ...current,
        vendorBriefs: {
          ...current.vendorBriefs,
          [brief.category]: brief
        },
        lastUpdated: new Date().toISOString()
      };
    });
  }, []);

  /**
   * Saves an extracted quote with computed TCO
   */
  const saveQuote = useCallback(
    (quote: QuoteItem) => {
      setEventState((current) => {
        if (!current) return null;
        return {
          ...current,
          quotes: [quote, ...current.quotes],
          lastUpdated: new Date().toISOString()
        };
      });
      announce(`Vendor quote parsed and saved for ${quote.vendorName}.`);
    },
    [announce]
  );

  /**
   * Commits a dynamic in-flight change to budget, guests, or date,
   * deterministically recomputing values and logging to changeLog.
   */
  const commitDynamicChange = useCallback(
    (
      changeType: 'budget' | 'guests' | 'date',
      newValue: string | number,
      reason: string,
      impactSummary: string
    ) => {
      setEventState((current) => {
        if (!current) return null;
        return applyDynamicChange(current, changeType, newValue, reason, impactSummary);
      });
      announce(
        `In-flight change applied to ${changeType}. ${impactSummary || 'Updated parameters.'}`
      );
    },
    [announce]
  );

  /**
   * 1-Click Undo for the last changeLog entry
   */
  const undoLastChange = useCallback(() => {
    setEventState((current) => {
      if (!current) return null;
      return applyUndoLastChange(current);
    });
    announce('Last change undone. Restored previous event state.');
  }, [announce]);

  /**
   * Loads an authentic Indian celebration demo profile and triggers LIVE AI generation
   */
  const loadDemoEvent = useCallback(async () => {
    const demoProfile = createDemoProfile();
    await initializeEvent(demoProfile);
  }, [initializeEvent]);

  /**
   * Resets the event state completely
   */
  const resetEvent = useCallback(() => {
    setEventState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <EventContext.Provider
      value={{
        eventState,
        isLoading,
        error,
        announcement,
        announce,
        clearError,
        initializeEvent,
        updateSliderPercentage,
        rebalanceCategoryBudget,
        setBudgetTradeoffAdvice,
        toggleTaskStatus,
        saveVendorBrief,
        saveQuote,
        commitDynamicChange,
        undoLastChange,
        loadDemoEvent,
        resetEvent
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export function useEvent(): EventContextType {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
