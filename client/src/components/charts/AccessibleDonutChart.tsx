import React, { useState } from 'react';
import { BudgetState, BudgetCategory } from '@utsav/shared';
import { Table, PieChart } from 'lucide-react';

interface AccessibleDonutChartProps {
  budget: BudgetState;
  forcedView?: 'chart' | 'table';
}

export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  venue: '#c2410c', // saffron-700
  catering: '#ea580c', // saffron-600
  decor: '#eab308', // marigold-500
  photography_videography: '#3730a3', // indigo-700
  entertainment: '#047857', // emerald-700
  attire: '#ec4899', // pink-500
  invitations: '#8b5cf6', // purple-500
  transport: '#0ea5e9', // sky-500
  miscellaneous: '#6b7280', // gray-500
  contingency: '#b45309' // amber-700
};

export const AccessibleDonutChart: React.FC<AccessibleDonutChartProps> = ({ budget, forcedView }) => {
  const [showTableInternal, setShowTableInternal] = useState<boolean>(false);
  const [hoveredCategory, setHoveredCategory] = useState<BudgetCategory | null>(null);

  const showTable = forcedView ? forcedView === 'table' : showTableInternal;

  const categories = Object.values(budget.categories);
  const total = budget.totalBudgetINR;

  // SVG calculations for Donut
  const size = 260;
  const strokeWidth = 38;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const slices = categories.map(item => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += (item.percentage / 100) * circumference;
    return {
      ...item,
      color: CATEGORY_COLORS[item.category] || '#9ca3af',
      strokeDasharray,
      strokeDashoffset
    };
  });

  const activeItem = hoveredCategory ? budget.categories[hoveredCategory] : null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-utsav-cream-900 font-display">
            Budget Distribution
          </h3>
          <p className="text-xs text-utsav-cream-800">
            Total Allocated: ₹{total.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Accessibility table toggle */}
        {!forcedView && (
          <button
            type="button"
            onClick={() => setShowTableInternal(!showTableInternal)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-utsav-saffron-800 bg-utsav-saffron-50 hover:bg-utsav-saffron-100 border border-utsav-saffron-200 transition-colors cursor-pointer"
            aria-expanded={showTable}
            aria-controls="budget-data-table"
          >
            {showTable ? (
              <>
                <PieChart className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Show Chart</span>
              </>
            ) : (
              <>
                <Table className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Accessible Table</span>
              </>
            )}
          </button>
        )}
      </div>

      {showTable ? (
        /* Accessible HTML Table Alternative */
        <div id="budget-data-table" className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">Detailed event budget allocation breakdown by category</caption>
            <thead>
              <tr className="border-b border-utsav-cream-200 bg-utsav-cream-50 text-utsav-cream-900 font-semibold">
                <th scope="col" className="p-2.5">Category</th>
                <th scope="col" className="p-2.5 text-right">Share (%)</th>
                <th scope="col" className="p-2.5 text-right">Amount (₹)</th>
                <th scope="col" className="p-2.5 text-right">Cost Per Guest (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-utsav-cream-100 text-utsav-cream-800">
              {categories.map(item => (
                <tr key={item.category} className="hover:bg-utsav-cream-50">
                  <th scope="row" className="p-2.5 font-medium flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                    {item.isContingency && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                        Buffer
                      </span>
                    )}
                  </th>
                  <td className="p-2.5 text-right font-medium">{item.percentage}%</td>
                  <td className="p-2.5 text-right font-semibold text-utsav-cream-900">
                    ₹{item.allocatedAmountINR.toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5 text-right">₹{item.perGuestINR.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-utsav-cream-200 font-bold bg-utsav-cream-50 text-utsav-cream-900">
                <th scope="row" className="p-2.5">Total Allocation</th>
                <td className="p-2.5 text-right">100%</td>
                <td className="p-2.5 text-right">₹{total.toLocaleString('en-IN')}</td>
                <td className="p-2.5 text-right">₹{budget.perGuestTotalINR.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* Visual Donut Chart */
        <div className="flex flex-col lg:flex-row items-center justify-around gap-6 pt-2">
          {/* SVG Donut */}
          <div className="relative w-[260px] h-[260px] flex-shrink-0">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
              role="img"
              aria-label="Donut chart of budget distribution"
            >
              {slices.map(slice => (
                <circle
                  key={slice.category}
                  role="graphics-symbol"
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={hoveredCategory === slice.category ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory(slice.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onFocus={() => setHoveredCategory(slice.category)}
                  onBlur={() => setHoveredCategory(null)}
                  tabIndex={0}
                  aria-label={`${slice.label}: ${slice.percentage}% (₹${slice.allocatedAmountINR.toLocaleString('en-IN')})`}
                />
              ))}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
              {activeItem ? (
                <>
                  <span className="text-xs font-semibold text-utsav-cream-800 line-clamp-1 max-w-[130px]">
                    {activeItem.label}
                  </span>
                  <span className="text-lg font-bold text-utsav-cream-900 font-display">
                    {activeItem.percentage}%
                  </span>
                  <span className="text-xs font-medium text-utsav-saffron-700">
                    ₹{activeItem.allocatedAmountINR.toLocaleString('en-IN')}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-utsav-cream-800">Total Budget</span>
                  <span className="text-base font-bold text-utsav-cream-900 font-display">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-utsav-emerald-700 font-medium mt-0.5">
                    10 Categories
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs w-full max-w-md">
            {categories.map(item => (
              <div
                key={item.category}
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                  hoveredCategory === item.category ? 'bg-utsav-cream-100' : 'hover:bg-utsav-cream-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-utsav-cream-900 font-medium">
                    {item.label}
                  </span>
                </div>
                <span className="font-semibold text-utsav-cream-800 ml-2">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
