import { describe, it, expect } from 'vitest';
import {
  detectCycles,
  topologicalSort,
  subtractDays,
  computeCriticalPath,
  evaluateTaskStatuses,
  shiftTimelineDate,
  TaskItem,
  TimelineState
} from '@utsav/shared';

describe('Timeline Pure Logic', () => {
  const sampleTasks: TaskItem[] = [
    {
      id: 'task_venue',
      title: 'Book Auspicious Banquet Venue',
      category: 'venue',
      daysBeforeEvent: 90,
      targetDate: '2026-08-01',
      priority: 'critical',
      dependsOn: [],
      status: 'done'
    },
    {
      id: 'task_decor',
      title: 'Finalize Mandap Theme & Floral Mockup',
      category: 'decor',
      daysBeforeEvent: 45,
      targetDate: '2026-09-15',
      priority: 'high',
      dependsOn: ['task_venue'],
      status: 'ready'
    },
    {
      id: 'task_catering',
      title: 'Menu Tasting & Chef Selection',
      category: 'catering',
      daysBeforeEvent: 30,
      targetDate: '2026-09-30',
      priority: 'high',
      dependsOn: ['task_venue'],
      status: 'locked'
    },
    {
      id: 'task_invites',
      title: 'Send Digital & Printed Invites',
      category: 'invitations',
      daysBeforeEvent: 20,
      targetDate: '2026-10-10',
      priority: 'medium',
      dependsOn: ['task_decor'],
      status: 'locked'
    }
  ];

  it('detects cycles correctly in dependency graphs', () => {
    expect(detectCycles(sampleTasks)).toBe(false);

    // Create a circular dependency: A -> B -> A
    const cyclicTasks: TaskItem[] = [
      { ...sampleTasks[0], dependsOn: ['task_decor'] },
      { ...sampleTasks[1], dependsOn: ['task_venue'] }
    ];

    expect(detectCycles(cyclicTasks)).toBe(true);
  });

  it('topologically sorts tasks with prerequisites first', () => {
    const sorted = topologicalSort(sampleTasks);
    const order = sorted.map((t) => t.id);

    // task_venue must come before task_decor and task_catering
    expect(order.indexOf('task_venue')).toBeLessThan(order.indexOf('task_decor'));
    expect(order.indexOf('task_venue')).toBeLessThan(order.indexOf('task_catering'));
    // task_decor must come before task_invites
    expect(order.indexOf('task_decor')).toBeLessThan(order.indexOf('task_invites'));
  });

  it('calculates target dates correctly subtracting daysBeforeEvent from event date', () => {
    const eventDate = '2026-12-31';
    expect(subtractDays(eventDate, 0)).toBe('2026-12-31');
    expect(subtractDays(eventDate, 10)).toBe('2026-12-21');
    expect(subtractDays(eventDate, 60)).toBe('2026-11-01');
  });

  it('identifies critical path task chain', () => {
    const criticalPath = computeCriticalPath(sampleTasks);
    // Longest chain is task_venue -> task_decor -> task_invites (length 3)
    expect(criticalPath).toEqual(['task_venue', 'task_decor', 'task_invites']);
  });

  it('locks tasks whose prerequisites are incomplete and unlocks when done', () => {
    const evaluated = evaluateTaskStatuses(sampleTasks, '2026-10-30', '2026-07-01');

    const venue = evaluated.find((t) => t.id === 'task_venue');
    const decor = evaluated.find((t) => t.id === 'task_decor');
    const invites = evaluated.find((t) => t.id === 'task_invites');

    expect(venue?.status).toBe('done');
    // Since venue is done, decor (which depends only on venue) is ready
    expect(decor?.status).toBe('ready');
    // Invites depends on decor (which is ready, not done), so invites is locked
    expect(invites?.status).toBe('locked');
  });

  it('recomputes deadlines and identifies unrealistic tasks on date shift', () => {
    const timeline: TimelineState = {
      tasks: sampleTasks,
      eventDate: '2026-12-01',
      hasCycles: false,
      criticalPathTaskIds: []
    };

    // Prepone event date drastically to next week
    const { updatedTimeline, unrealisticTaskIds, daysShifted } = shiftTimelineDate(
      timeline,
      '2026-07-10',
      '2026-07-01'
    );

    expect(daysShifted).toBeLessThan(0);
    expect(updatedTimeline.eventDate).toBe('2026-07-10');

    // Tasks needing 90 or 45 days before July 10 will fall into May or June (in the past relative to July 1)
    expect(unrealisticTaskIds.length).toBeGreaterThan(0);
  });
});
