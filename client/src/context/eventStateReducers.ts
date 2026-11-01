import {
  EventState,
  EventProfile,
  BudgetState,
  TaskItem,
  ChangeLogEntry,
  recalculateBudgetForParameters,
  evaluateTaskStatuses
} from '@utsav/shared';

/**
 * Creates the initial fresh EventState upon onboarding completion.
 */
export function createInitialEventState(
  profile: EventProfile,
  initialBudget: BudgetState,
  evaluatedTasks: TaskItem[]
): EventState {
  return {
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
}

/**
 * Pure state transition for in-flight parameter changes (budget, guests, date).
 */
export function applyDynamicChange(
  current: EventState,
  changeType: 'budget' | 'guests' | 'date',
  newValue: string | number,
  reason: string,
  impactSummary: string
): EventState {
  let prevVal: unknown = null;
  const newProfile = { ...current.profile };
  let newBudget = { ...current.budget };
  const newTimeline = { ...current.timeline };

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
}

/**
 * Pure state transition to undo the last logged change.
 */
export function applyUndoLastChange(current: EventState): EventState {
  if (current.changeLog.length <= 1) return current;

  const [lastEntry, ...remainingLogs] = current.changeLog;
  if (lastEntry.previousValue === null || lastEntry.previousValue === undefined) {
    return current;
  }

  const newProfile = { ...current.profile };
  let newBudget = { ...current.budget };
  const newTimeline = { ...current.timeline };

  if (lastEntry.fieldChanged === 'budget') {
    const prevBudget = Number(lastEntry.previousValue);
    newProfile.totalBudgetINR = prevBudget;
    newBudget = recalculateBudgetForParameters(
      current.budget,
      prevBudget,
      current.profile.expectedGuests
    );
  } else if (lastEntry.fieldChanged === 'guests') {
    const prevGuests = Number(lastEntry.previousValue);
    newProfile.expectedGuests = prevGuests;
    newBudget = recalculateBudgetForParameters(
      current.budget,
      current.profile.totalBudgetINR,
      prevGuests
    );
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
}
