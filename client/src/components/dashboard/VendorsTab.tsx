import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext.js';
import { BudgetCategory, BUDGET_CATEGORIES } from '@utsav/shared';
import * as api from '../../services/api.js';
import { Plus } from 'lucide-react';
import { VendorBriefCard } from './vendors/VendorBriefCard.js';
import { QuoteExtractionModal } from './vendors/QuoteExtractionModal.js';
import { QuoteComparisonTable } from './vendors/QuoteComparisonTable.js';
import { MIN_QUOTE_LENGTH, MAX_QUOTE_LENGTH } from './vendors/vendorConstants.js';

export const VendorsTab: React.FC = () => {
  const { eventState, saveVendorBrief, saveQuote } = useEvent();

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

  // Handle generating Vendor Brief & 8-10 Questions
  const handleGenerateBrief = async () => {
    if (!eventState) return;
    setIsGeneratingBrief(true);
    setBriefError(null);

    const allocated = eventState.budget.categories[selectedCategory]?.allocatedAmountINR || 0;
    try {
      const brief = await api.generateVendorBrief(eventState.profile, selectedCategory, allocated);
      saveVendorBrief(brief);
    } catch (err: unknown) {
      setBriefError(
        err instanceof Error && err.message ? err.message : 'Failed to generate vendor brief.'
      );
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Handle Extracting Quote from Raw text
  const handleExtractQuote = async () => {
    if (!eventState) return;
    if (!rawQuoteText.trim() || rawQuoteText.length < MIN_QUOTE_LENGTH) {
      setQuoteError('Please paste the vendor quotation message or email (at least 10 characters).');
      return;
    }
    if (rawQuoteText.length > MAX_QUOTE_LENGTH) {
      setQuoteError(
        'Vendor quote text cannot exceed 10000 characters. Please shorten the pasted text.'
      );
      return;
    }

    setIsExtractingQuote(true);
    setQuoteError(null);

    try {
      const quote = await api.extractVendorQuote(
        rawQuoteText,
        quoteCategory,
        eventState.profile.expectedGuests
      );
      saveQuote(quote);
      setIsParsingQuote(false);
      setRawQuoteText('');
      setSelectedCategory(quoteCategory); // automatically jump to that category
    } catch (err: unknown) {
      setQuoteError(
        err instanceof Error && err.message ? err.message : 'Failed to extract vendor quote.'
      );
    } finally {
      setIsExtractingQuote(false);
    }
  };

  if (!eventState) return null;

  const { budget, vendorBriefs, quotes } = eventState;
  const activeBrief = vendorBriefs[selectedCategory];
  const relevantQuotes = quotes.filter((q) => q.category === selectedCategory);
  const allocatedBudgetForCategory = budget.categories[selectedCategory]?.allocatedAmountINR || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-utsav-cream-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-utsav-cream-900 font-display">
            Vendor Coordination & Quote Comparison
          </h2>
          <p className="text-xs text-utsav-cream-800 mt-1">
            Generate culturally-nuanced requirement briefs and normalize raw quotes into verified
            Total Cost of Ownership (TCO).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setQuoteCategory(selectedCategory);
            setIsParsingQuote(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Parse Raw Vendor Quote</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {BUDGET_CATEGORIES.filter((c) => c !== 'contingency').map((cat) => {
          const isSelected = selectedCategory === cat;
          const hasBrief = Boolean(vendorBriefs[cat]);
          const quoteCount = quotes.filter((q) => q.category === cat).length;

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
              {hasBrief && (
                <span className="text-[10px] bg-white/30 text-white px-1 rounded">Brief</span>
              )}
              {quoteCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 rounded-full font-bold ${isSelected ? 'bg-white text-utsav-saffron-900' : 'bg-utsav-cream-200 text-utsav-cream-900'}`}
                >
                  {quoteCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section 1: Vendor Brief & Negotiation Questions */}
      <VendorBriefCard
        categoryLabel={budget.categories[selectedCategory]?.label || selectedCategory}
        selectedCategory={selectedCategory}
        allocatedBudget={allocatedBudgetForCategory}
        activeBrief={activeBrief}
        isGeneratingBrief={isGeneratingBrief}
        briefError={briefError}
        onDismissError={() => setBriefError(null)}
        onGenerateBrief={handleGenerateBrief}
      />

      {/* Raw Quote Parser Drawer / Modal */}
      {isParsingQuote && (
        <QuoteExtractionModal
          quoteCategory={quoteCategory}
          setQuoteCategory={setQuoteCategory}
          rawQuoteText={rawQuoteText}
          setRawQuoteText={setRawQuoteText}
          isExtractingQuote={isExtractingQuote}
          quoteError={quoteError}
          onDismissError={() => setQuoteError(null)}
          onCancel={() => setIsParsingQuote(false)}
          onExtract={handleExtractQuote}
          budget={budget}
        />
      )}

      {/* Section 2: Side-by-Side Quote Comparison Table */}
      <QuoteComparisonTable
        categoryLabel={budget.categories[selectedCategory]?.label || selectedCategory}
        relevantQuotes={relevantQuotes}
        allocatedBudgetForCategory={allocatedBudgetForCategory}
      />
    </div>
  );
};
