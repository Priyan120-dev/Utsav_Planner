import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext.js';
import { BudgetCategory, BUDGET_CATEGORIES } from '@utsav/shared';
import * as api from '../../services/api.js';
import { 
  FileText, 
  Sparkles, 
  HelpCircle, 
  Plus, 
  Layers, 
  ShieldAlert
} from 'lucide-react';
import { DisclaimerBadge } from '../common/DisclaimerBadge.js';
import { LoadingSkeleton } from '../common/LoadingSkeleton.js';
import { ErrorAlert } from '../common/ErrorAlert.js';

export const VendorsTab: React.FC = () => {
  const { eventState, saveVendorBrief, saveQuote } = useEvent();
  if (!eventState) return null;

  const { profile, budget, vendorBriefs, quotes } = eventState;

  // Selected Category for Brief
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory>('catering');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState<boolean>(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  // Quote Extraction Drawer State
  const [isParsingQuote, setIsParsingQuote] = useState<boolean>(false);
  const [quoteCategory, setQuoteCategory] = useState<BudgetCategory>('catering');
  const [rawQuoteText, setRawQuoteText] = useState<string>('');
  const [isExtractingQuote, setIsExtractingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const activeBrief = vendorBriefs[selectedCategory];
  const allocatedBudgetForCategory = budget.categories[selectedCategory]?.allocatedAmountINR || 0;

  // Handle generating Vendor Brief & 8-10 Questions
  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    setBriefError(null);

    try {
      const brief = await api.generateVendorBrief(profile, selectedCategory, allocatedBudgetForCategory);
      saveVendorBrief(brief);
    } catch (err: any) {
      setBriefError(err.message || 'Failed to generate vendor brief.');
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Handle Extracting Quote from Raw text
  const handleExtractQuote = async () => {
    if (!rawQuoteText.trim() || rawQuoteText.length < 10) {
      setQuoteError('Please paste the vendor quotation message or email (at least 10 characters).');
      return;
    }
    if (rawQuoteText.length > 10000) {
      setQuoteError('Vendor quote text cannot exceed 10000 characters. Please shorten the pasted text.');
      return;
    }

    setIsExtractingQuote(true);
    setQuoteError(null);

    try {
      const extractedQuote = await api.extractVendorQuote(rawQuoteText, quoteCategory);
      saveQuote(extractedQuote);
      setRawQuoteText('');
      setIsParsingQuote(false);
    } catch (err: any) {
      setQuoteError(err.message || 'Failed to parse quote text.');
    } finally {
      setIsExtractingQuote(false);
    }
  };

  // Quotes filtered for comparison
  const relevantQuotes = quotes.filter(q => q.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner and Quote Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-utsav-cream-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-utsav-cream-900 font-display">
              Vendor Coordination & Quote Comparison
            </h2>
            <DisclaimerBadge customText="Availability not verified: confirm directly with vendor" />
          </div>
          <p className="text-xs text-utsav-cream-800 mt-1">
            Generate customized RFPs, 8-10 targeted negotiation questions, and parse raw vendor messages into structured TCO matrices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsParsingQuote(true);
            setQuoteCategory(selectedCategory);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-utsav-saffron-600 to-utsav-marigold-600 text-white shadow-xs hover:from-utsav-saffron-700 hover:to-utsav-marigold-700 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Parse Raw Vendor Quote</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {BUDGET_CATEGORIES.filter(c => c !== 'contingency').map(cat => {
          const isSelected = selectedCategory === cat;
          const hasBrief = Boolean(vendorBriefs[cat]);
          const quoteCount = quotes.filter(q => q.category === cat).length;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-utsav-saffron-600 text-white shadow-xs'
                  : 'bg-white text-utsav-cream-800 border border-utsav-cream-200 hover:bg-utsav-cream-50'
              }`}
            >
              <span>{budget.categories[cat]?.label || cat}</span>
              {hasBrief && <span className="text-[10px] bg-white/30 text-white px-1 rounded">Brief</span>}
              {quoteCount > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full font-bold ${isSelected ? 'bg-white text-utsav-saffron-900' : 'bg-utsav-cream-200 text-utsav-cream-900'}`}>
                  {quoteCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section 1: Vendor Brief & Negotiation Questions */}
      <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-utsav-cream-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-utsav-saffron-600" />
              <span>Category Requirements Brief: {budget.categories[selectedCategory]?.label}</span>
            </h3>
            <span className="text-xs text-utsav-cream-800">
              Allocated Category Budget: <strong>₹{allocatedBudgetForCategory.toLocaleString('en-IN')}</strong> (Estimate)
            </span>
          </div>

          <button
            type="button"
            disabled={isGeneratingBrief}
            onClick={handleGenerateBrief}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-utsav-saffron-50 text-utsav-saffron-800 border border-utsav-saffron-200 hover:bg-utsav-saffron-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeBrief ? 'Regenerate Brief' : 'Generate Brief & Questions'}</span>
          </button>
        </div>

        {briefError && <ErrorAlert message={briefError} onDismiss={() => setBriefError(null)} />}

        {isGeneratingBrief && (
          <LoadingSkeleton lines={4} label="Synthesizing scope, inclusions, and 8-10 targeted negotiation questions..." />
        )}

        {activeBrief && !isGeneratingBrief && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-utsav-cream-50 border border-utsav-cream-200">
              <span className="font-bold text-utsav-cream-900 block mb-1">Scope of Service:</span>
              <p className="text-utsav-cream-800 leading-relaxed">{activeBrief.scopeSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-utsav-cream-200 bg-white">
                <span className="font-bold text-utsav-cream-900 block mb-1">Capacity Requirement:</span>
                <p className="text-utsav-cream-800">{activeBrief.capacityRequirement}</p>
              </div>

              <div className="p-3 rounded-xl border border-utsav-cream-200 bg-white">
                <span className="font-bold text-utsav-cream-900 block mb-1">Timing & Curfews:</span>
                <p className="text-utsav-cream-800">{activeBrief.timingDetails}</p>
              </div>

              <div className="p-3 rounded-xl border border-utsav-cream-200 bg-white">
                <span className="font-bold text-utsav-cream-900 block mb-1">Accessibility Provisions:</span>
                <p className="text-utsav-cream-800">{activeBrief.accessibilityRequirements?.join(', ') || 'Standard access'}</p>
              </div>
            </div>

            <div>
              <span className="font-bold text-utsav-cream-900 block mb-1.5">Mandatory Baseline Inclusions:</span>
              <div className="flex flex-wrap gap-2">
                {activeBrief.keyInclusions?.map((inc, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    ✓ {inc}
                  </span>
                ))}
              </div>
            </div>

            {/* 8-10 Negotiation Questions */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>Targeted Negotiation & Hidden Fee Questions ({activeBrief.negotiationQuestions?.length || 0}):</span>
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-amber-900 leading-relaxed">
                {activeBrief.negotiationQuestions?.map((q, idx) => (
                  <li key={idx} className="font-medium">{q}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Raw Quote Parser Drawer / Modal */}
      {isParsingQuote && (
        <div className="p-6 bg-white border-2 border-utsav-saffron-300 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
              <span>📋</span>
              <span>Paste Raw Vendor Quote / Email / WhatsApp Message</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsParsingQuote(false)}
              className="text-xs text-utsav-cream-800 hover:text-utsav-cream-900 underline cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-utsav-cream-800">
            Paste the raw text received from the vendor. Gemini will extract verified fields (prices, inclusions, hidden charges), set unstated fields to null, and code will compute the Total Cost of Ownership.
          </p>

          <div className="flex items-center gap-3">
            <label htmlFor="quote-category-select" className="text-xs font-bold text-utsav-cream-900">
              Category:
            </label>
            <select
              id="quote-category-select"
              value={quoteCategory}
              onChange={e => setQuoteCategory(e.target.value as BudgetCategory)}
              className="px-3 py-1.5 text-xs rounded-xl border border-utsav-cream-200 font-medium"
            >
              {BUDGET_CATEGORIES.filter(c => c !== 'contingency').map(c => (
                <option key={c} value={c}>{budget.categories[c]?.label || c}</option>
              ))}
            </select>
          </div>

          <textarea
            rows={5}
            value={rawQuoteText}
            onChange={e => setRawQuoteText(e.target.value)}
            placeholder="Paste raw vendor message here: e.g., 'Namaste Sir, Royal Banquet hall rate is Rs 3,50,000 for 300 guests. GST 18% extra. Generator diesel charges Rs 15,000 separate. Advance 50% on booking...'"
            className="w-full p-3 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500 bg-utsav-cream-50/50"
            disabled={isExtractingQuote}
          />

          {quoteError && <ErrorAlert message={quoteError} onDismiss={() => setQuoteError(null)} />}

          {isExtractingQuote ? (
            <LoadingSkeleton lines={2} label="Extracting verified items, inclusions, and calculating Total Cost of Ownership..." />
          ) : (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsParsingQuote(false)}
                className="px-4 py-2 text-xs font-medium text-utsav-cream-800 hover:bg-utsav-cream-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExtractQuote}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 cursor-pointer shadow-xs"
              >
                Extract Quote & Compute TCO
              </button>
            </div>
          )}
        </div>
      )}

      {/* Section 2: Side-by-Side Quote Comparison Table */}
      <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-utsav-saffron-600" />
              <span>Side-by-Side Quote Comparison Matrix: {budget.categories[selectedCategory]?.label}</span>
            </h3>
            <span className="text-xs text-utsav-cream-800">
              {relevantQuotes.length} quotes parsed for this category
            </span>
          </div>

          <DisclaimerBadge customText="Availability not verified: confirm directly with vendor" />
        </div>

        {relevantQuotes.length === 0 ? (
          <div className="p-8 text-center bg-utsav-cream-50 rounded-xl border border-dashed border-utsav-cream-200 text-xs text-utsav-cream-800">
            No quotes parsed yet for {budget.categories[selectedCategory]?.label}. Click "Parse Raw Vendor Quote" above to compare proposals side-by-side.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-utsav-cream-200 bg-utsav-cream-50 text-utsav-cream-900 font-bold">
                  <th scope="col" className="p-3">Vendor Name</th>
                  <th scope="col" className="p-3">Base Price (₹)</th>
                  <th scope="col" className="p-3">Extra / Hidden Fees (₹)</th>
                  <th scope="col" className="p-3">Total Cost of Ownership (TCO)</th>
                  <th scope="col" className="p-3">Capacity</th>
                  <th scope="col" className="p-3">Missing Info (Omissions)</th>
                  <th scope="col" className="p-3">Red Flags / Risks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-utsav-cream-100 text-utsav-cream-900">
                {relevantQuotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-utsav-cream-50/60 align-top">
                    <td className="p-3 font-semibold text-utsav-cream-900">
                      <div>{quote.vendorName}</div>
                      <span className="text-[10px] text-utsav-cream-800 block mt-0.5">
                        {quote.availabilityDisclaimer}
                      </span>
                    </td>

                    <td className="p-3 font-medium">
                      ₹{quote.basePriceINR.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3">
                      {quote.additionalChargesINR > 0 ? (
                        <div>
                          <span className="font-semibold text-amber-800">
                            +₹{quote.additionalChargesINR.toLocaleString('en-IN')}
                          </span>
                          <ul className="text-[10px] text-utsav-cream-800 mt-1 space-y-0.5">
                            {quote.additionalChargesBreakdown.map((item, i) => (
                              <li key={i}>{item.item}: ₹{item.amountINR.toLocaleString('en-IN')}</li>
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
                            Exceeds by ₹{(quote.computedTotalCostINR - allocatedBudgetForCategory).toLocaleString('en-IN')}
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
    </div>
  );
};
