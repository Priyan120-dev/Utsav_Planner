import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext.js';
import { TaskStatus } from '@utsav/shared';
import * as api from '../../services/api.js';
import {
  CheckCircle2,
  Lock,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton.js';
import { ErrorAlert } from '../common/ErrorAlert.js';

const STATUS_CONFIG: Record<TaskStatus, { label: string; badge: string; icon: any }> = {
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

export const TimelineTab: React.FC = () => {
  const { eventState, toggleTaskStatus, commitDynamicChange } = useEvent();

  // Filter state
  const [filter, setFilter] = useState<'all' | 'critical' | 'ready' | 'locked' | 'done'>('all');

  // Date Shift Simulation Modal State
  const [isSimulatingDate, setIsSimulatingDate] = useState<boolean>(false);
  const [newSimulatedDate, setNewSimulatedDate] = useState<string>(() =>
    eventState ? eventState.timeline.eventDate : ''
  );
  const [isDateShifting, setIsDateShifting] = useState<boolean>(false);
  const [dateShiftResult, setDateShiftResult] = useState<any>(null);
  const [shiftError, setShiftError] = useState<string | null>(null);

  const handleSimulateDateShift = async () => {
    if (!eventState || !newSimulatedDate || newSimulatedDate === eventState.timeline.eventDate)
      return;
    setIsDateShifting(true);
    setShiftError(null);

    try {
      const res = await api.analyzeDateShiftImpact(eventState, newSimulatedDate);
      setDateShiftResult(res);
    } catch (err: any) {
      setShiftError(err.message || 'Failed to simulate date shift impact.');
    } finally {
      setIsDateShifting(false);
    }
  };

  const handleApplyDateShift = () => {
    if (!dateShiftResult || !newSimulatedDate) return;
    const days = dateShiftResult.daysShifted;
    const direction = days < 0 ? 'Preponed' : 'Postponed';
    const summary =
      dateShiftResult.advice?.compressionAdvice ||
      `${direction} celebration by ${Math.abs(days)} days to ${newSimulatedDate}.`;
    commitDynamicChange(
      'date',
      newSimulatedDate,
      `Timeline date shift (${direction} by ${Math.abs(days)} days)`,
      summary
    );
    setIsSimulatingDate(false);
    setDateShiftResult(null);
  };

  if (!eventState) return null;

  const { timeline } = eventState;
  const tasks = timeline.tasks;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'critical') return t.isCriticalPath;
    if (filter === 'ready') return t.status === 'ready';
    if (filter === 'locked') return t.status === 'locked';
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-utsav-cream-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-utsav-cream-900 font-display">
              Sequenced Timeline & Dependent Tasks
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-utsav-saffron-100 text-utsav-saffron-800">
              {tasks.filter((t) => t.status === 'done').length}/{tasks.length} Completed
            </span>
          </div>
          <p className="text-xs text-utsav-cream-800 mt-1">
            Tasks are locked until dependencies are done &bull; Deadlines computed deterministically
            from {timeline.eventDate}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsSimulatingDate(true);
            setDateShiftResult(null);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-utsav-saffron-50 text-utsav-saffron-800 border border-utsav-saffron-200 hover:bg-utsav-saffron-100 transition-colors cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-utsav-saffron-600" />
          <span>Simulate Date Shift (Diff)</span>
        </button>
      </div>

      {/* Date Shift Impact Drawer / Modal */}
      {isSimulatingDate && (
        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>Simulate Moving Event Date (Compress/Extend Timeline)</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsSimulatingDate(false)}
              className="text-xs text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-amber-900">
            Current Date: <strong>{timeline.eventDate}</strong>. Choose a new date to see
            deterministic deadline recomputation and AI compression advice:
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={newSimulatedDate}
              onChange={(e) => setNewSimulatedDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white rounded-xl border border-amber-300 text-amber-950 font-semibold focus:ring-1 focus:ring-utsav-saffron-500"
            />
            <button
              type="button"
              onClick={handleSimulateDateShift}
              disabled={isDateShifting || newSimulatedDate === timeline.eventDate}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-utsav-saffron-600 text-white rounded-xl hover:bg-utsav-saffron-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDateShifting ? 'Analyzing Impact...' : 'Evaluate Impact'}</span>
            </button>
          </div>

          {shiftError && <ErrorAlert message={shiftError} onDismiss={() => setShiftError(null)} />}

          {isDateShifting && (
            <LoadingSkeleton
              lines={2}
              label="Recomputing deadlines in code & querying Gemini for compression advice..."
            />
          )}

          {dateShiftResult && (
            <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-utsav-cream-900">
                <span>Shift Delta: {dateShiftResult.daysShifted} days</span>
                {dateShiftResult.daysShifted < 0 ? (
                  <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded text-[10px]">
                    Preponed / Compressed
                  </span>
                ) : (
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                    Postponed / Extended
                  </span>
                )}
              </div>

              <div className="text-utsav-cream-900 leading-relaxed">
                <strong>Compression Advice:</strong> {dateShiftResult.advice?.compressionAdvice}
              </div>

              {dateShiftResult.unrealisticTaskIds?.length > 0 && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900">
                  <span className="font-bold block mb-1">
                    ⚠️ {dateShiftResult.unrealisticTaskIds.length} Tasks with tight or expired
                    deadlines:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {dateShiftResult.unrealisticTaskIds.map((id: string) => {
                      const t = tasks.find((item) => item.id === id);
                      return <li key={id}>{t?.title || id}</li>;
                    })}
                  </ul>
                </div>
              )}

              {dateShiftResult.advice?.suggestedDrops?.length > 0 && (
                <div className="p-2.5 rounded-lg bg-utsav-saffron-50 border border-utsav-saffron-200 text-utsav-saffron-950">
                  <span className="font-bold block mb-1">
                    Recommended Items to Compress or Drop:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {dateShiftResult.advice.suggestedDrops.map((drop: string, idx: number) => (
                      <li key={idx}>{drop}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsSimulatingDate(false);
                    setDateShiftResult(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-amber-300 text-amber-900 bg-white hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyDateShift}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm and apply shift to plan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'critical', 'ready', 'locked', 'done'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              filter === tab
                ? 'bg-utsav-saffron-600 text-white shadow-2xs'
                : 'bg-white text-utsav-cream-800 border border-utsav-cream-200 hover:bg-utsav-cream-50'
            }`}
          >
            {tab === 'all' ? 'All Tasks' : tab === 'critical' ? '🔥 Critical Path' : tab}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-utsav-cream-200 text-utsav-cream-800 text-xs">
            No tasks match the selected filter.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const statusInfo = STATUS_CONFIG[task.status];
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={task.id}
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
                          const dep = tasks.find((t) => t.id === depId);
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
                      onClick={() => toggleTaskStatus(task.id)}
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
          })
        )}
      </div>
    </div>
  );
};
