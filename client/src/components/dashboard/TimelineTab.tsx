import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext.js';
import * as api from '../../services/api.js';
import { Calendar } from 'lucide-react';
import { DateShiftModal } from './timeline/DateShiftModal.js';
import { TimelineTaskCard } from './timeline/TimelineTaskCard.js';

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
  const [dateShiftResult, setDateShiftResult] = useState<api.DateShiftImpactResult | null>(null);
  const [shiftError, setShiftError] = useState<string | null>(null);

  const handleSimulateDateShift = async () => {
    if (!eventState || !newSimulatedDate || newSimulatedDate === eventState.timeline.eventDate)
      return;

    setIsDateShifting(true);
    setShiftError(null);

    try {
      const result = await api.analyzeDateShiftImpact(eventState, newSimulatedDate);
      setDateShiftResult(result);
    } catch (err: unknown) {
      setShiftError(
        err instanceof Error && err.message ? err.message : 'Failed to analyze date shift impact.'
      );
    } finally {
      setIsDateShifting(false);
    }
  };

  const handleApplyDateShift = () => {
    if (!dateShiftResult) return;
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
            setNewSimulatedDate(timeline.eventDate);
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
        <DateShiftModal
          currentEventDate={timeline.eventDate}
          newSimulatedDate={newSimulatedDate}
          setNewSimulatedDate={setNewSimulatedDate}
          isDateShifting={isDateShifting}
          shiftError={shiftError}
          onDismissError={() => setShiftError(null)}
          dateShiftResult={dateShiftResult}
          allTasks={tasks}
          onClose={() => setIsSimulatingDate(false)}
          onSimulate={handleSimulateDateShift}
          onApply={handleApplyDateShift}
        />
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
          filteredTasks.map((task) => (
            <TimelineTaskCard
              key={task.id}
              task={task}
              allTasks={tasks}
              onToggleStatus={toggleTaskStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};
