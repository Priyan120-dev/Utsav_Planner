import React, { useState } from 'react';
import { OccasionType, EventProfile } from '@utsav/shared';
import { useEvent } from '../../context/EventContext.js';
import * as api from '../../services/api.js';
import { ErrorAlert } from '../common/ErrorAlert.js';
import {
  DEFAULT_PRIORITIES,
  MIN_FREE_TEXT_LENGTH,
  MAX_FREE_TEXT_LENGTH
} from './onboardingConstants.js';
import {
  mergeCommaSeparatedValues,
  parseCommaSeparatedList,
  buildCombinedPromptText
} from './profileMergeHelpers.js';
import { FreeTextParserCard } from './FreeTextParserCard.js';
import { FollowUpQuestionsCard } from './FollowUpQuestionsCard.js';
import { WizardStep1 } from './steps/WizardStep1.js';
import { WizardStep2 } from './steps/WizardStep2.js';
import { WizardStep3 } from './steps/WizardStep3.js';

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
  const [recommendations, setRecommendations] = useState<
    api.ParsedProfileResult['recommendations'] | null
  >(null);

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
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([...DEFAULT_PRIORITIES]);

  // Helper to merge parsed profile into wizard state without overwriting confirmed fields
  const applyParsedProfile = (parsed: api.ParsedProfileResult, isReparse = false) => {
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
        setCulturalNeedsText(mergeCommaSeparatedValues(culturalNeedsText, parsed.culturalNeeds));
      }
      if (parsed.dietaryNeeds?.length) {
        setDietaryNeedsText(mergeCommaSeparatedValues(dietaryNeedsText, parsed.dietaryNeeds));
      }
      if (parsed.accessibilityNeeds?.length) {
        setAccessibilityNeedsText(
          mergeCommaSeparatedValues(accessibilityNeedsText, parsed.accessibilityNeeds)
        );
      }
      if (parsed.mustHaves?.length) {
        setMustHavesText(mergeCommaSeparatedValues(mustHavesText, parsed.mustHaves));
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

  // Build current confirmed profile object
  const getConfirmedProfileContext = (): Partial<EventProfile> => ({
    occasion,
    title,
    totalBudgetINR: budgetINR,
    expectedGuests: guests,
    eventDate,
    city,
    atmosphereTheme: theme,
    culturalNeeds: parseCommaSeparatedList(culturalNeedsText),
    dietaryNeeds: parseCommaSeparatedList(dietaryNeedsText),
    accessibilityNeeds: parseCommaSeparatedList(accessibilityNeedsText),
    mustHaves: parseCommaSeparatedList(mustHavesText),
    priorities: selectedPriorities as [string, string, string],
    recommendations: recommendations ?? undefined
  });

  // Explicit structured re-parse when user answers follow-up questions
  const handleReparseWithAnswers = async () => {
    const hasAnswers = Object.values(followUpAnswers).some((a) => a && a.trim());
    if (!hasAnswers) return;

    setIsParsingAi(true);
    setParseError(null);

    try {
      const combined = buildCombinedPromptText(freeText, followUpQuestions, followUpAnswers);
      const existing = getConfirmedProfileContext();
      const reparsed = await api.parseProfileFromFreeText(combined, existing);
      applyParsedProfile(reparsed, true);
    } catch (err: unknown) {
      setParseError(
        err instanceof Error && err.message
          ? err.message
          : 'Failed to re-parse clarifications with AI.'
      );
    } finally {
      setIsParsingAi(false);
    }
  };

  // Handle Free-text AI parsing
  const handleParseFreeText = async () => {
    if (!freeText.trim() || freeText.length < MIN_FREE_TEXT_LENGTH) {
      setParseError('Please write a brief description of your event (at least 10 characters).');
      return;
    }
    if (freeText.length > MAX_FREE_TEXT_LENGTH) {
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
        const fallbackPriorities: [string, string, string] = [
          selectedPriorities[0] || 'Catering & Dining',
          selectedPriorities[1] || 'Photography & Cinematic Video',
          selectedPriorities[2] || 'Decor, Mandap & Lighting'
        ];
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
          priorities: (parsed.priorities as [string, string, string]) || fallbackPriorities,
          recommendations: parsed.recommendations
        };
        await initializeEvent(profile);
        return;
      }

      setMode('wizard');
      setStep(1);
    } catch (err: unknown) {
      setParseError(
        (err instanceof Error && err.message) ||
          'Failed to parse text. Please try again or switch to the guided wizard.'
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
    let finalCultural = parseCommaSeparatedList(culturalNeedsText);
    let finalDietary = parseCommaSeparatedList(dietaryNeedsText);
    let finalAccess = parseCommaSeparatedList(accessibilityNeedsText);
    let finalMustHaves = parseCommaSeparatedList(mustHavesText);
    let finalRecs = recommendations;

    const hasAnswers = Object.values(followUpAnswers).some((a) => a && a.trim());
    if (hasAnswers) {
      try {
        const combined = buildCombinedPromptText(freeText, followUpQuestions, followUpAnswers);
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
      recommendations: finalRecs ?? undefined
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
        <FreeTextParserCard
          freeText={freeText}
          setFreeText={setFreeText}
          isParsingAi={isParsingAi}
          onParse={handleParseFreeText}
          onLoadDemo={loadDemoEvent}
        />
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
          <FollowUpQuestionsCard
            followUpQuestions={followUpQuestions}
            followUpAnswers={followUpAnswers}
            onAnswerChange={(idx, val) => setFollowUpAnswers((prev) => ({ ...prev, [idx]: val }))}
            onReparse={handleReparseWithAnswers}
            isParsingAi={isParsingAi}
          />

          {/* STEP 1: Occasion & Scale */}
          {step === 1 && (
            <WizardStep1
              occasion={occasion}
              setOccasion={setOccasion}
              title={title}
              setTitle={setTitle}
              budgetINR={budgetINR}
              setBudgetINR={setBudgetINR}
              guests={guests}
              setGuests={setGuests}
              onNext={() => setStep(2)}
            />
          )}

          {/* STEP 2: Date & Location */}
          {step === 2 && (
            <WizardStep2
              eventDate={eventDate}
              setEventDate={setEventDate}
              city={city}
              setCity={setCity}
              theme={theme}
              setTheme={setTheme}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {/* STEP 3: Cultural Needs & Top 3 Priorities */}
          {step === 3 && (
            <WizardStep3
              selectedPriorities={selectedPriorities}
              togglePriority={togglePriority}
              culturalNeedsText={culturalNeedsText}
              setCulturalNeedsText={setCulturalNeedsText}
              dietaryNeedsText={dietaryNeedsText}
              setDietaryNeedsText={setDietaryNeedsText}
              accessibilityNeedsText={accessibilityNeedsText}
              setAccessibilityNeedsText={setAccessibilityNeedsText}
              mustHavesText={mustHavesText}
              setMustHavesText={setMustHavesText}
              onBack={() => setStep(2)}
              onSubmit={handleCompleteWizard}
            />
          )}
        </div>
      )}
    </div>
  );
};
