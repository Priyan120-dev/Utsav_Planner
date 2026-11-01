import React from 'react';
import { OccasionType } from '@utsav/shared';
import { IndianRupee, Users } from 'lucide-react';
import { OCCASIONS } from '../onboardingConstants.js';

interface WizardStep1Props {
  occasion: OccasionType;
  setOccasion: (occ: OccasionType) => void;
  title: string;
  setTitle: (title: string) => void;
  budgetINR: number;
  setBudgetINR: (budget: number) => void;
  guests: number;
  setGuests: (guests: number) => void;
  onNext: () => void;
}

export const WizardStep1: React.FC<WizardStep1Props> = ({
  occasion,
  setOccasion,
  title,
  setTitle,
  budgetINR,
  setBudgetINR,
  guests,
  setGuests,
  onNext
}) => {
  return (
    <div className="space-y-5">
      <div>
        <span className="block text-xs font-bold text-utsav-cream-900 mb-2">
          Select Occasion Type:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OCCASIONS.map((occ) => (
            <button
              key={occ.value}
              type="button"
              onClick={() => setOccasion(occ.value)}
              className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                occasion === occ.value
                  ? 'border-utsav-saffron-600 bg-utsav-saffron-50/70 text-utsav-saffron-950 ring-1 ring-utsav-saffron-600'
                  : 'border-utsav-cream-200 hover:bg-utsav-cream-50 text-utsav-cream-800'
              }`}
            >
              <span className="text-2xl">{occ.icon}</span>
              <div>
                <span className="font-semibold text-xs block text-utsav-cream-900">
                  {occ.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="event-title" className="block text-xs font-bold text-utsav-cream-900 mb-1">
          Celebration Title:
        </label>
        <input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
          placeholder="e.g. Pooja & Rahul's Vivah"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="budget-input"
            className="block text-xs font-bold text-utsav-cream-900 mb-1"
          >
            Total Estimated Budget (₹ INR):
          </label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-utsav-cream-800" />
            <input
              id="budget-input"
              type="number"
              step="50000"
              min="10000"
              value={budgetINR}
              onChange={(e) => setBudgetINR(Number(e.target.value) || 0)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-utsav-cream-200 font-semibold focus:ring-1 focus:ring-utsav-saffron-500"
            />
          </div>
          <span className="text-[11px] text-utsav-cream-800 mt-1 block">
            ₹{(budgetINR / 100000).toFixed(2)} Lakhs
          </span>
        </div>

        <div>
          <label
            htmlFor="guests-input"
            className="block text-xs font-bold text-utsav-cream-900 mb-1"
          >
            Expected Guest Count:
          </label>
          <div className="relative">
            <Users className="w-4 h-4 absolute left-3 top-3 text-utsav-cream-800" />
            <input
              id="guests-input"
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value) || 1)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-utsav-cream-200 font-semibold focus:ring-1 focus:ring-utsav-saffron-500"
            />
          </div>
          <span className="text-[11px] text-utsav-cream-800 mt-1 block">
            Average: ₹{guests > 0 ? Math.round(budgetINR / guests).toLocaleString('en-IN') : 0} per
            guest
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2 rounded-xl text-xs font-semibold bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 cursor-pointer"
        >
          Next: Date & Location &rarr;
        </button>
      </div>
    </div>
  );
};
