import { TaskItem, TaskStatus, TimelineState } from './types.js';

/**
 * Validates whether the dependency graph contains cycles.
 * Returns true if cycle exists, false otherwise.
 */
export function detectCycles(tasks: TaskItem[]): boolean {
  const adj = new Map<string, string[]>();
  for (const t of tasks) {
    adj.set(t.id, t.dependsOn || []);
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const t of tasks) {
    if (!visited.has(t.id)) {
      if (dfs(t.id)) return true;
    }
  }

  return false;
}

/**
 * Computes topological order of tasks (prerequisites first).
 * Throws an Error if a cycle is detected.
 */
export function topologicalSort(tasks: TaskItem[]): TaskItem[] {
  if (detectCycles(tasks)) {
    throw new Error('Cycle detected in task dependencies');
  }

  const inDegree = new Map<string, number>();
  const taskMap = new Map<string, TaskItem>();
  const dependents = new Map<string, string[]>();

  for (const t of tasks) {
    taskMap.set(t.id, t);
    inDegree.set(t.id, (t.dependsOn || []).length);
    for (const depId of t.dependsOn || []) {
      const list = dependents.get(depId) || [];
      list.push(t.id);
      dependents.set(depId, list);
    }
  }

  // Queue of tasks with 0 dependencies
  const queue: string[] = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  const sorted: TaskItem[] = [];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const item = taskMap.get(currentId);
    if (item) sorted.push(item);

    const children = dependents.get(currentId) || [];
    for (const childId of children) {
      const currentDeg = (inDegree.get(childId) || 1) - 1;
      inDegree.set(childId, currentDeg);
      if (currentDeg === 0) {
        queue.push(childId);
      }
    }
  }

  return sorted;
}

/**
 * Calculates ISO date string (YYYY-MM-DD) subtracted by given days
 */
export function subtractDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split('T')[0];
}

/**
 * Formats difference in days between two dates (dateA - dateB)
 */
export function daysDiff(isoDateA: string, isoDateB: string): number {
  const a = new Date(isoDateA).getTime();
  const b = new Date(isoDateB).getTime();
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

/**
 * Computes Critical Path task IDs in the DAG.
 * Critical path tasks are those on the longest dependency chain.
 */
export function computeCriticalPath(tasks: TaskItem[]): string[] {
  if (tasks.length === 0 || detectCycles(tasks)) {
    return [];
  }

  const taskMap = new Map<string, TaskItem>();
  for (const t of tasks) {
    taskMap.set(t.id, t);
  }

  // Longest path to node
  const memo = new Map<string, { length: number; path: string[] }>();

  function getLongestPath(taskId: string): { length: number; path: string[] } {
    if (memo.has(taskId)) return memo.get(taskId)!;

    const task = taskMap.get(taskId);
    if (!task || !task.dependsOn || task.dependsOn.length === 0) {
      const res = { length: 1, path: [taskId] };
      memo.set(taskId, res);
      return res;
    }

    let maxLen = 0;
    let maxPath: string[] = [];

    for (const depId of task.dependsOn) {
      if (taskMap.has(depId)) {
        const sub = getLongestPath(depId);
        if (sub.length > maxLen) {
          maxLen = sub.length;
          maxPath = sub.path;
        }
      }
    }

    const res = { length: maxLen + 1, path: [...maxPath, taskId] };
    memo.set(taskId, res);
    return res;
  }

  let longestOverallPath: string[] = [];
  for (const t of tasks) {
    const res = getLongestPath(t.id);
    if (res.path.length > longestOverallPath.length) {
      longestOverallPath = res.path;
    }
  }

  return longestOverallPath;
}

/**
 * Updates status and computed flags (locked, ready, overdue, atRisk, criticalPath) for all tasks
 */
export function evaluateTaskStatuses(
  tasks: TaskItem[],
  eventDate: string,
  currentDateIso: string = new Date().toISOString().split('T')[0]
): TaskItem[] {
  const criticalPathSet = new Set(computeCriticalPath(tasks));
  const doneSet = new Set(tasks.filter(t => t.status === 'done').map(t => t.id));

  return tasks.map(task => {
    // Check if all prerequisites are done
    const prereqs = task.dependsOn || [];
    const allPrereqsDone = prereqs.every(id => doneSet.has(id));

    let status: TaskStatus = task.status;
    if (status !== 'done') {
      if (!allPrereqsDone) {
        status = 'locked';
      } else if (status === 'locked') {
        status = 'ready';
      }
    }

    // Compute targetDate if missing or out of sync
    const targetDate = subtractDays(eventDate, task.daysBeforeEvent);
    const diffToToday = daysDiff(targetDate, currentDateIso);
    
    const isOverdue = status !== 'done' && diffToToday < 0;
    const isAtRisk = status !== 'done' && !isOverdue && diffToToday <= 3;
    const isCriticalPath = criticalPathSet.has(task.id);

    return {
      ...task,
      targetDate,
      status,
      isOverdue,
      isAtRisk,
      isCriticalPath
    };
  });
}

/**
 * Shifts timeline to a new event date, recomputes target deadlines deterministically,
 * and identifies tasks that have fallen into the past.
 */
export function shiftTimelineDate(
  timeline: TimelineState,
  newEventDate: string,
  currentDateIso: string = new Date().toISOString().split('T')[0]
): {
  updatedTimeline: TimelineState;
  unrealisticTaskIds: string[];
  daysShifted: number;
} {
  const previousDate = timeline.eventDate;
  const daysShifted = daysDiff(newEventDate, previousDate);

  const recomputedTasks = timeline.tasks.map(t => {
    const newTargetDate = subtractDays(newEventDate, t.daysBeforeEvent);
    return {
      ...t,
      targetDate: newTargetDate
    };
  });

  const evaluated = evaluateTaskStatuses(recomputedTasks, newEventDate, currentDateIso);
  const unrealisticTaskIds = evaluated
    .filter(t => t.status !== 'done' && daysDiff(t.targetDate, currentDateIso) < 0)
    .map(t => t.id);

  const criticalPathTaskIds = computeCriticalPath(evaluated);

  return {
    updatedTimeline: {
      ...timeline,
      eventDate: newEventDate,
      tasks: evaluated,
      criticalPathTaskIds
    },
    unrealisticTaskIds,
    daysShifted
  };
}
