import React from 'react';
import { Check } from 'lucide-react';
import * as api from '../../../services/api.js';

interface ChangeEvaluationPreviewProps {
  evaluationResult: api.DynamicChangeImpactResult;
  changeType: 'budget' | 'guests' | 'date';
  onDiscard: () => void;
  onCommit: () => void;
}

export const ChangeEvaluationPreview: React.FC<ChangeEvaluationPreviewProps> = ({
  evaluationResult,
  changeType,
  onDiscard,
  onCommit
}) => {
  return (
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
            {changeType === 'budget'
              ? `₹${Number(evaluationResult.oldValue).toLocaleString('en-IN')}`
              : String(evaluationResult.oldValue)}
          </span>
        </div>
        <div>
          <span className="font-semibold text-utsav-cream-800 block mb-0.5">New Target Value:</span>
          <span className="text-sm font-bold text-emerald-700">
            {changeType === 'budget'
              ? `₹${Number(evaluationResult.newValue).toLocaleString('en-IN')}`
              : String(evaluationResult.newValue)}
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
      {evaluationResult.advice?.suggestedActionItems &&
        evaluationResult.advice.suggestedActionItems.length > 0 && (
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
          onClick={onDiscard}
          className="px-4 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 rounded-xl cursor-pointer"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onCommit}
          className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
        >
          Confirm & Commit Change to Plan
        </button>
      </div>
    </div>
  );
};
