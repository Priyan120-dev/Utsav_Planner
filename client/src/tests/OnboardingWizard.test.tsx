import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard.js';
import { EventProvider } from '../context/EventContext.js';
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
      await screen.findByText('Please write a brief description of your event (at least 10 characters).')
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
      await screen.findByText('Event description cannot exceed 5000 characters. Please shorten your description.')
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
});
