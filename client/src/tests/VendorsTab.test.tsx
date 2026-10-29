import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorsTab } from '../components/dashboard/VendorsTab.js';
import { EventProvider } from '../context/EventContext.js';
import * as api from '../services/api.js';
import { EventState, EventProfile, initializeBudgetState, QuoteItem, VendorBrief } from '@utsav/shared';

describe('VendorsTab Component', () => {
  const STORAGE_KEY = 'utsav_planner_event_state_v1';

  const mockProfile: EventProfile = {
    occasion: 'wedding',
    title: 'Jaipur Palace Wedding',
    totalBudgetINR: 2500000,
    expectedGuests: 250,
    eventDate: '2026-11-20',
    city: 'Jaipur',
    atmosphereTheme: 'Heritage',
    culturalNeeds: ['Sangeet'],
    dietaryNeeds: ['Pure Veg'],
    accessibilityNeeds: [],
    mustHaves: ['Live shehnai'],
    priorities: ['Catering & Dining', 'Venue & Grounds', 'Decor, Mandap & Lighting'],
    followUpQuestions: []
  };

  const mockExistingQuote: QuoteItem = {
    id: 'quote-test-1',
    category: 'catering',
    vendorName: 'Royal Rajputana Caterers',
    basePriceINR: 25000,
    tiers: [
      { upToGuests: 150, pricePerPlate: 1200 },
      { upToGuests: 300, pricePerPlate: 1000 }
    ],
    guestCapacity: null,
    inclusions: ['Welcome drinks', 'Multi-course dinner buffet'],
    exclusions: ['Packaged mineral water'],
    additionalChargesINR: 5000,
    additionalChargesBreakdown: [
      { item: 'Staff service gratuity', amountINR: 5000 }
    ],
    paymentTerms: '50% advance, balance on event day',
    cancellationPolicy: 'Non-refundable advance within 30 days',
    missingInfo: ['Guest capacity unstated'],
    redFlags: ['High overtime charges after 11 PM'],
    computedTotalCostINR: 280000,
    availabilityDisclaimer: 'Availability not verified: confirm directly with vendor.'
  };

  const mockBrief: VendorBrief & { category: 'catering' } = {
    category: 'catering',
    scopeSummary: 'Full catering service for 250 guests',
    keyInclusions: ['3-course buffet', 'Welcome drinks'],
    capacityRequirement: '250 guests',
    timingDetails: 'Dinner 7 PM - 11 PM',
    accessibilityRequirements: ['Wheelchair accessible buffet'],
    negotiationQuestions: [
      'Is tasting included before contract signing?',
      'What is your staff-to-guest ratio?'
    ]
  };

  const mockInitialState: EventState = {
    version: 1,
    id: 'evt-vendors-test',
    profile: mockProfile,
    budget: initializeBudgetState(2500000, 'wedding', mockProfile.priorities, 250),
    timeline: {
      tasks: [],
      eventDate: '2026-11-20',
      hasCycles: false,
      criticalPathTaskIds: []
    },
    vendorBriefs: {
      catering: mockBrief
    },
    quotes: [mockExistingQuote],
    changeLog: [],
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockInitialState));
  });

  it('renders top banner, category chips, existing brief and existing quote', () => {
    render(
      <EventProvider>
        <VendorsTab />
      </EventProvider>
    );

    expect(screen.getByText('Vendor Coordination & Quote Comparison')).toBeInTheDocument();
    expect(screen.getAllByText('Availability not verified: confirm directly with vendor').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Royal Rajputana Caterers')).toBeInTheDocument();
    expect(screen.getByText(/₹2,80,000/)).toBeInTheDocument();
    expect(screen.getByText(/Category Requirements Brief: Catering & Dining/i)).toBeInTheDocument();
    expect(screen.getByText('Is tasting included before contract signing?')).toBeInTheDocument();
  });

  it('allows switching categories and generating a new vendor brief', async () => {
    const venueBrief = {
      category: 'venue',
      scopeSummary: 'Outdoor royal palace lawns for 250 guests',
      keyInclusions: ['Main lawn', 'Mandap courtyard'],
      capacityRequirement: '300 guests',
      timingDetails: 'Full day access until midnight',
      accessibilityRequirements: ['Ramps to main courtyard'],
      negotiationQuestions: ['Are outside decorators allowed without royalty fee?']
    };

    const generateSpy = vi.spyOn(api, 'generateVendorBrief').mockResolvedValueOnce(venueBrief as any);

    render(
      <EventProvider>
        <VendorsTab />
      </EventProvider>
    );

    // Click Venue category tab
    const venueTab = screen.getByRole('button', { name: /Venue & Grounds/i });
    fireEvent.click(venueTab);

    // Venue has no brief initially, generate button should say "Generate Brief & Questions"
    const generateBtn = screen.getByRole('button', { name: /Generate Brief & Questions/i });
    fireEvent.click(generateBtn);

    expect(generateSpy).toHaveBeenCalledWith(mockProfile, 'venue', expect.any(Number));
    expect(await screen.findByText('Outdoor royal palace lawns for 250 guests')).toBeInTheDocument();
    expect(screen.getByText('Are outside decorators allowed without royalty fee?')).toBeInTheDocument();
  });

  it('displays error if generating vendor brief fails', async () => {
    vi.spyOn(api, 'generateVendorBrief').mockRejectedValueOnce(new Error('Network failure'));

    render(
      <EventProvider>
        <VendorsTab />
      </EventProvider>
    );

    const venueTab = screen.getByRole('button', { name: /Venue & Grounds/i });
    fireEvent.click(venueTab);

    const generateBtn = screen.getByRole('button', { name: /Generate Brief & Questions/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText('Network failure')).toBeInTheDocument();
  });

  it('validates quote input and parses raw vendor quote into structured card', async () => {
    const newQuote: QuoteItem = {
      id: 'quote-test-2',
      category: 'catering',
      vendorName: 'Udaipur Royal Feast',
      basePriceINR: 50000,
      tiers: null,
      guestCapacity: 300,
      inclusions: ['Chaat stalls', 'Dessert counter'],
      exclusions: [],
      additionalChargesINR: 0,
      additionalChargesBreakdown: [],
      paymentTerms: 'Net 30',
      cancellationPolicy: 'Full refund 15 days prior',
      missingInfo: [],
      redFlags: [],
      computedTotalCostINR: 50000,
      availabilityDisclaimer: 'Availability not verified: confirm directly with vendor.'
    };

    const extractSpy = vi.spyOn(api, 'extractVendorQuote').mockResolvedValueOnce(newQuote);

    render(
      <EventProvider>
        <VendorsTab />
      </EventProvider>
    );

    // Open Parse Quote drawer
    const openDrawerBtn = screen.getByRole('button', { name: /Parse Raw Vendor Quote/i });
    fireEvent.click(openDrawerBtn);

    expect(screen.getByText(/Paste Raw Vendor Quote \/ Email \/ WhatsApp Message/i)).toBeInTheDocument();

    // Test short text validation
    const submitBtn = screen.getByRole('button', { name: /Extract Quote & Compute TCO/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Please paste the vendor quotation message or email \(at least 10 characters\)\./i)
    ).toBeInTheDocument();

    // Fill valid text
    const textarea = screen.getByPlaceholderText(/Paste raw vendor message here:/i);
    fireEvent.change(textarea, { target: { value: 'Udaipur Royal Feast package: Rs 50,000 base package for 300 guests.' } });

    fireEvent.click(submitBtn);

    expect(extractSpy).toHaveBeenCalledWith(
      'Udaipur Royal Feast package: Rs 50,000 base package for 300 guests.',
      'catering',
      250
    );

    // New quote should now be visible in list
    expect(await screen.findByText('Udaipur Royal Feast')).toBeInTheDocument();
  });

  it('displays error if quote extraction fails', async () => {
    vi.spyOn(api, 'extractVendorQuote').mockRejectedValueOnce(new Error('Extraction failed'));

    render(
      <EventProvider>
        <VendorsTab />
      </EventProvider>
    );

    const openDrawerBtn = screen.getByRole('button', { name: /Parse Raw Vendor Quote/i });
    fireEvent.click(openDrawerBtn);

    const textarea = screen.getByPlaceholderText(/Paste raw vendor message here:/i);
    fireEvent.change(textarea, { target: { value: 'Valid long text quotation message from vendor.' } });

    const submitBtn = screen.getByRole('button', { name: /Extract Quote & Compute TCO/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Extraction failed')).toBeInTheDocument();
  });
});
