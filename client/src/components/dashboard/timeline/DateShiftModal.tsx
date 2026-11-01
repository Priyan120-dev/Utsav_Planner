import React from 'react';
import { TaskItem } from '@utsav/shared';
import { Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import * as api from '../../../services/api.js';
import { LoadingSkeleton } from '../../common/LoadingSkeleton.js';
import { ErrorAlert } from '../../common/ErrorAlert.js';

interface DateShiftModalProps {
  currentEventDate: string;
  newSimulatedDate: string;
  setNewSimulatedDate: (date: string) => void;
  isDateShifting: boolean;
  shiftError: string | null;
  onDismissError: () => void;
  dateShiftResult: api.DateShiftImpactResult | null;
  allTasks: TaskItem[];
  onClose: () => void;
  onSimulate: () => void;
  onApply: () => void;
}

export const DateShiftModal: React.FC<DateShiftModalProps> = ({
  currentEventDate,
  newSimulatedDate,
  setNewSimulatedDate,
  isDateShifting,
  shiftError,
  onDismissError,
  dateShiftResult,
  allTasks,
  onClose,
  onSimulate,
  onApply
}) => {
  return (
    <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-700" />
          <span>Simulate Moving Event Date (Compress/Extend Timeline)</span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-amber-800 hover:text-amber-950 underline cursor-pointer"
        >
          Close
        </button>
      </div>

      <p className="text-xs text-amber-900">
        Current Date: <strong>{currentEventDate}</strong>. Choose a new date to see deterministic
        deadline recomputation and AI compression advice:
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={newSimulatedDate}
          onChange={(e) => setNewSimulatedDate(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl bg-white border border-amber-300 font-semibold text-amber-950 focus:ring-1 focus:ring-amber-500"
        />

        <button
          type="button"
          disabled={isDateShifting || newSimulatedDate === currentEventDate}
          onClick={onSimulate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isDateShifting ? 'Analyzing Impact...' : 'Evaluate Impact'}</span>
        </button>
      </div>

      {shiftError && <ErrorAlert message={shiftError} onDismiss={onDismissError} />}

      {isDateShifting && (
        <LoadingSkeleton
          lines={3}
          label="Re-evaluating dependency chains, shifted deadlines, and AI timeline compression suggestions..."
        />
      )}

      {dateShiftResult && !isDateShifting && (
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

          {dateShiftResult.unrealisticTaskIds && dateShiftResult.unrealisticTaskIds.length > 0 && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900">
              <span className="font-bold block mb-1">
                ⚠️ {dateShiftResult.unrealisticTaskIds.length} Tasks with tight or expired
                deadlines:
              </span>
              <ul className="list-disc list-inside space-y-0.5">
                {dateShiftResult.unrealisticTaskIds.map((id: string) => {
                  const t = allTasks.find((item) => item.id === id);
                  return <li key={id}>{t?.title || id}</li>;
                })}
              </ul>
            </div>
          )}

          {dateShiftResult.advice?.suggestedDrops &&
            dateShiftResult.advice.suggestedDrops.length > 0 && (
              <div className="p-2.5 rounded-lg bg-utsav-saffron-50 border border-utsav-saffron-200 text-utsav-saffron-950">
                <span className="font-bold block mb-1">Recommended Items to Compress or Drop:</span>
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
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-amber-300 text-amber-900 bg-white hover:bg-amber-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm and apply shift to plan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
