import React from 'react';
import { CheckCircle2, Heart } from 'lucide-react';
import { POPULAR_PRIORITIES } from '../onboardingConstants.js';

interface WizardStep3Props {
  selectedPriorities: string[];
  togglePriority: (prio: string) => void;
  culturalNeedsText: string;
  setCulturalNeedsText: (text: string) => void;
  dietaryNeedsText: string;
  setDietaryNeedsText: (text: string) => void;
  accessibilityNeedsText: string;
  setAccessibilityNeedsText: (text: string) => void;
  mustHavesText: string;
  setMustHavesText: (text: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export const WizardStep3: React.FC<WizardStep3Props> = ({
  selectedPriorities,
  togglePriority,
  culturalNeedsText,
  setCulturalNeedsText,
  dietaryNeedsText,
  setDietaryNeedsText,
  accessibilityNeedsText,
  setAccessibilityNeedsText,
  mustHavesText,
  setMustHavesText,
  onBack,
  onSubmit
}) => {
  return (
    <div className="space-y-5">
      <div>
        <span className="block text-xs font-bold text-utsav-cream-900 mb-1">
          Pick Your Top 3 Priorities (Allocates Budget Weighting):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {POPULAR_PRIORITIES.map((prio) => {
            const isSelected = selectedPriorities.includes(prio);
            return (
              <button
                key={prio}
                type="button"
                onClick={() => togglePriority(prio)}
                className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-utsav-saffron-100 border-utsav-saffron-600 text-utsav-saffron-950 font-semibold'
                    : 'bg-utsav-cream-50 border-utsav-cream-200 text-utsav-cream-800 hover:bg-utsav-cream-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{prio}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-utsav-saffron-700 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cultural-input"
            className="block text-xs font-bold text-utsav-cream-900 mb-1"
          >
            Cultural Ceremonies & Traditions:
          </label>
          <textarea
            id="cultural-input"
            rows={2}
            value={culturalNeedsText}
            onChange={(e) => setCulturalNeedsText(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
            placeholder="e.g. Sangeet, Mehendi, Haldi, Muhurat Pheras"
          />
        </div>

        <div>
          <label
            htmlFor="dietary-input"
            className="block text-xs font-bold text-utsav-cream-900 mb-1"
          >
            Dietary Requirements:
          </label>
          <textarea
            id="dietary-input"
            rows={2}
            value={dietaryNeedsText}
            onChange={(e) => setDietaryNeedsText(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
            placeholder="e.g. Pure Veg, Jain (no root veg), Vegan counter"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="access-input"
            className="block text-xs font-bold text-utsav-cream-900 mb-1"
          >
            Accessibility Needs:
          </label>
          <input
            id="access-input"
            type="text"
            value={accessibilityNeedsText}
            onChange={(e) => setAccessibilityNeedsText(e.target.value)}
            className="w-full p-2 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
            placeholder="e.g. Wheelchair ramp, elderly seating"
          />
        </div>

        <div>
          <label
            htmlFor="musthaves-input"
            className="block text-xs font-bold text-utsav-cream-900 mb-1"
          >
            Non-Negotiable Must-Haves:
          </label>
          <input
            id="musthaves-input"
            type="text"
            value={mustHavesText}
            onChange={(e) => setMustHavesText(e.target.value)}
            className="w-full p-2 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
            placeholder="e.g. Live Shehnai, Drone photography"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-medium text-utsav-cream-800 hover:bg-utsav-cream-100 cursor-pointer"
        >
          &larr; Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-utsav-saffron-600 to-utsav-marigold-600 text-white shadow-md hover:from-utsav-saffron-700 hover:to-utsav-marigold-700 cursor-pointer"
        >
          <Heart className="w-4 h-4" />
          <span>Generate Orchestrated Plan</span>
        </button>
      </div>
    </div>
  );
};
