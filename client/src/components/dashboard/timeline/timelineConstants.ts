import React from 'react';
import { TaskStatus } from '@utsav/shared';
import { CheckCircle2, Clock, ChevronRight, Lock } from 'lucide-react';

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  done: {
    label: 'Done',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle2
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Clock
  },
  ready: {
    label: 'Ready to Start',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: ChevronRight
  },
  locked: {
    label: 'Locked (Prereqs Pending)',
    badge: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: Lock
  }
};
