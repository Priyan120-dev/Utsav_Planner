import React, { useState } from 'react';
import { OccasionType, EventProfile } from '@utsav/shared';
import { useEvent } from '../../context/EventContext.js';
import * as api from '../../services/api.js';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Heart,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { ErrorAlert } from '../common/ErrorAlert.js';
import { LoadingSkeleton } from '../common/LoadingSkeleton.js';

const OCCASIONS: { value: OccasionType; label: string; icon: string }[] = [
  { value: 'wedding', label: 'Wedding (Vivah / Shaadi)', icon: '💍' },
  { value: 'birthday', label: 'Milestone Birthday (Janamdin)', icon: '🎂' },
  { value: 'community', label: 'Community Festival (Utsav)', icon: '🪔' },
  { value: 'anniversary', label: 'Anniversary (Varshikotsav)', icon: '🥂' },
  { value: 'cultural_festival', label: 'Cultural & Religious Function', icon: '🌸' }
];

const POPULAR_PRIORITIES = [
  'Catering & Dining',
  'Decor, Mandap & Lighting',
  'Photography & Cinematic Video',
  'Music, DJ & Entertainment',
  'Venue & Grounds',
  'Attire & Styling',
  'Guest Transport & Logistics',
  'Invitations & Digital RSVP'
];

