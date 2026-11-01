import React, { useState } from 'react';
import { BudgetState, BudgetCategory } from '@utsav/shared';
import { Table, BarChart3 } from 'lucide-react';

interface AccessibleBarChartProps {
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

export const AccessibleBarChart: React.FC<AccessibleBarChartProps> = ({ budget, forcedView }) => {
  const [showTableInternal, setShowTableInternal] = useState<boolean>(false);
  const [hoveredCategory, setHoveredCategory] = useState<BudgetCategory | null>(null);

  const showTable = forcedView ? forcedView === 'table' : showTableInternal;
  const categories = Object.values(budget.categories);
  const total = budget.totalBudgetINR;

  // Max percentage among categories to scale bar widths cleanly
  const maxPct = Math.max(...categories.map((c) => c.percentage), 40);

  return (
    <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-utsav-cream-900 font-display">
            Budget Distribution (Horizontal Bars)
          </h3>
          <p className="text-xs text-utsav-cream-800">
            Total Allocated: ₹{total.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Accessibility table toggle (visible if not externally controlled) */}
        {!forcedView && (
          <button
            type="button"
            onClick={() => setShowTableInternal(!showTableInternal)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-utsav-saffron-800 bg-utsav-saffron-50 hover:bg-utsav-saffron-100 border border-utsav-saffron-200 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-utsav-saffron-500"
            aria-expanded={showTable}
            aria-controls="budget-bar-data-table"
          >
            {showTable ? (
              <>
                <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Show Bar Chart</span>
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
        <div id="budget-bar-data-table" className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">
              Detailed event budget allocation breakdown by category
            </caption>
            <thead>
              <tr className="border-b border-utsav-cream-200 bg-utsav-cream-50 text-utsav-cream-900 font-semibold">
                <th scope="col" className="p-2.5">
                  Category
                </th>
                <th scope="col" className="p-2.5 text-right">
                  Share (%)
                </th>
                <th scope="col" className="p-2.5 text-right">
                  Amount (₹)
                </th>
                <th scope="col" className="p-2.5 text-right">
                  Cost Per Guest (₹)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-utsav-cream-100 text-utsav-cream-800">
              {categories.map((item) => (
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
                <th scope="row" className="p-2.5">
                  Total Allocation
                </th>
                <td className="p-2.5 text-right">100%</td>
                <td className="p-2.5 text-right">₹{total.toLocaleString('en-IN')}</td>
                <td className="p-2.5 text-right">
                  ₹{budget.perGuestTotalINR.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* Visual Standalone SVG Bar Chart */
        <div className="w-full overflow-hidden">
          <svg
            viewBox="0 0 600 370"
            className="w-full h-auto max-h-[380px]"
            role="img"
            aria-label="Bar chart of budget distribution across categories"
          >
            {categories.map((item, idx) => {
              const y = idx * 36;
              const color = CATEGORY_COLORS[item.category] || '#9ca3af';
              const isHovered = hoveredCategory === item.category;
              const barWidth = Math.max(6, (item.percentage / maxPct) * 360);

              return (
                <g
                  key={item.category}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={`${item.label}: ${item.percentage}%, ₹${item.allocatedAmountINR.toLocaleString('en-IN')}`}
                  onFocus={() => setHoveredCategory(item.category)}
                  onBlur={() => setHoveredCategory(null)}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className="cursor-pointer focus:outline-hidden"
                >
                  {/* Category Label */}
                  <text
                    x="10"
                    y={y + 15}
                    fontSize="11"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    fill={isHovered ? '#1c1917' : '#44403c'}
                  >
                    {item.label}
                  </text>

                  {/* Percentage & INR Amount */}
                  <text
                    x="590"
                    y={y + 15}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="600"
                    fill={isHovered ? color : '#292524'}
                  >
                    {item.percentage}% &bull; ₹{item.allocatedAmountINR.toLocaleString('en-IN')}
                  </text>

                  {/* Bar Background Track */}
                  <rect x="10" y={y + 20} width="580" height="10" rx="5" fill="#f5f5f4" />

                  {/* Active Bar Fill */}
                  <rect
                    x="10"
                    y={y + 20}
                    width={barWidth}
                    height="10"
                    rx="5"
                    fill={color}
                    opacity={isHovered ? 1 : 0.9}
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
