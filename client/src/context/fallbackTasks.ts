import { EventProfile, TaskItem } from '@utsav/shared';

/**
 * Creates fallback starter tasks when AI task generation fails or is offline.
 */
export function createFallbackStarterTasks(profile: EventProfile): TaskItem[] {
  return [
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
