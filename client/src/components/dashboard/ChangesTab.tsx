import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext.js';
import * as api from '../../services/api.js';
import { RotateCcw, AlertTriangle, Sparkles, Calendar, Users, IndianRupee } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton.js';
import { ErrorAlert } from '../common/ErrorAlert.js';
import { ChangeEvaluationPreview } from './changes/ChangeEvaluationPreview.js';
import { ChangeLogList } from './changes/ChangeLogList.js';

interface ChangesTabProps {
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const ChangesTab: React.FC<ChangesTabProps> = ({ onCloseModal }) => {
  const { eventState, commitDynamicChange, undoLastChange } = useEvent();

  // Change Form State (hooks declared at top level)
  const [changeType, setChangeType] = useState<'budget' | 'guests' | 'date'>('guests');
  const [newValue, setNewValue] = useState<string | number>(() =>
    eventState ? eventState.profile.expectedGuests + 50 : 50
  );
  const [reason, setReason] = useState<string>('Expanded family and outstation guest list');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<api.DynamicChangeImpactResult | null>(
    null
  );
  const [evalError, setEvalError] = useState<string | null>(null);

  // Evaluate Change Impact Preview
  const handleEvaluateChange = async () => {
    if (!eventState) return;
    setIsEvaluating(true);
    setEvalError(null);

    try {
      const res = await api.assessDynamicChangeImpact(eventState, changeType, newValue, reason);
      setEvaluationResult(res);
    } catch (err: unknown) {
      setEvalError(
        err instanceof Error && err.message ? err.message : 'Failed to evaluate change impact.'
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  // Confirm and Commit Change
  const handleCommitChange = () => {
    if (!evaluationResult) return;
    commitDynamicChange(
      changeType,
      newValue,
      reason,
      evaluationResult.advice?.impactSummary || 'Updated parameters'
    );
    setEvaluationResult(null);
    if (onCloseModal) onCloseModal();
  };

  if (!eventState) return null;

  const { profile, changeLog } = eventState;

  return (
    <div className="space-y-6">
      {/* Top Banner and Undo Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-utsav-cream-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-utsav-cream-900 font-display">
              Resilience to Dynamic In-Flight Changes
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-utsav-saffron-100 text-utsav-saffron-800">
              No Restart Required
            </span>
          </div>
          <p className="text-xs text-utsav-cream-800 mt-1">
            Life happens mid-planning: change guests, dates, or budgets. The system
            deterministically updates math and generates strategic impact diffs.
          </p>
        </div>

        {changeLog.length > 1 && (
          <button
            type="button"
            onClick={undoLastChange}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
            title="Restore the state prior to the last confirmed change"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Last Change</span>
          </button>
        )}
      </div>

      {/* "Something Changed" Interactive Form */}
      <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-utsav-saffron-600" />
          <span>Apply an In-Flight Adjustment ("Something Changed")</span>
        </h3>

        <div
          role="radiogroup"
          aria-label="Adjustment category"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <button
            type="button"
            role="radio"
            aria-checked={changeType === 'guests'}
            onClick={() => {
              setChangeType('guests');
              setNewValue(profile.expectedGuests + 50);
            }}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-utsav-saffron-500 focus:ring-offset-2 ${
              changeType === 'guests'
                ? 'border-utsav-saffron-600 bg-utsav-saffron-50 text-utsav-saffron-950 font-semibold'
                : 'border-utsav-cream-200 hover:bg-utsav-cream-50 text-utsav-cream-800'
            }`}
          >
            <Users className="w-4 h-4 text-utsav-saffron-600" aria-hidden="true" />
            <div className="text-xs">
              <span className="block font-bold">Update Guest Count</span>
              <span className="text-[11px] text-utsav-cream-800">
                Currently: {profile.expectedGuests}
              </span>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={changeType === 'budget'}
            onClick={() => {
              setChangeType('budget');
              setNewValue(profile.totalBudgetINR + 500000);
            }}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-utsav-saffron-500 focus:ring-offset-2 ${
              changeType === 'budget'
                ? 'border-utsav-saffron-600 bg-utsav-saffron-50 text-utsav-saffron-950 font-semibold'
                : 'border-utsav-cream-200 hover:bg-utsav-cream-50 text-utsav-cream-800'
            }`}
          >
            <IndianRupee className="w-4 h-4 text-utsav-saffron-600" aria-hidden="true" />
            <div className="text-xs">
              <span className="block font-bold">Update Budget</span>
              <span className="text-[11px] text-utsav-cream-800">
                Currently: ₹{(profile.totalBudgetINR / 100000).toFixed(1)}L
              </span>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={changeType === 'date'}
            onClick={() => {
              setChangeType('date');
              setNewValue(profile.eventDate);
            }}
            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-utsav-saffron-500 focus:ring-offset-2 ${
              changeType === 'date'
                ? 'border-utsav-saffron-600 bg-utsav-saffron-50 text-utsav-saffron-950 font-semibold'
                : 'border-utsav-cream-200 hover:bg-utsav-cream-50 text-utsav-cream-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-utsav-saffron-600" aria-hidden="true" />
            <div className="text-xs">
              <span className="block font-bold">Update Event Date</span>
              <span className="text-[11px] text-utsav-cream-800">
                Currently: {profile.eventDate}
              </span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label
              htmlFor="adjustment-value-input"
              className="block text-xs font-bold text-utsav-cream-900 mb-1"
            >
              {changeType === 'guests'
                ? 'New Guest Count:'
                : changeType === 'budget'
                  ? 'New Total Budget (₹ INR):'
                  : 'New Event Date:'}
            </label>
            {changeType === 'date' ? (
              <input
                id="adjustment-value-input"
                type="date"
                aria-label="New event date"
                value={String(newValue)}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
              />
            ) : (
              <input
                id="adjustment-value-input"
                type="number"
                aria-label={
                  changeType === 'guests' ? 'New guest count' : 'New total budget in rupees'
                }
                value={Number(newValue)}
                onChange={(e) => setNewValue(Number(e.target.value))}
                className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
              />
            )}
          </div>

          <div>
            <label
              htmlFor="adjustment-reason-input"
              className="block text-xs font-bold text-utsav-cream-900 mb-1"
            >
              Reason for Adjustment:
            </label>
            <input
              id="adjustment-reason-input"
              type="text"
              aria-label="Reason for adjustment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Added outstation relatives, venue availability shifted..."
              className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
            />
          </div>
        </div>

        {evalError && <ErrorAlert message={evalError} onDismiss={() => setEvalError(null)} />}

        {isEvaluating ? (
          <LoadingSkeleton
            lines={2}
            label="Recomputing budget math, deadlines, and querying Gemini for strategic advice..."
          />
        ) : (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleEvaluateChange}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluate Impact Diff</span>
            </button>
          </div>
        )}

        {/* Evaluation Diff & Confirmation */}
        {evaluationResult && (
          <ChangeEvaluationPreview
            evaluationResult={evaluationResult}
            changeType={changeType}
            onDiscard={() => setEvaluationResult(null)}
            onCommit={handleCommitChange}
          />
        )}
      </div>

      {/* Section 2: Audit History Log */}
      <ChangeLogList changeLog={changeLog} onUndoLastChange={undoLastChange} />
    </div>
  );
};
