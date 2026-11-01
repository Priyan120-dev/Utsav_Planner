import React from 'react';
import { Sparkles } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton.js';

interface FreeTextParserCardProps {
  freeText: string;
  setFreeText: (text: string) => void;
  isParsingAi: boolean;
  onParse: () => void;
  onLoadDemo: () => void;
}

export const FreeTextParserCard: React.FC<FreeTextParserCardProps> = ({
  freeText,
  setFreeText,
  isParsingAi,
  onParse,
  onLoadDemo
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-utsav-cream-200 shadow-md">
      <label
        htmlFor="event-free-text"
        className="block text-sm font-bold text-utsav-cream-900 mb-1"
      >
        Describe your event in plain Hindi or English:
      </label>
      <p className="text-xs text-utsav-cream-800 mb-4">
        Mention the occasion, city, budget, guest count, cultural traditions, food preferences, and
        what matters most to you.
      </p>

      <textarea
        id="event-free-text"
        rows={5}
        value={freeText}
        onChange={(e) => setFreeText(e.target.value)}
        placeholder="e.g., We are organizing a 3-day royal Marwari wedding in Jaipur for 350 guests in December 2026. Budget is 30 lakhs. We need pure veg food with a dedicated Jain counter, wheelchair ramp for grandparents, and our top priorities are royal heritage catering, cinematography, and sunset mandap decor..."
        className="w-full p-4 text-sm rounded-xl border border-utsav-cream-200 focus:border-utsav-saffron-500 focus:ring-1 focus:ring-utsav-saffron-500 bg-utsav-cream-50/50"
        disabled={isParsingAi}
      />

      {isParsingAi ? (
        <LoadingSkeleton
          lines={3}
          label="Analyzing constraints & crafting cultural recommendations..."
        />
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onLoadDemo}
            className="text-xs font-medium text-utsav-saffron-800 hover:text-utsav-saffron-900 underline cursor-pointer"
          >
            Or load pre-filled Royal Wedding Demo
          </button>

          <button
            type="button"
            onClick={onParse}
            disabled={!freeText.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-utsav-saffron-600 to-utsav-marigold-600 text-white shadow-md hover:from-utsav-saffron-700 hover:to-utsav-marigold-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Parse & Generate Plan</span>
          </button>
        </div>
      )}
    </div>
  );
};
