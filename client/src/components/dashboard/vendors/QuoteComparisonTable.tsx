import React from 'react';
import { QuoteItem } from '@utsav/shared';
import { Layers, ShieldAlert } from 'lucide-react';
import { DisclaimerBadge } from '../../common/DisclaimerBadge.js';

interface QuoteComparisonTableProps {
  categoryLabel: string;
  relevantQuotes: QuoteItem[];
  allocatedBudgetForCategory: number;
}

export const QuoteComparisonTable: React.FC<QuoteComparisonTableProps> = ({
  categoryLabel,
  relevantQuotes,
  allocatedBudgetForCategory
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-utsav-saffron-600" />
            <span>Side-by-Side Quote Comparison Matrix: {categoryLabel}</span>
          </h3>
          <span className="text-xs text-utsav-cream-800">
            {relevantQuotes.length} quotes parsed for this category
          </span>
        </div>

        <DisclaimerBadge customText="Availability not verified: confirm directly with vendor" />
      </div>

      {relevantQuotes.length === 0 ? (
        <div className="p-8 text-center bg-utsav-cream-50 rounded-xl border border-dashed border-utsav-cream-200 text-xs text-utsav-cream-800">
          No quotes parsed yet for {categoryLabel}. Click &quot;Parse Raw Vendor Quote&quot; above
          to compare proposals side-by-side.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-utsav-cream-200 bg-utsav-cream-50 text-utsav-cream-900 font-bold">
                <th scope="col" className="p-3">
                  Vendor Name
                </th>
                <th scope="col" className="p-3">
                  Base Price (₹)
                </th>
                <th scope="col" className="p-3">
                  Extra / Hidden Fees (₹)
                </th>
                <th scope="col" className="p-3">
                  Total Cost of Ownership (TCO)
                </th>
                <th scope="col" className="p-3">
                  Capacity
                </th>
                <th scope="col" className="p-3">
                  Missing Info (Omissions)
                </th>
                <th scope="col" className="p-3">
                  Red Flags / Risks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-utsav-cream-100 text-utsav-cream-900">
              {relevantQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-utsav-cream-50/60 align-top">
                  <td className="p-3 font-semibold text-utsav-cream-900">
                    <div>{quote.vendorName}</div>
                    <span className="text-[10px] text-utsav-cream-800 block mt-0.5">
                      {quote.availabilityDisclaimer}
                    </span>
                  </td>

                  <td className="p-3 font-medium">
                    ₹{quote.basePriceINR.toLocaleString('en-IN')}
                    {quote.tiers && quote.tiers.length > 0 && (
                      <div className="text-[10px] text-utsav-saffron-800 mt-1">
                        <span className="font-semibold">Tiers:</span>{' '}
                        {quote.tiers
                          .map((t) => `≤${t.upToGuests}: ₹${t.pricePerPlate}/plate`)
                          .join(', ')}
                      </div>
                    )}
                  </td>

                  <td className="p-3">
                    {quote.additionalChargesINR > 0 ? (
                      <div>
                        <span className="font-semibold text-amber-800">
                          +₹{quote.additionalChargesINR.toLocaleString('en-IN')}
                        </span>
                        <ul className="text-[10px] text-utsav-cream-800 mt-1 space-y-0.5">
                          {quote.additionalChargesBreakdown.map((item, i) => (
                            <li key={i}>
                              {item.item}: ₹{item.amountINR.toLocaleString('en-IN')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <span className="text-utsav-cream-800">₹0 extra stated</span>
                    )}
                  </td>

                  <td className="p-3">
                    <span className="text-sm font-bold text-utsav-saffron-800 font-display block">
                      ₹{quote.computedTotalCostINR.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-utsav-cream-800">
                      {quote.computedTotalCostINR <= allocatedBudgetForCategory ? (
                        <span className="text-emerald-700 font-semibold">Within Budget</span>
                      ) : (
                        <span className="text-red-700 font-semibold">
                          Exceeds by ₹
                          {(quote.computedTotalCostINR - allocatedBudgetForCategory).toLocaleString(
                            'en-IN'
                          )}
                        </span>
                      )}
                    </span>
                  </td>

                  <td className="p-3">
                    {quote.guestCapacity !== null ? (
                      <span>{quote.guestCapacity} guests</span>
                    ) : (
                      <span className="text-amber-800 font-medium italic">Unstated (null)</span>
                    )}
                  </td>

                  <td className="p-3">
                    {quote.missingInfo && quote.missingInfo.length > 0 ? (
                      <ul className="space-y-1 text-[11px] text-amber-900">
                        {quote.missingInfo.map((info, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-amber-600 font-bold">&bull;</span>
                            <span>{info}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-emerald-700">None detected</span>
                    )}
                  </td>

                  <td className="p-3">
                    {quote.redFlags && quote.redFlags.length > 0 ? (
                      <ul className="space-y-1 text-[11px] text-red-900">
                        {quote.redFlags.map((flag, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-emerald-700">Clear</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
