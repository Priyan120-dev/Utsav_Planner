import React from 'react';
import { useEvent } from '../../context/EventContext.js';
import { Calendar, Users, IndianRupee, MapPin, Sparkles, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { DisclaimerBadge } from '../common/DisclaimerBadge.js';

export const OverviewTab: React.FC = () => {
  const { eventState } = useEvent();
  if (!eventState) return null;

  const { profile, budget, timeline, vendorBriefs, quotes } = eventState;

  // Compute days until event
  const today = new Date();
  const eventDateObj = new Date(profile.eventDate);
  const diffTime = eventDateObj.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Compute Readiness Score (0 - 100%)
  const totalTasks = timeline.tasks.length;
  const doneTasks = timeline.tasks.filter(t => t.status === 'done').length;
  const taskProgress = totalTasks > 0 ? (doneTasks / totalTasks) * 40 : 10; // max 40 points
  const vendorBriefCount = Object.keys(vendorBriefs).length;
  const vendorProgress = Math.min(30, vendorBriefCount * 10); // max 30 points
  const quotesCount = quotes.length;
  const quotesProgress = Math.min(20, quotesCount * 5); // max 20 points
  const contingencyBonus = budget.contingencyPercent >= 5 ? 10 : 0; // 10 points
  const readinessScore = Math.min(100, Math.round(taskProgress + vendorProgress + quotesProgress + contingencyBonus));

  const recs = profile.recommendations;

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-utsav-saffron-700 via-utsav-saffron-600 to-utsav-marigold-600 text-white p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <span>🪔</span>
            <span className="capitalize">{profile.occasion} Celebration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            {profile.title}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-white/90">
            {profile.atmosphereTheme}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-white/95">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-utsav-marigold-200" />
              {profile.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-utsav-marigold-200" />
              {profile.eventDate} ({daysRemaining} days to go)
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-utsav-marigold-200" />
              {profile.expectedGuests} Guests
            </span>
          </div>
        </div>

        {/* Readiness Badge */}
        <div className="mt-6 sm:mt-0 sm:absolute sm:right-8 sm:top-1/2 sm:-translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[140px]">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-white/80 block">
            Readiness Score
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold font-display text-white">
            {readinessScore}%
          </span>
          <span className="text-[10px] text-white/90 block mt-0.5">
            {doneTasks}/{totalTasks} tasks complete
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-utsav-cream-200 shadow-xs">
          <div className="flex items-center justify-between text-utsav-cream-800 text-xs">
            <span>Total Budget</span>
            <IndianRupee className="w-4 h-4 text-utsav-saffron-600" />
          </div>
          <div className="mt-1 text-xl font-bold text-utsav-cream-900 font-display">
            ₹{budget.totalBudgetINR.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-utsav-cream-800">10 Categories</span>
            <DisclaimerBadge customText="Estimate" className="py-0 px-1.5 text-[10px]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-utsav-cream-200 shadow-xs">
          <div className="flex items-center justify-between text-utsav-cream-800 text-xs">
            <span>Per Guest Cost</span>
            <Users className="w-4 h-4 text-utsav-marigold-600" />
          </div>
          <div className="mt-1 text-xl font-bold text-utsav-cream-900 font-display">
            ₹{budget.perGuestTotalINR.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-utsav-cream-800 mt-1 block">
            Based on {profile.expectedGuests} invited
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-utsav-cream-200 shadow-xs">
          <div className="flex items-center justify-between text-utsav-cream-800 text-xs">
            <span>Contingency Buffer</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-xl font-bold text-utsav-emerald-700 font-display">
            {budget.contingencyPercent}%
          </div>
          <span className="text-[11px] text-utsav-cream-800 mt-1 block">
            ₹{budget.categories.contingency?.allocatedAmountINR.toLocaleString('en-IN')} emergency reserve
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-utsav-cream-200 shadow-xs">
          <div className="flex items-center justify-between text-utsav-cream-800 text-xs">
            <span>Vendor Coordination</span>
            <Sparkles className="w-4 h-4 text-utsav-indigo-700" />
          </div>
          <div className="mt-1 text-xl font-bold text-utsav-cream-900 font-display">
            {quotes.length} Quotes
          </div>
          <span className="text-[11px] text-utsav-cream-800 mt-1 block">
            {vendorBriefCount} category briefs drafted
          </span>
        </div>
      </div>

      {/* Top 3 Priorities */}
      <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs">
        <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-utsav-saffron-600" />
          <span>Core Host Priorities (Budget Weighting Applied)</span>
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {profile.priorities.map((prio, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-utsav-saffron-50 text-utsav-saffron-900 border border-utsav-saffron-200 font-semibold text-xs"
            >
              <span className="w-4 h-4 rounded-full bg-utsav-saffron-600 text-white text-[10px] flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              <span>{prio}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tailored Cultural Recommendations (Pillar 1) */}
      {recs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Themes & Decor */}
          <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2 mb-2">
                <span>🎨</span>
                <span>Tailored Decor & Theme Directions</span>
              </h4>
              <ul className="space-y-2 text-xs text-utsav-cream-800">
                {recs.themes?.map((th, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-utsav-saffron-600 mt-0.5 flex-shrink-0" />
                    <span>{th}</span>
                  </li>
                ))}
              </ul>
            </div>

            {recs.decorIdeas?.length > 0 && (
              <div className="pt-2 border-t border-utsav-cream-100">
                <span className="text-[11px] font-semibold text-utsav-cream-900 block mb-1">
                  Specific Decor Motifs:
                </span>
                <ul className="space-y-1 text-xs text-utsav-cream-800">
                  {recs.decorIdeas.map((di, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-utsav-marigold-600 font-bold">&bull;</span>
                      <span>{di}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Menu Directions & Traditions */}
          <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2 mb-2">
                <span>🍽️</span>
                <span>Culturally Attuned Menu Directions</span>
              </h4>
              <ul className="space-y-2 text-xs text-utsav-cream-800">
                {recs.menuDirections?.map((menu, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-utsav-emerald-700 mt-0.5 flex-shrink-0" />
                    <span>{menu}</span>
                  </li>
                ))}
              </ul>
            </div>

            {recs.culturalNotes?.length > 0 && (
              <div className="pt-2 border-t border-utsav-cream-100">
                <span className="text-[11px] font-semibold text-utsav-cream-900 block mb-1">
                  Ceremony & Hospitality Etiquette:
                </span>
                <ul className="space-y-1 text-xs text-utsav-cream-800">
                  {recs.culturalNotes.map((cn, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-utsav-saffron-600 font-bold">&bull;</span>
                      <span>{cn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Constraints & Inclusions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-utsav-cream-200 text-xs">
          <span className="font-bold text-utsav-cream-900 block mb-1">Ceremonies & Traditions</span>
          <p className="text-utsav-cream-800">{profile.culturalNeeds.join(', ') || 'Standard'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-utsav-cream-200 text-xs">
          <span className="font-bold text-utsav-cream-900 block mb-1">Dietary Arrangements</span>
          <p className="text-utsav-cream-800">{profile.dietaryNeeds.join(', ') || 'Standard Dining'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-utsav-cream-200 text-xs">
          <span className="font-bold text-utsav-cream-900 block mb-1">Accessibility Provisions</span>
          <p className="text-utsav-cream-800">{profile.accessibilityNeeds.join(', ') || 'Standard Access'}</p>
        </div>
      </div>
    </div>
  );
};
