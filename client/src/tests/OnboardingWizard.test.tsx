import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard.js';
import { EventProvider, useEvent } from '../context/EventContext.js';
import * as api from '../services/api.js';

describe('OnboardingWizard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('displays a validation error when free-text description is too short (< 10 chars)', async () => {
    render(
      <EventProvider>
        <OnboardingWizard />
      </EventProvider>
    );

    const textarea = screen.getByLabelText(/Describe your event in plain Hindi or English/i);
    fireEvent.change(textarea, { target: { value: 'short' } });

    const submitBtn = screen.getByRole('button', { name: /Parse & Generate Plan/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(
        'Please write a brief description of your event (at least 10 characters).'
      )
    ).toBeInTheDocument();
  });

  it('displays a validation error when free-text description exceeds 5000 characters', async () => {
    render(
      <EventProvider>
        <OnboardingWizard />
      </EventProvider>
    );

    const textarea = screen.getByLabelText(/Describe your event in plain Hindi or English/i);
    const overlyLongText = 'A'.repeat(5001);
    fireEvent.change(textarea, { target: { value: overlyLongText } });

    const submitBtn = screen.getByRole('button', { name: /Parse & Generate Plan/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(
        'Event description cannot exceed 5000 characters. Please shorten your description.'
      )
    ).toBeInTheDocument();
  });

  it('displays AI follow-up clarification questions when returned by the parser', async () => {
    const mockFollowUpQuestions = [
      'Do you prefer indoor banquet halls or outdoor royal lawns for the Sangeet?',
      'Are there specific elder seating and accessibility arrangements needed near the Mandap?'
    ];

    vi.spyOn(api, 'parseProfileFromFreeText').mockResolvedValueOnce({
      occasion: 'wedding',
      title: 'Priya & Rohan Vivah',
      totalBudgetINR: 2500000,
      expectedGuests: 250,
      eventDate: '2026-11-20',
      city: 'Udaipur',
      atmosphereTheme: 'Royal Heritage',
      culturalNeeds: ['Sangeet', 'Haldi'],
      dietaryNeeds: ['Pure Vegetarian'],
      accessibilityNeeds: [],
      mustHaves: ['Folk Musicians'],
      priorities: ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
      followUpQuestions: mockFollowUpQuestions
    });

    render(
      <EventProvider>
        <OnboardingWizard />
      </EventProvider>
    );

    const textarea = screen.getByLabelText(/Describe your event in plain Hindi or English/i);
    fireEvent.change(textarea, {
      target: { value: 'Planning a royal wedding in Udaipur for 250 guests with 25 lakhs budget.' }
    });

    const submitBtn = screen.getByRole('button', { name: /Parse & Generate Plan/i });
    fireEvent.click(submitBtn);

    // Follow-up section should appear
    expect(
      await screen.findByText(/AI Orchestrator Clarification Questions \(Optional\):/i)
    ).toBeInTheDocument();

    expect(screen.getByText(mockFollowUpQuestions[0])).toBeInTheDocument();
    expect(screen.getByText(mockFollowUpQuestions[1])).toBeInTheDocument();

    // Verify input fields for follow-ups are interactive
    const answerInputs = screen.getAllByPlaceholderText(/Your answer \(optional\)\.\.\./i);
    expect(answerInputs).toHaveLength(2);

    fireEvent.change(answerInputs[0], { target: { value: 'Outdoor lawns preferred' } });
    expect(answerInputs[0]).toHaveValue('Outdoor lawns preferred');
  });

  it('triggers structured re-parse with answers and merges without overwriting confirmed fields', async () => {
    const parseSpy = vi.spyOn(api, 'parseProfileFromFreeText');

    // First call returns initial profile with followUpQuestions
    parseSpy.mockResolvedValueOnce({
      occasion: 'wedding',
      title: 'Confirmed Royal Wedding',
      totalBudgetINR: 2500000,
      expectedGuests: 250,
      eventDate: '2026-11-20',
      city: 'Udaipur',
      atmosphereTheme: 'Royal Heritage',
      culturalNeeds: ['Sangeet', 'Haldi'],
      dietaryNeeds: ['Pure Vegetarian'],
      accessibilityNeeds: [],
      mustHaves: ['Folk Musicians'],
      priorities: ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
      followUpQuestions: [
        'Do you have any specific dietary preferences?',
        'Are there elderly guests needing accessibility?'
      ]
    });

    // Second call (structured re-parse) returns enriched profile
    parseSpy.mockResolvedValueOnce({
      occasion: 'wedding',
      title: 'Should Not Overwrite User Confirmed Title',
      totalBudgetINR: 999999, // Should NOT overwrite confirmed 2500000
      expectedGuests: 50, // Should NOT overwrite confirmed 250
      eventDate: '2027-01-01', // Should NOT overwrite confirmed date
      city: 'Delhi', // Should NOT overwrite confirmed Udaipur
      atmosphereTheme: 'Royal Heritage',
      culturalNeeds: ['Sangeet', 'Haldi', 'Mehendi Ceremony'],
      dietaryNeeds: ['Jain Food Counter'],
      accessibilityNeeds: ['Wheelchair Ramps'],
      mustHaves: ['Folk Musicians', 'Golf Carts'],
      priorities: ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
      followUpQuestions: []
    });

    render(
      <EventProvider>
        <OnboardingWizard />
      </EventProvider>
    );

    const textarea = screen.getByLabelText(/Describe your event in plain Hindi or English/i);
    fireEvent.change(textarea, {
      target: { value: 'Planning a royal wedding in Udaipur for 250 guests with 25 lakhs budget.' }
    });

    const submitBtn = screen.getByRole('button', { name: /Parse & Generate Plan/i });
    fireEvent.click(submitBtn);

    // Wait for follow-ups to show
    expect(
      await screen.findByText(/AI Orchestrator Clarification Questions \(Optional\):/i)
    ).toBeInTheDocument();

    const answerInputs = screen.getAllByPlaceholderText(/Your answer \(optional\)\.\.\./i);
    fireEvent.change(answerInputs[0], { target: { value: 'Strict Jain food options needed' } });
    fireEvent.change(answerInputs[1], { target: { value: 'Grandparents need wheelchair access' } });

    // Click "Re-parse with Clarifications"
    const reparseBtn = screen.getByRole('button', { name: /Re-parse with Clarifications/i });
    fireEvent.click(reparseBtn);

    // Verify 2nd API call arguments: includes original text + answers, and existing confirmed profile
    await waitFor(() => expect(parseSpy).toHaveBeenCalledTimes(2));
    const [combinedTextArg, existingProfileArg] = parseSpy.mock.calls[1];
    expect(combinedTextArg).toContain('Planning a royal wedding in Udaipur');
    expect(combinedTextArg).toContain('CLARIFICATIONS & ANSWERS:');
    expect(combinedTextArg).toContain('Strict Jain food options needed');
    expect(combinedTextArg).toContain('Grandparents need wheelchair access');
    expect(existingProfileArg?.city).toBe('Udaipur');
    expect(existingProfileArg?.totalBudgetINR).toBe(2500000);
    expect(existingProfileArg?.title).toBe('Confirmed Royal Wedding');

    // Wait for clarification box to dismiss once follow-up questions are resolved
    await waitFor(() => {
      expect(
        screen.queryByText(/AI Orchestrator Clarification Questions/i)
      ).not.toBeInTheDocument();
    });

    // Verify Step 1 fields (Occasion & Scale) were preserved
    expect(screen.getByDisplayValue('Confirmed Royal Wedding')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2500000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('250')).toBeInTheDocument();

    // Navigate to Step 2: Date & Location
    const nextToStep2Btn = screen.getByRole('button', { name: /Next: Date & Location/i });
    fireEvent.click(nextToStep2Btn);

    // Verify Step 2 fields were preserved
    expect(screen.getByDisplayValue('Udaipur')).toBeInTheDocument();

    // Navigate to Step 3: Traditions & Priorities
    const nextToStep3Btn = screen.getByRole('button', { name: /Next: Traditions & Priorities/i });
    fireEvent.click(nextToStep3Btn);

    // Assert lists were merged in Step 3 without overwriting previous items
    const culturalInput = screen.getByDisplayValue(/Sangeet, Haldi, Mehendi Ceremony/i);
    expect(culturalInput).toBeInTheDocument();

    const dietaryInput = screen.getByDisplayValue(/Pure Vegetarian, Jain Food Counter/i);
    expect(dietaryInput).toBeInTheDocument();

    const accessInput = screen.getByDisplayValue(/Wheelchair Ramps/i);
    expect(accessInput).toBeInTheDocument();
  });

  it('allows completing the step-by-step guided wizard and toggling priorities', async () => {
    vi.spyOn(api, 'generateTimelineTasks').mockResolvedValueOnce({ tasks: [], hasCycles: false });

    const Consumer = () => {
      const { eventState } = useEvent();
      return (
        <div>
          <OnboardingWizard />
          {eventState && <div data-testid="initialized-title">{eventState.profile.title}</div>}
        </div>
      );
    };

    render(
      <EventProvider>
        <Consumer />
      </EventProvider>
    );

    // Switch to step-by-step guided wizard
    const guidedWizardBtn = screen.getByRole('button', { name: /Step-by-Step Guided Wizard/i });
    fireEvent.click(guidedWizardBtn);

    // Step 1: Occasion & Scale
    expect(screen.getByText('Select Occasion Type:')).toBeInTheDocument();
    const nextToStep2Btn = screen.getByRole('button', { name: /Next: Date & Location/i });
    fireEvent.click(nextToStep2Btn);

    // Step 2: Date & Location
    expect(screen.getByText(/Ambiance & Aesthetic Theme:/i)).toBeInTheDocument();
    const nextToStep3Btn = screen.getByRole('button', { name: /Next: Traditions & Priorities/i });
    fireEvent.click(nextToStep3Btn);

    // Step 3: Traditions & Priorities
    expect(screen.getByText(/Pick Your Top 3 Priorities/i)).toBeInTheDocument();

    // Toggle priority
    const priorityBtn = screen.getByRole('button', { name: /Music, DJ & Entertainment/i });
    fireEvent.click(priorityBtn);

    // Complete wizard
    const finishBtn = screen.getByRole('button', { name: /Generate Orchestrated Plan/i });
    fireEvent.click(finishBtn);

    expect(await screen.findByTestId('initialized-title')).toHaveTextContent(
      'Our Royal Family Celebration'
    );
  });

  it('allows loading pre-filled royal wedding demo directly from free-text tab', async () => {
    vi.spyOn(api, 'generateTimelineTasks').mockResolvedValueOnce({ tasks: [], hasCycles: false });

    const Consumer = () => {
      const { eventState } = useEvent();
      return (
        <div>
          <OnboardingWizard />
          {eventState && <div data-testid="demo-title">{eventState.profile.title}</div>}
        </div>
      );
    };

    render(
      <EventProvider>
        <Consumer />
      </EventProvider>
    );

    const demoBtn = screen.getByRole('button', { name: /Or load pre-filled Royal Wedding Demo/i });
    fireEvent.click(demoBtn);

    expect(await screen.findByTestId('demo-title')).toHaveTextContent(
      /Ananya & Rohit's Royal Palace Wedding/i
    );
  });
});
