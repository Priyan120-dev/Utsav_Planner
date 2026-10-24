import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext.js';
import { BudgetCategory, BUDGET_CATEGORIES } from '@utsav/shared';
import { AccessibleDonutChart } from '../charts/AccessibleDonutChart.js';
import { DisclaimerBadge } from '../common/DisclaimerBadge.js';
import { Sparkles, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce.js';

export const BudgetTab: React.FC = () => {
  const { eventState, updateSliderPercentage } = useEvent();
  if (!eventState) return null;

  const { budget, profile } = eventState;
  const categories = Object.values(budget.categories);

  // Local state for sliders so user gets instant 60fps drag response
  const [sliderValues, setSliderValues] = useState<Record<BudgetCategory, number>>(() => {
    const map: any = {};
    for (const c of BUDGET_CATEGORIES) {
      map[c] = budget.categories[c]?.percentage || 0;
    }
    return map;
  });

  const [activeCategory, setActiveCategory] = useState<BudgetCategory | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);

  // Sync if external changes occur (like demo load or undo)
  useEffect(() => {
    const map: any = {};
    for (const c of BUDGET_CATEGORIES) {
      map[c] = budget.categories[c]?.percentage || 0;
    }
    setSliderValues(map);
  }, [budget]);

  // Debounced active slider value for calling the LLM
  const debouncedSliderState = useDebounce({
    category: activeCategory,
    value: activeCategory ? sliderValues[activeCategory] : null
  }, 700);

  useEffect(() => {
    if (debouncedSliderState.category && debouncedSliderState.value !== null) {
      const cat = debouncedSliderState.category;
      const val = debouncedSliderState.value;
      if (val !== budget.categories[cat]?.percentage) {
        setIsAiAnalyzing(true);
        updateSliderPercentage(cat, val).finally(() => {
          setIsAiAnalyzing(false);
        });
      }
    }
  }, [debouncedSliderState]);

  const handleSliderChange = (cat: BudgetCategory, newPct: number) => {
    setActiveCategory(cat);
    setSliderValues(prev => ({
      ...prev,
      [cat]: newPct
    }));
  };

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
            const currentVal = sliderValues[item.category] ?? item.percentage;
            const currentAmount = Math.round((budget.totalBudgetINR * currentVal) / 100);
            const currentPerHead = profile.expectedGuests > 0 ? Math.round(currentAmount / profile.expectedGuests) : 0;
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
