import React from 'react';
import { BudgetCategory, BUDGET_CATEGORIES, BudgetState } from '@utsav/shared';
import { ErrorAlert } from '../../common/ErrorAlert.js';
import { LoadingSkeleton } from '../../common/LoadingSkeleton.js';

interface QuoteExtractionModalProps {
  quoteCategory: BudgetCategory;
  setQuoteCategory: (category: BudgetCategory) => void;
  rawQuoteText: string;
  setRawQuoteText: (text: string) => void;
  isExtractingQuote: boolean;
  quoteError: string | null;
  onDismissError: () => void;
  onCancel: () => void;
  onExtract: () => void;
  budget: BudgetState;
}

export const QuoteExtractionModal: React.FC<QuoteExtractionModalProps> = ({
  quoteCategory,
  setQuoteCategory,
  rawQuoteText,
  setRawQuoteText,
  isExtractingQuote,
  quoteError,
  onDismissError,
  onCancel,
  onExtract,
  budget
}) => {
  return (
    <div className="p-6 bg-white border-2 border-utsav-saffron-300 rounded-2xl shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
          <span>📋</span>
          <span>Paste Raw Vendor Quote / Email / WhatsApp Message</span>
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-utsav-cream-800 hover:text-utsav-cream-900 underline cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-utsav-cream-800">
        Paste the raw text received from the vendor. Gemini will extract verified fields (prices,
        inclusions, hidden charges), set unstated fields to null, and code will compute the Total
        Cost of Ownership.
      </p>

      <div className="flex items-center gap-3">
        <label htmlFor="quote-category-select" className="text-xs font-bold text-utsav-cream-900">
          Category:
        </label>
        <select
          id="quote-category-select"
          value={quoteCategory}
          onChange={(e) => setQuoteCategory(e.target.value as BudgetCategory)}
          className="px-3 py-1.5 text-xs rounded-xl border border-utsav-cream-200 font-medium"
        >
          {BUDGET_CATEGORIES.filter((c) => c !== 'contingency').map((c) => (
            <option key={c} value={c}>
              {budget.categories[c]?.label || c}
            </option>
          ))}
        </select>
      </div>

      <textarea
        rows={5}
        value={rawQuoteText}
        onChange={(e) => setRawQuoteText(e.target.value)}
        placeholder="Paste raw vendor message here: e.g., 'Namaste Sir, Royal Banquet hall rate is Rs 3,50,000 for 300 guests. GST 18% extra. Generator diesel charges Rs 15,000 separate. Advance 50% on booking...'"
        className="w-full p-3 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500 bg-utsav-cream-50/50"
        disabled={isExtractingQuote}
      />

      {quoteError && <ErrorAlert message={quoteError} onDismiss={onDismissError} />}

      {isExtractingQuote ? (
        <LoadingSkeleton
          lines={2}
          label="Extracting verified items, inclusions, and calculating Total Cost of Ownership..."
        />
      ) : (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-utsav-cream-800 hover:bg-utsav-cream-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onExtract}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 cursor-pointer shadow-xs"
          >
            Extract Quote & Compute TCO
          </button>
        </div>
      )}
    </div>
  );
};
