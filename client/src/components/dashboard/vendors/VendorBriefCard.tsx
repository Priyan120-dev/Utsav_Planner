import React from 'react';
import { BudgetCategory, VendorBrief } from '@utsav/shared';
import { FileText, Sparkles, HelpCircle } from 'lucide-react';
import { LoadingSkeleton } from '../../common/LoadingSkeleton.js';
import { ErrorAlert } from '../../common/ErrorAlert.js';

interface VendorBriefCardProps {
  categoryLabel: string;
  selectedCategory: BudgetCategory;
  allocatedBudget: number;
  activeBrief: VendorBrief | undefined;
  isGeneratingBrief: boolean;
  briefError: string | null;
  onDismissError: () => void;
  onGenerateBrief: () => void;
}

export const VendorBriefCard: React.FC<VendorBriefCardProps> = ({
  categoryLabel,
  allocatedBudget,
  activeBrief,
  isGeneratingBrief,
  briefError,
  onDismissError,
  onGenerateBrief
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-utsav-cream-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-utsav-saffron-600" />
            <span>Category Requirements Brief: {categoryLabel}</span>
          </h3>
          <span className="text-xs text-utsav-cream-800">
            Allocated Category Budget: <strong>₹{allocatedBudget.toLocaleString('en-IN')}</strong>{' '}
            (Estimate)
          </span>
        </div>

        <button
          type="button"
          disabled={isGeneratingBrief}
          onClick={onGenerateBrief}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-utsav-saffron-50 text-utsav-saffron-800 border border-utsav-saffron-200 hover:bg-utsav-saffron-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{activeBrief ? 'Regenerate Brief' : 'Generate Brief & Questions'}</span>
        </button>
      </div>

      {briefError && <ErrorAlert message={briefError} onDismiss={onDismissError} />}

      {isGeneratingBrief && (
        <LoadingSkeleton
          lines={4}
          label="Synthesizing scope, inclusions, and 8-10 targeted negotiation questions..."
        />
      )}

      {activeBrief && !isGeneratingBrief && (
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-utsav-cream-50 border border-utsav-cream-200">
            <span className="font-bold text-utsav-cream-900 block mb-1">Scope of Service:</span>
            <p className="text-utsav-cream-800 leading-relaxed">{activeBrief.scopeSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-utsav-cream-200 bg-white">
              <span className="font-bold text-utsav-cream-900 block mb-1">
                Capacity Requirement:
              </span>
              <p className="text-utsav-cream-800">{activeBrief.capacityRequirement}</p>
            </div>

            <div className="p-3 rounded-xl border border-utsav-cream-200 bg-white">
              <span className="font-bold text-utsav-cream-900 block mb-1">Timing & Curfews:</span>
              <p className="text-utsav-cream-800">{activeBrief.timingDetails}</p>
            </div>

            <div className="p-3 rounded-xl border border-utsav-cream-200 bg-white">
              <span className="font-bold text-utsav-cream-900 block mb-1">
                Accessibility Provisions:
              </span>
              <p className="text-utsav-cream-800">
                {activeBrief.accessibilityRequirements?.join(', ') || 'Standard access'}
              </p>
            </div>
          </div>

          <div>
            <span className="font-bold text-utsav-cream-900 block mb-1.5">
              Mandatory Baseline Inclusions:
            </span>
            <div className="flex flex-wrap gap-2">
              {activeBrief.keyInclusions?.map((inc, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                >
                  ✓ {inc}
                </span>
              ))}
            </div>
          </div>

          {/* 8-10 Negotiation Questions */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>
                Targeted Negotiation & Hidden Fee Questions (
                {activeBrief.negotiationQuestions?.length || 0}):
              </span>
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-amber-900 leading-relaxed">
              {activeBrief.negotiationQuestions?.map((q, idx) => (
                <li key={idx} className="font-medium">
                  {q}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
