import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  EventState,
  EventProfile,
  BudgetCategory,
  QuoteItem,
  VendorBrief,
  TaskItem,
  initializeBudgetState,
  rebalanceBudget,
  recalculateBudgetForParameters,
  evaluateTaskStatuses,
  ChangeLogEntry
} from '@utsav/shared';
import * as api from '../services/api.js';
import { useLiveAnnounce } from '../hooks/useLiveAnnounce.js';

const STORAGE_KEY = 'utsav_planner_event_state_v1';

interface EventContextType {
  eventState: EventState | null;
  isLoading: boolean;
  error: string | null;
  announcement: string;
  announce: (message: string) => void;
  clearError: () => void;
  initializeEvent: (profile: EventProfile) => Promise<void>;
  updateSliderPercentage: (category: BudgetCategory, newPercentage: number, signal?: AbortSignal) => Promise<void>;
  rebalanceCategoryBudget: (category: BudgetCategory, newPercentage: number) => void;
  setBudgetTradeoffAdvice: (tradeoff: { explanation: string; actionableOptions: string[]; disclaimer: string }) => void;
  toggleTaskStatus: (taskId: string) => void;
  saveVendorBrief: (brief: VendorBrief & { category: BudgetCategory }) => void;
  saveQuote: (quote: QuoteItem) => void;
  commitDynamicChange: (
    changeType: 'budget' | 'guests' | 'date',
    newValue: string | number,
    reason: string,
    impactSummary: string
  ) => void;
  undoLastChange: () => void;
  loadDemoEvent: () => Promise<void>;
  resetEvent: () => void;
}

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
  const initializeEvent = useCallback(async (profile: EventProfile) => {
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
      } catch (err: any) {
        console.warn('Task generation failed or skipped, creating fallback starter tasks:', err.message);
        // Fallback core foundation tasks
        initialTasks = [
          {
            id: 'task_venue',
            title: `Book auspicious ${profile.occasion} venue in ${profile.city}`,
            category: 'venue',
            daysBeforeEvent: 90,
            targetDate: '',
            priority: 'critical',
            dependsOn: [],
            status: 'ready'
          },
          {
            id: 'task_caterer',
            title: 'Finalize catering menu and dietary tasting counters',
            category: 'catering',
            daysBeforeEvent: 60,
            targetDate: '',
            priority: 'high',
            dependsOn: ['task_venue'],
            status: 'locked'
          },
          {
            id: 'task_decor',
            title: `Approve decor & lighting theme (${profile.atmosphereTheme})`,
            category: 'decor',
            daysBeforeEvent: 45,
            targetDate: '',
            priority: 'high',
            dependsOn: ['task_venue'],
            status: 'locked'
          },
          {
            id: 'task_invites',
            title: 'Send digital and printed invitations to guests',
            category: 'invitations',
            daysBeforeEvent: 30,
            targetDate: '',
            priority: 'medium',
            dependsOn: ['task_venue'],
            status: 'locked'
          }
        ];
      }

      // Evaluate locks and target dates with pure logic
      const evaluatedTasks = evaluateTaskStatuses(initialTasks, profile.eventDate);

      const newState: EventState = {
        version: 1,
        id: `utsav_${Date.now()}`,
        profile,
        budget: initialBudget,
        timeline: {
          tasks: evaluatedTasks,
          eventDate: profile.eventDate,
          hasCycles: false,
          criticalPathTaskIds: []
        },
        vendorBriefs: {},
        quotes: [],
        changeLog: [
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            fieldChanged: 'custom',
            previousValue: null,
            newValue: 'Created event plan',
            reason: 'Initial setup',
            impactSummary: `Initialized ${profile.occasion} celebration plan with ₹${profile.totalBudgetINR.toLocaleString('en-IN')} budget.`
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      setEventState(newState);
      announce(`Event initialized with ${evaluatedTasks.length} timeline tasks generated.`);
    } catch (err: any) {
      const msg = err.message || 'Failed to initialize event.';
      setError(msg);
      announce(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [announce]);

  /**
   * Synchronous pure rebalancing: instantly updates all categories,
   * donut chart slices, per-guest amounts, and safety buffer with zero debounce.
   */
  const rebalanceCategoryBudget = useCallback((
    category: BudgetCategory,
    newPercentage: number
  ) => {
    setEventState(current => {
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
  }, [announce]);

  /**
   * Updates lastAiTradeoff in state
   */
  const setBudgetTradeoffAdvice = useCallback((tradeoff: {
    explanation: string;
    actionableOptions: string[];
    disclaimer: string;
  }) => {
    setEventState(current => {
      if (!current) return null;
      return {
        ...current,
        budget: {
          ...current.budget,
          lastAiTradeoff: tradeoff
        }
      };
    });
  }, []);

  /**
   * Interactive slider update: pure code instantly rebalances deltas,
   * then calls AI service to fetch trade-off explanation and options.
   */
  const updateSliderPercentage = useCallback(async (
    category: BudgetCategory,
    newPercentage: number,
    signal?: AbortSignal
  ) => {
    if (!eventState) return;

    // 1. Instant pure arithmetic rebalancing
    rebalanceCategoryBudget(category, newPercentage);

    // 2. Fetch AI trade-off analysis
    try {
      const tradeoff = await api.getBudgetTradeoffAdvice(eventState, category, newPercentage, signal);
      if (signal?.aborted) return;
      setBudgetTradeoffAdvice(tradeoff);
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) return;
      console.warn('AI budget tradeoff evaluation error:', err);
    }
  }, [eventState, rebalanceCategoryBudget, setBudgetTradeoffAdvice]);

  /**
   * Toggles task status (ready -> in_progress -> done)
   * and automatically unlocks dependent tasks using pure logic
   */
  const toggleTaskStatus = useCallback((taskId: string) => {
    setEventState(current => {
      if (!current) return null;

      const nextTasks = current.timeline.tasks.map(t => {
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
    setEventState(current => {
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
  const saveQuote = useCallback((quote: QuoteItem) => {
    setEventState(current => {
      if (!current) return null;
      return {
        ...current,
        quotes: [quote, ...current.quotes],
        lastUpdated: new Date().toISOString()
      };
    });
    announce(`Vendor quote parsed and saved for ${quote.vendorName}.`);
  }, [announce]);

  /**
   * Commits a dynamic in-flight change to budget, guests, or date,
   * deterministically recomputing values and logging to changeLog.
   */
  const commitDynamicChange = useCallback((
    changeType: 'budget' | 'guests' | 'date',
    newValue: string | number,
    reason: string,
    impactSummary: string
  ) => {
    setEventState(current => {
      if (!current) return null;

      let prevVal: unknown = null;
      let newProfile = { ...current.profile };
      let newBudget = { ...current.budget };
      let newTimeline = { ...current.timeline };

      if (changeType === 'budget') {
        prevVal = current.profile.totalBudgetINR;
        const num = Number(newValue);
        newProfile.totalBudgetINR = num;
        newBudget = recalculateBudgetForParameters(current.budget, num, current.profile.expectedGuests);
      } else if (changeType === 'guests') {
        prevVal = current.profile.expectedGuests;
        const num = Number(newValue);
        newProfile.expectedGuests = num;
        newBudget = recalculateBudgetForParameters(current.budget, current.profile.totalBudgetINR, num);
      } else if (changeType === 'date') {
        prevVal = current.profile.eventDate;
        const dateStr = String(newValue);
        newProfile.eventDate = dateStr;
        newTimeline.eventDate = dateStr;
        newTimeline.tasks = evaluateTaskStatuses(current.timeline.tasks, dateStr);
      }

      const logEntry: ChangeLogEntry = {
        id: `change_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fieldChanged: changeType,
        previousValue: prevVal,
        newValue,
        reason,
        impactSummary
      };

      return {
        ...current,
        profile: newProfile,
        budget: newBudget,
        timeline: newTimeline,
        changeLog: [logEntry, ...current.changeLog],
        lastUpdated: new Date().toISOString()
      };
    });
    announce(`In-flight change applied to ${changeType}. ${impactSummary || 'Updated parameters.'}`);
  }, [announce]);

  /**
   * 1-Click Undo for the last changeLog entry
   */
  const undoLastChange = useCallback(() => {
    setEventState(current => {
      if (!current || current.changeLog.length <= 1) return current;

      const [lastEntry, ...remainingLogs] = current.changeLog;
      if (lastEntry.previousValue === null || lastEntry.previousValue === undefined) {
        return current;
      }

      let newProfile = { ...current.profile };
      let newBudget = { ...current.budget };
      let newTimeline = { ...current.timeline };

      if (lastEntry.fieldChanged === 'budget') {
        const prevBudget = Number(lastEntry.previousValue);
        newProfile.totalBudgetINR = prevBudget;
        newBudget = recalculateBudgetForParameters(current.budget, prevBudget, current.profile.expectedGuests);
      } else if (lastEntry.fieldChanged === 'guests') {
        const prevGuests = Number(lastEntry.previousValue);
        newProfile.expectedGuests = prevGuests;
        newBudget = recalculateBudgetForParameters(current.budget, current.profile.totalBudgetINR, prevGuests);
      } else if (lastEntry.fieldChanged === 'date') {
        const prevDate = String(lastEntry.previousValue);
        newProfile.eventDate = prevDate;
        newTimeline.eventDate = prevDate;
        newTimeline.tasks = evaluateTaskStatuses(current.timeline.tasks, prevDate);
      }

      return {
        ...current,
        profile: newProfile,
        budget: newBudget,
        timeline: newTimeline,
        changeLog: remainingLogs,
        lastUpdated: new Date().toISOString()
      };
    });
    announce('Last change undone. Restored previous event state.');
  }, [announce]);

  /**
   * Loads an authentic Indian celebration demo profile and triggers LIVE AI generation
   */
  const loadDemoEvent = useCallback(async () => {
    // 6 months from today in YYYY-MM-DD
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 6);
    const dateStr = targetDate.toISOString().split('T')[0];

    const demoProfile: EventProfile = {
      occasion: 'wedding',
      title: "Ananya & Rohit's Royal Palace Wedding",
      totalBudgetINR: 3500000, // 35 Lakhs INR
      expectedGuests: 350,
      eventDate: dateStr,
      city: 'Udaipur, Rajasthan',
      atmosphereTheme: 'Royal Mewar Heritage & Marigold Splendour',
      culturalNeeds: [
        'Sundowner Mehendi with Folk Langa Musicians',
        'High-Energy Bollywood Sangeet Night',
        'Traditional Vedic Pheras at Sunset',
        'Formal Reception Dinner'
      ],
      dietaryNeeds: [
        'Dedicated 100% Pure Vegetarian Kitchen',
        'Jain Cuisine Counter (No onion/garlic/root vegetables)',
        'Traditional Rajasthani Thali live station'
      ],
      accessibilityNeeds: [
        'Wheelchair access & ramp to Mandap stage',
        'Golf cart buggy transport for grandparents across the palace grounds'
      ],
      mustHaves: [
        'Cinematic Drone & 4K Wedding Film',
        'Live Shehnai and Nagada players during Barat'
      ],
      priorities: ['Catering & Dining', 'Photography & Cinematic Video', 'Decor, Mandap & Lighting'],
      recommendations: {
        themes: [
          'Rajputana Royalty: Deep crimson, antique gold & raw silk drapes',
          'Marigold Sunset: Thousands of fresh marigold cascades with brass lamps',
          'Courtyard Sufi Night: Candlelit lanterns, scented jasmine & shamiana'
        ],
        menuDirections: [
          'Royal Mewari Banquet: Daal Baati Churma, Ker Sangri, and Gatte ki Sabzi',
          'Live Chaat Bazaar: Benarasi Tamatar Chaat, Dahi Puri & Kulhad Chai',
          'Artisanal Mithai Counter: Warm Jalebi with Rabdi and Malpua'
        ],
        decorIdeas: [
          'Floating Brass Urli with rose petals and diyas along the palace walkway',
          'Carved wooden mandap pillars adorned with tuberose (rajnigandha)'
        ],
        culturalNotes: [
          'Coordinate Barat arrival 45 minutes prior to twilight muhurat',
          'Ensure family elders have comfortable cushioned seating near the mandap'
        ]
      }
    };

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
