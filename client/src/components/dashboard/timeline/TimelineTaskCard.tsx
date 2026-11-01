import React from 'react';
import { TaskItem } from '@utsav/shared';
import { Flame, AlertTriangle } from 'lucide-react';
import { STATUS_CONFIG } from './timelineConstants.js';

interface TimelineTaskCardProps {
  task: TaskItem;
  allTasks: TaskItem[];
  onToggleStatus: (taskId: string) => void;
}

export const TimelineTaskCard: React.FC<TimelineTaskCardProps> = ({
  task,
  allTasks,
  onToggleStatus
}) => {
  const statusInfo = STATUS_CONFIG[task.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={`p-4 rounded-2xl bg-white border transition-all ${
        task.isCriticalPath
          ? 'border-l-4 border-l-red-500 border-utsav-cream-200 shadow-2xs'
          : 'border-utsav-cream-200 hover:border-utsav-cream-300'
      } ${task.status === 'locked' ? 'opacity-70 bg-utsav-cream-50/50' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Task Title and Badges */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-utsav-cream-900">{task.title}</span>

            {task.isCriticalPath && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                <Flame className="w-3 h-3 text-red-600" />
                <span>Critical Path</span>
              </span>
            )}

            {task.isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                <AlertTriangle className="w-3 h-3" />
                <span>Overdue</span>
              </span>
            )}

            {task.isAtRisk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                <span>At Risk (&le;3d)</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-utsav-cream-800">
            <span>
              Category: <strong className="capitalize">{task.category}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Target: <strong>{task.targetDate}</strong> ({task.daysBeforeEvent}d before)
            </span>
            <span>&bull;</span>
            <span className="capitalize">
              Priority: <strong>{task.priority}</strong>
            </span>
          </div>

          {/* Dependencies */}
          {task.dependsOn && task.dependsOn.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-utsav-cream-800">
              <span>Prerequisites:</span>
              {task.dependsOn.map((depId) => {
                const dep = allTasks.find((t) => t.id === depId);
                const isDepDone = dep?.status === 'done';
                return (
                  <span
                    key={depId}
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${
                      isDepDone
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                  >
                    {dep?.title || depId} {isDepDone ? '✓' : '🔒'}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Toggle Button */}
        <div className="flex-shrink-0">
          <button
            type="button"
            disabled={task.status === 'locked'}
            onClick={() => onToggleStatus(task.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              statusInfo.badge
            } ${task.status === 'locked' ? 'cursor-not-allowed opacity-60' : 'hover:shadow-xs'}`}
            title={
              task.status === 'locked'
                ? 'Locked until prerequisites are completed'
                : 'Click to advance status'
            }
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusInfo.label}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
