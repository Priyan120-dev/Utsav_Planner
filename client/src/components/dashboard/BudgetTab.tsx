import React, { useState, useEffect, useRef } from 'react';
import { useEvent } from '../../context/EventContext.js';
import { BudgetCategory } from '@utsav/shared';
import { AccessibleDonutChart } from '../charts/AccessibleDonutChart.js';
import { DisclaimerBadge } from '../common/DisclaimerBadge.js';
import { Sparkles, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce.js';
import * as api from '../../services/api.js';

export const BudgetTab: React.FC = () => {
  const { eventState, rebalanceCategoryBudget, setBudgetTradeoffAdvice } = useEvent();
  if (!eventState) return null;

  const { budget, profile } = eventState;
  const categories = Object.values(budget.categories);

  // Keep a reference to the latest eventState for the AI advice call
  const eventStateRef = useRef(eventState);
  eventStateRef.current = eventState;

  // Track in-flight request and sequence counter to discard stale responses
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);

  // Pending category change to be sent to LLM after 700ms debounce
  const [pendingAiChange, setPendingAiChange] = useState<{
    category: BudgetCategory;
    percentage: number;
  } | null>(null);

  // Debounced active slider value ONLY for calling the LLM
  const debouncedAiChange = useDebounce(pendingAiChange, 700);

  // 1. On every slider change, call pure rebalanceBudget synchronously
  const handleSliderChange = (cat: BudgetCategory, newPct: number) => {
    // Abort previous in-flight getBudgetTradeoffAdvice request whenever a new slider change occurs
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    requestIdRef.current++;

    // Synchronously rebalance budget pure logic: instant donut chart, category cards, per-head and deltas update
    rebalanceCategoryBudget(cat, newPct);

    // Queue for debounced AI trade-off advice
    setPendingAiChange({ category: cat, percentage: newPct });
  };

  // 2. 700ms debounced effect ONLY for the LLM trade-off advice call
  useEffect(() => {
    if (!debouncedAiChange) return;

    const { category, percentage } = debouncedAiChange;
    const currentState = eventStateRef.current;
    if (!currentState) return;

    // Abort any lingering previous controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentReqId = ++requestIdRef.current;

    setIsAiAnalyzing(true);

    api.getBudgetTradeoffAdvice(
      currentState,
      category,
      percentage,
      controller.signal
    )
      .then(tradeoff => {
        // Ignore stale responses or aborted calls
        if (controller.signal.aborted || requestIdRef.current !== currentReqId) {
          return;
        }
        setBudgetTradeoffAdvice(tradeoff);
      })
      .catch(err => {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          return; // Aborted cleanly, ignore
        }
        console.warn('AI budget tradeoff evaluation error:', err);
      })
      .finally(() => {
        // Only turn off loading if this was the latest active request
        if (!controller.signal.aborted && requestIdRef.current === currentReqId) {
          setIsAiAnalyzing(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedAiChange, setBudgetTradeoffAdvice]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const aiTradeoff = budget.lastAiTradeoff;

  return (
    <div className="space-y-6">
      {/* Header and Disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-utsav-cream-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-utsav-cream-900 font-display">
              Categorised Budget & Dynamic Trade-Offs
            </h2>
            <DisclaimerBadge />
          </div>
          <p className="text-xs text-utsav-cream-800 mt-1">
            Total Budget: <strong className="text-utsav-cream-900">₹{budget.totalBudgetINR.toLocaleString('en-IN')}</strong> &bull; Per Head: <strong className="text-utsav-cream-900">₹{budget.perGuestTotalINR.toLocaleString('en-IN')}</strong> ({profile.expectedGuests} guests)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Emergency Buffer: {budget.contingencyPercent}% (Min 5%)</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <AccessibleDonutChart budget={budget} />

      {/* Dynamic AI Trade-off Advisory Box */}
      {aiTradeoff && (
        <div className="bg-gradient-to-r from-utsav-saffron-50 to-utsav-marigold-50 border border-utsav-saffron-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white shadow-xs text-utsav-saffron-600 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-grow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
                  <span>AI Trade-off Impact & Host Options</span>
                  {isAiAnalyzing && (
                    <span className="text-[11px] text-utsav-saffron-700 animate-pulse font-normal">
                      (Analyzing latest adjustments...)
                    </span>
                  )}
                </h3>
                <DisclaimerBadge customText={aiTradeoff.disclaimer} className="py-0 px-2 text-[10px]" />
              </div>

              <p className="text-xs text-utsav-cream-900 leading-relaxed font-medium">
                {aiTradeoff.explanation}
              </p>

              {aiTradeoff.actionableOptions?.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-utsav-saffron-900 uppercase tracking-wider block mb-1.5">
                    Recommended Actionable Levers:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiTradeoff.actionableOptions.map((opt, i) => (
                      <div
                        key={i}
                        className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-utsav-saffron-200/80 text-xs text-utsav-cream-900 font-medium flex items-start gap-2 shadow-2xs"
                      >
                        <span className="text-utsav-saffron-700 font-bold">&bull;</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Category Sliders Grid */}
      <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-utsav-cream-100 pb-3">
          <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-utsav-saffron-600" />
            <span>Interactive Allocation Sliders (Auto-Rebalancing in Code)</span>
          </h3>
          <span className="text-xs text-utsav-cream-800">
            Slide to adjust; other lines compensate proportionally
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {categories.map(item => {
            const currentVal = item.percentage;
            const currentAmount = item.allocatedAmountINR;
            const currentPerHead = item.perGuestINR;
            const isContingency = item.isContingency;

            return (
              <div
                key={item.category}
                className="p-3.5 rounded-xl border border-utsav-cream-200/70 hover:border-utsav-saffron-300 bg-utsav-cream-50/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={`slider-${item.category}`}
                    className="text-xs font-bold text-utsav-cream-900 flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                    {isContingency && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                        Safety Buffer
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-utsav-cream-900">
                      {currentVal}%
                    </span>
                    <span className="text-xs font-semibold text-utsav-saffron-800">
                      ₹{currentAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Slider Input */}
                <input
                  id={`slider-${item.category}`}
                  type="range"
                  min={isContingency ? 5 : 0}
                  max={isContingency ? 40 : 80}
                  step="1"
                  value={currentVal}
                  onChange={e => handleSliderChange(item.category, Number(e.target.value))}
                  className="w-full accent-utsav-saffron-600 cursor-pointer h-2 bg-utsav-cream-200 rounded-lg"
                  aria-label={`${item.label} allocation percentage`}
                />

                <div className="flex items-center justify-between text-[11px] text-utsav-cream-800 mt-1">
                  <span>Per guest: ₹{currentPerHead.toLocaleString('en-IN')}</span>
                  <DisclaimerBadge customText="Estimate" className="py-0 px-1 text-[9px]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