export const OnboardingWizard: React.FC = () => {
  const { initializeEvent, loadDemoEvent } = useEvent();

  // Mode: 'free_text' vs 'wizard'
  const [mode, setMode] = useState<'free_text' | 'wizard'>('free_text');
  const [freeText, setFreeText] = useState<string>('');
  const [isParsingAi, setIsParsingAi] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Targeted follow-up questions from AI
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<number, string>>({});
  const [recommendations, setRecommendations] = useState<any>(null);

  // Wizard step state
  const [step, setStep] = useState<number>(1);
  const [occasion, setOccasion] = useState<OccasionType>('wedding');
  const [title, setTitle] = useState<string>('Our Royal Family Celebration');
  const [budgetINR, setBudgetINR] = useState<number>(2500000);
  const [guests, setGuests] = useState<number>(300);
  const [eventDate, setEventDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [city, setCity] = useState<string>('Jaipur, Rajasthan');
  const [theme, setTheme] = useState<string>('Regal heritage with marigold & brass aesthetics');
  const [culturalNeedsText, setCulturalNeedsText] = useState<string>(
    'Haldi, Mehendi, Sangeet & Vedic Pheras'
  );
  const [dietaryNeedsText, setDietaryNeedsText] = useState<string>(
    'Pure Vegetarian with dedicated Jain cuisine counter'
  );
  const [accessibilityNeedsText, setAccessibilityNeedsText] = useState<string>(
    'Wheelchair access to mandap and seating for elders'
  );
  const [mustHavesText, setMustHavesText] = useState<string>(
    'Live Shehnai at gate, 4K Cinematic drone film'
  );
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    'Catering & Dining',
    'Photography & Cinematic Video',
    'Decor, Mandap & Lighting'
  ]);

  // Helper to merge parsed profile into wizard state without overwriting confirmed fields
  const applyParsedProfile = (parsed: any, isReparse = false) => {
    if (!isReparse) {
      if (parsed.occasion) setOccasion(parsed.occasion);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.totalBudgetINR) setBudgetINR(parsed.totalBudgetINR);
      if (parsed.expectedGuests) setGuests(parsed.expectedGuests);
      if (parsed.eventDate) setEventDate(parsed.eventDate);
      if (parsed.city) setCity(parsed.city);
      if (parsed.atmosphereTheme) setTheme(parsed.atmosphereTheme);
      if (parsed.culturalNeeds?.length) setCulturalNeedsText(parsed.culturalNeeds.join(', '));
      if (parsed.dietaryNeeds?.length) setDietaryNeedsText(parsed.dietaryNeeds.join(', '));
      if (parsed.accessibilityNeeds?.length)
        setAccessibilityNeedsText(parsed.accessibilityNeeds.join(', '));
      if (parsed.mustHaves?.length) setMustHavesText(parsed.mustHaves.join(', '));
      if (parsed.priorities?.length === 3) setSelectedPriorities(parsed.priorities);
    } else {
      // Structured re-parse merge: preserve confirmed scalar fields, merge list arrays
      if (parsed.culturalNeeds?.length) {
        const existing = culturalNeedsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...existing, ...parsed.culturalNeeds]));
        setCulturalNeedsText(merged.join(', '));
      }
      if (parsed.dietaryNeeds?.length) {
        const existing = dietaryNeedsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...existing, ...parsed.dietaryNeeds]));
        setDietaryNeedsText(merged.join(', '));
      }
      if (parsed.accessibilityNeeds?.length) {
        const existing = accessibilityNeedsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...existing, ...parsed.accessibilityNeeds]));
        setAccessibilityNeedsText(merged.join(', '));
      }
      if (parsed.mustHaves?.length) {
        const existing = mustHavesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...existing, ...parsed.mustHaves]));
        setMustHavesText(merged.join(', '));
      }
      // Only adopt new title/theme if user hasn't explicitly customized them
      if (!title || title === 'Our Royal Family Celebration') {
        if (parsed.title) setTitle(parsed.title);
      }
      if (!theme || theme === 'Regal heritage with marigold & brass aesthetics') {
        if (parsed.atmosphereTheme) setTheme(parsed.atmosphereTheme);
      }
    }

    if (parsed.recommendations) {
      setRecommendations(parsed.recommendations);
    }

    if (parsed.followUpQuestions && parsed.followUpQuestions.length > 0) {
      setFollowUpQuestions(parsed.followUpQuestions);
    } else {
      setFollowUpQuestions([]);
    }
  };

  // Build combined text containing original free text and answered follow-up questions
  const buildCombinedPromptText = () => {
    const clarifications = followUpQuestions
      .map((q, idx) => {
        const a = followUpAnswers[idx]?.trim();
        return a ? `Question: ${q}\nAnswer: ${a}` : null;
      })
      .filter(Boolean)
      .join('\n\n');

    return clarifications
      ? `${freeText}\n\nCLARIFICATIONS & ANSWERS:\n${clarifications}`
      : freeText;
  };

  // Build current confirmed profile object
  const getConfirmedProfileContext = (): Partial<EventProfile> => ({
    occasion,
    title,
    totalBudgetINR: budgetINR,
    expectedGuests: guests,
    eventDate,
    city,
    atmosphereTheme: theme,
    culturalNeeds: culturalNeedsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    dietaryNeeds: dietaryNeedsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    accessibilityNeeds: accessibilityNeedsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    mustHaves: mustHavesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    priorities: selectedPriorities as [string, string, string],
    recommendations
  });

  // Explicit structured re-parse when user answers follow-up questions
  const handleReparseWithAnswers = async () => {
    const hasAnswers = Object.values(followUpAnswers).some((a) => a && a.trim());
    if (!hasAnswers) return;

    setIsParsingAi(true);
    setParseError(null);

    try {
      const combined = buildCombinedPromptText();
      const existing = getConfirmedProfileContext();
      const reparsed = await api.parseProfileFromFreeText(combined, existing);
      applyParsedProfile(reparsed, true);
    } catch (err: any) {
      setParseError(err.message || 'Failed to re-parse clarifications with AI.');
    } finally {
      setIsParsingAi(false);
    }
  };

  // Handle Free-text AI parsing
  const handleParseFreeText = async () => {
    if (!freeText.trim() || freeText.length < 10) {
      setParseError('Please write a brief description of your event (at least 10 characters).');
      return;
    }
    if (freeText.length > 5000) {
      setParseError(
        'Event description cannot exceed 5000 characters. Please shorten your description.'
      );
      return;
    }

    setIsParsingAi(true);
    setParseError(null);

    try {
      const parsed = await api.parseProfileFromFreeText(freeText);
      applyParsedProfile(parsed, false);

      if (!parsed.followUpQuestions || parsed.followUpQuestions.length === 0) {
        // If parsed cleanly with no ambiguities, directly initialize!
        const profile: EventProfile = {
          occasion: parsed.occasion || occasion,
          title: parsed.title || title,
          totalBudgetINR: parsed.totalBudgetINR || budgetINR,
          expectedGuests: parsed.expectedGuests || guests,
          eventDate: parsed.eventDate || eventDate,
          city: parsed.city || city,
          atmosphereTheme: parsed.atmosphereTheme || theme,
          culturalNeeds: parsed.culturalNeeds || [culturalNeedsText],
          dietaryNeeds: parsed.dietaryNeeds || [dietaryNeedsText],
          accessibilityNeeds: parsed.accessibilityNeeds || [accessibilityNeedsText],
          mustHaves: parsed.mustHaves || [mustHavesText],
          priorities:
            (parsed.priorities as [string, string, string]) || (selectedPriorities as any),
          recommendations: parsed.recommendations
        };
        await initializeEvent(profile);
        return;
      }

      setMode('wizard');
      setStep(1);
    } catch (err: any) {
      setParseError(
        err.message || 'Failed to parse text. Please try again or switch to the guided wizard.'
      );
    } finally {
      setIsParsingAi(false);
    }
  };

  // Toggle priority selection (max 3)
  const togglePriority = (prio: string) => {
    if (selectedPriorities.includes(prio)) {
      if (selectedPriorities.length > 1) {
        setSelectedPriorities(selectedPriorities.filter((p) => p !== prio));
      }
    } else {
      if (selectedPriorities.length < 3) {
        setSelectedPriorities([...selectedPriorities, prio]);
      } else {
        // replace first
        setSelectedPriorities([selectedPriorities[1], selectedPriorities[2], prio]);
      }
    }
  };

  // Complete wizard
  const handleCompleteWizard = async () => {
    // If user answered follow-up questions, run structured re-parse and merge
    let finalCultural = culturalNeedsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    let finalDietary = dietaryNeedsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    let finalAccess = accessibilityNeedsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    let finalMustHaves = mustHavesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    let finalRecs = recommendations;

    const hasAnswers = Object.values(followUpAnswers).some((a) => a && a.trim());
    if (hasAnswers) {
      try {
        const combined = buildCombinedPromptText();
        const existing = getConfirmedProfileContext();
        const reparsed = await api.parseProfileFromFreeText(combined, existing);
        if (reparsed.culturalNeeds?.length) {
          finalCultural = Array.from(new Set([...finalCultural, ...reparsed.culturalNeeds]));
        }
        if (reparsed.dietaryNeeds?.length) {
          finalDietary = Array.from(new Set([...finalDietary, ...reparsed.dietaryNeeds]));
        }
        if (reparsed.accessibilityNeeds?.length) {
          finalAccess = Array.from(new Set([...finalAccess, ...reparsed.accessibilityNeeds]));
        }
        if (reparsed.mustHaves?.length) {
          finalMustHaves = Array.from(new Set([...finalMustHaves, ...reparsed.mustHaves]));
        }
        if (reparsed.recommendations) {
          finalRecs = reparsed.recommendations;
        }
      } catch (err) {
        console.warn(
          'Re-parse prior to plan generation encountered an issue, proceeding with confirmed fields:',
          err
        );
      }
    }

    const profile: EventProfile = {
      occasion,
      title,
      totalBudgetINR: budgetINR,
      expectedGuests: guests,
      eventDate,
      city,
      atmosphereTheme: theme,
      culturalNeeds: finalCultural,
      dietaryNeeds: finalDietary,
      accessibilityNeeds: finalAccess,
      mustHaves: finalMustHaves,
      priorities: [
        selectedPriorities[0] || 'Catering & Dining',
        selectedPriorities[1] || 'Decor, Mandap & Lighting',
        selectedPriorities[2] || 'Photography & Cinematic Video'
      ],
      recommendations: finalRecs
    };

    await initializeEvent(profile);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Branding */}
      <div className="text-center mb-8">
        <span className="inline-block p-2 rounded-2xl bg-utsav-saffron-100 text-2xl shadow-inner mb-3">
          🪔
        </span>
        <h2 className="text-3xl font-extrabold text-utsav-cream-900 font-display">
          Plan Your Auspicious Celebration
        </h2>
        <p className="mt-2 text-sm text-utsav-cream-800 max-w-xl mx-auto">
          From multi-day Vedic weddings to milestone birthdays, Utsav Planner crafts tailored
          budgets, sequenced dependency timelines, and vendor coordination with real-time AI.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center mb-6">
        <div className="bg-utsav-cream-100 p-1 rounded-xl flex items-center gap-1 border border-utsav-cream-200">
          <button
            type="button"
            onClick={() => setMode('free_text')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'free_text'
                ? 'bg-white text-utsav-saffron-900 shadow-xs'
                : 'text-utsav-cream-800 hover:text-utsav-cream-900'
            }`}
          >
            ✨ Describe Event (AI Parser)
          </button>
          <button
            type="button"
            onClick={() => setMode('wizard')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'wizard'
                ? 'bg-white text-utsav-saffron-900 shadow-xs'
                : 'text-utsav-cream-800 hover:text-utsav-cream-900'
            }`}
          >
            📋 Step-by-Step Guided Wizard
          </button>
        </div>
      </div>

      {parseError && <ErrorAlert message={parseError} onDismiss={() => setParseError(null)} />}

      {/* FREE TEXT PARSER TAB */}
      {mode === 'free_text' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-utsav-cream-200 shadow-md">
          <label
            htmlFor="event-free-text"
            className="block text-sm font-bold text-utsav-cream-900 mb-1"
          >
            Describe your event in plain Hindi or English:
          </label>
          <p className="text-xs text-utsav-cream-800 mb-4">
            Mention the occasion, city, budget, guest count, cultural traditions, food preferences,
            and what matters most to you.
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
                onClick={loadDemoEvent}
                className="text-xs font-medium text-utsav-saffron-800 hover:text-utsav-saffron-900 underline cursor-pointer"
              >
                Or load pre-filled Royal Wedding Demo
              </button>

              <button
                type="button"
                onClick={handleParseFreeText}
                disabled={!freeText.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-utsav-saffron-600 to-utsav-marigold-600 text-white shadow-md hover:from-utsav-saffron-700 hover:to-utsav-marigold-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Parse & Generate Plan</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* GUIDED WIZARD TAB */}
      {mode === 'wizard' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-utsav-cream-200 shadow-md">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-utsav-cream-100">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= stepNum
                      ? 'bg-utsav-saffron-600 text-white'
                      : 'bg-utsav-cream-100 text-utsav-cream-800'
                  }`}
                >
                  {stepNum}
                </span>
                <span className="text-xs font-medium hidden sm:inline text-utsav-cream-800">
                  {stepNum === 1
                    ? 'Occasion & Scale'
                    : stepNum === 2
                      ? 'Date & Location'
                      : 'Traditions & Priorities'}
                </span>
              </div>
            ))}
          </div>

          {/* Follow-up questions alert if parsed */}
          {followUpQuestions.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
              <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>AI Orchestrator Clarification Questions (Optional):</span>
              </div>
              <div className="space-y-3">
                {followUpQuestions.map((q, idx) => (
                  <div key={idx} className="text-xs">
                    <p className="font-medium text-amber-900 mb-1">{q}</p>
                    <input
                      type="text"
                      placeholder="Your answer (optional)..."
                      value={followUpAnswers[idx] || ''}
                      onChange={(e) =>
                        setFollowUpAnswers({ ...followUpAnswers, [idx]: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:ring-1 focus:ring-utsav-saffron-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3.5 flex justify-end">
                <button
                  type="button"
                  onClick={handleReparseWithAnswers}
                  disabled={
                    isParsingAi || !Object.values(followUpAnswers).some((a) => a && a.trim())
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isParsingAi ? 'Re-parsing with AI...' : 'Re-parse with Clarifications'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Occasion & Scale */}
          {step === 1 && (
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
                <label
                  htmlFor="event-title"
                  className="block text-xs font-bold text-utsav-cream-900 mb-1"
                >
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
                    Average: ₹
                    {guests > 0 ? Math.round(budgetINR / guests).toLocaleString('en-IN') : 0} per
                    guest
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 rounded-xl text-xs font-semibold bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 cursor-pointer"
                >
                  Next: Date & Location &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Date & Location */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date-input"
                    className="block text-xs font-bold text-utsav-cream-900 mb-1"
                  >
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
                  <label
                    htmlFor="city-input"
                    className="block text-xs font-bold text-utsav-cream-900 mb-1"
                  >
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
                <label
                  htmlFor="theme-input"
                  className="block text-xs font-bold text-utsav-cream-900 mb-1"
                >
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
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-utsav-cream-800 hover:bg-utsav-cream-100 cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2 rounded-xl text-xs font-semibold bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 cursor-pointer"
                >
                  Next: Traditions & Priorities &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Cultural Needs & Top 3 Priorities */}
          {step === 3 && (
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
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-utsav-cream-800 hover:bg-utsav-cream-100 cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleCompleteWizard}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-utsav-saffron-600 to-utsav-marigold-600 text-white shadow-md hover:from-utsav-saffron-700 hover:to-utsav-marigold-700 cursor-pointer"
                >
                  <Heart className="w-4 h-4" />
                  <span>Generate Orchestrated Plan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
