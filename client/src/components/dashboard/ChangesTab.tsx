import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext.js';
import * as api from '../../services/api.js';
import { 
  History, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  Calendar, 
  Users, 
  IndianRupee 
} from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton.js';
import { ErrorAlert } from '../common/ErrorAlert.js';

interface ChangesTabProps {
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const ChangesTab: React.FC<ChangesTabProps> = ({ onCloseModal }) => {
  const { eventState, commitDynamicChange, undoLastChange } = useEvent();
  if (!eventState) return null;

  const { profile, changeLog } = eventState;

  // Change Form State
  const [changeType, setChangeType] = useState<'budget' | 'guests' | 'date'>('guests');
  const [newValue, setNewValue] = useState<string | number>(profile.expectedGuests + 50);
  const [reason, setReason] = useState<string>('Expanded family and outstation guest list');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Evaluate Change Impact Preview
  const handleEvaluateChange = async () => {
    setIsEvaluating(true);
    setEvalError(null);

    try {
      const res = await api.assessDynamicChangeImpact(
        eventState,
        changeType,
        newValue,
        reason
      );
      setEvaluationResult(res);
    } catch (err: any) {
      setEvalError(err.message || 'Failed to evaluate change impact.');
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
            Life happens mid-planning: change guests, dates, or budgets. The system deterministically updates math and generates strategic impact diffs.
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

        <div role="radiogroup" aria-label="Adjustment category" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <span className="text-[11px] text-utsav-cream-800">Currently: {profile.expectedGuests}</span>
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
              <span className="text-[11px] text-utsav-cream-800">Currently: ₹{(profile.totalBudgetINR / 100000).toFixed(1)}L</span>
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
              <span className="text-[11px] text-utsav-cream-800">Currently: {profile.eventDate}</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="adjustment-value-input" className="block text-xs font-bold text-utsav-cream-900 mb-1">
              {changeType === 'guests' ? 'New Guest Count:' : changeType === 'budget' ? 'New Total Budget (₹ INR):' : 'New Event Date:'}
            </label>
            {changeType === 'date' ? (
              <input
                id="adjustment-value-input"
                type="date"
                aria-label="New event date"
                value={String(newValue)}
                onChange={e => setNewValue(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
              />
            ) : (
              <input
                id="adjustment-value-input"
                type="number"
                aria-label={changeType === 'guests' ? 'New guest count' : 'New total budget in rupees'}
                value={Number(newValue)}
                onChange={e => setNewValue(Number(e.target.value))}
                className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
              />
            )}
          </div>

          <div>
            <label htmlFor="adjustment-reason-input" className="block text-xs font-bold text-utsav-cream-900 mb-1">
              Reason for Adjustment:
            </label>
            <input
              id="adjustment-reason-input"
              type="text"
              aria-label="Reason for adjustment"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Added outstation relatives, venue availability shifted..."
              className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
            />
          </div>
        </div>

        {evalError && <ErrorAlert message={evalError} onDismiss={() => setEvalError(null)} />}

        {isEvaluating ? (
          <LoadingSkeleton lines={2} label="Recomputing budget math, deadlines, and querying Gemini for strategic advice..." />
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
          <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 space-y-4">
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Impact Diff Preview (Review Before Confirming)</span>
            </h4>

            {/* Before/After Diff */}
            <div className="grid grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-amber-200 text-xs">
              <div>
                <span className="font-semibold text-utsav-cream-800 block mb-0.5">Previous Value:</span>
                <span className="text-sm font-bold text-red-700">
                  {changeType === 'budget' ? `₹${Number(evaluationResult.oldValue).toLocaleString('en-IN')}` : String(evaluationResult.oldValue)}
                </span>
              </div>
              <div>
                <span className="font-semibold text-utsav-cream-800 block mb-0.5">New Target Value:</span>
                <span className="text-sm font-bold text-emerald-700">
                  {changeType === 'budget' ? `₹${Number(evaluationResult.newValue).toLocaleString('en-IN')}` : String(evaluationResult.newValue)}
                </span>
              </div>
            </div>

            {/* AI Strategic Advice */}
            <div className="space-y-2 text-xs text-amber-950">
              <div className="leading-relaxed">
                <strong>Executive Summary:</strong> {evaluationResult.advice?.impactSummary}
              </div>
              <div className="leading-relaxed">
                <strong>Budget Guidance:</strong> {evaluationResult.advice?.budgetAdvice}
              </div>
              <div className="leading-relaxed">
                <strong>Vendor Negotiation Advice:</strong> {evaluationResult.advice?.vendorAdvice}
              </div>
            </div>

            {/* Action Items */}
            {evaluationResult.advice?.suggestedActionItems?.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider block mb-1">
                  Immediate Checklist Items:
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
                  {evaluationResult.advice.suggestedActionItems.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEvaluationResult(null)}
                className="px-4 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 rounded-xl cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleCommitChange}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
              >
                Confirm & Commit Change to Plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Audit History Log */}
      <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
          <History className="w-4 h-4 text-utsav-saffron-600" />
          <span>ChangeLog Audit Trail ({changeLog.length} events)</span>
        </h3>

        <div className="space-y-3">
          {changeLog.map((entry, index) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-xl border border-utsav-cream-200 bg-utsav-cream-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-utsav-cream-900 capitalize">
                    {entry.fieldChanged === 'custom' ? 'Plan Event' : `Changed ${entry.fieldChanged}`}
                  </span>
                  <span className="text-[10px] text-utsav-cream-800">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-utsav-cream-800">{entry.impactSummary}</p>
                <span className="text-[11px] text-utsav-cream-800 italic block">
                  Reason: {entry.reason}
                </span>
              </div>

              {index === 0 && changeLog.length > 1 && (
                <button
                  type="button"
                  onClick={undoLastChange}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 cursor-pointer flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
