import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

interface WizardStep2Props {
  eventDate: string;
  setEventDate: (date: string) => void;
  city: string;
  setCity: (city: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const WizardStep2: React.FC<WizardStep2Props> = ({
  eventDate,
  setEventDate,
  city,
  setCity,
  theme,
  setTheme,
  onBack,
  onNext
}) => {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date-input" className="block text-xs font-bold text-utsav-cream-900 mb-1">
            Event Date:
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-utsav-cream-800" />
            <input
              id="date-input"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="city-input" className="block text-xs font-bold text-utsav-cream-900 mb-1">
            City / Venue Location:
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-utsav-cream-800" />
            <input
              id="city-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
              placeholder="e.g., Mumbai, Delhi, Udaipur"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="theme-input" className="block text-xs font-bold text-utsav-cream-900 mb-1">
          Ambiance & Aesthetic Theme:
        </label>
        <input
          id="theme-input"
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full p-2.5 text-xs rounded-xl border border-utsav-cream-200 focus:ring-1 focus:ring-utsav-saffron-500"
          placeholder="e.g. Royal Rajputana Heritage with Marigolds and Brass Diya Accents"
        />
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
          onClick={onNext}
          className="px-6 py-2 rounded-xl text-xs font-semibold bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 cursor-pointer"
        >
          Next: Traditions & Priorities &rarr;
        </button>
      </div>
    </div>
  );
};
