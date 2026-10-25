import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import axe from 'axe-core';
import { initializeBudgetState, EventState } from '@utsav/shared';
import { AccessibleDonutChart } from '../components/charts/AccessibleDonutChart.js';
import { AccessibleBarChart } from '../components/charts/AccessibleBarChart.js';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard.js';
import { ChangesTab } from '../components/dashboard/ChangesTab.js';
import { EventProvider } from '../context/EventContext.js';
import { App } from '../App.js';

const mockBudget = initializeBudgetState(2500000, 'wedding', ['Catering', 'Decor', 'Photography'], 250);

const mockEventState: EventState = {
  version: 1,
  id: 'test_event_1',
  profile: {
    occasion: 'wedding',
    title: 'Ananya & Rohit Wedding',
    totalBudgetINR: 2500000,
    expectedGuests: 250,
    eventDate: '2026-12-15',
    city: 'Jaipur',
    atmosphereTheme: 'Royal Rajputana Heritage',
    culturalNeeds: ['Baraat', 'Phere'],
    dietaryNeeds: ['Vegetarian', 'Jain options'],
    accessibilityNeeds: ['Wheelchair ramp'],
    mustHaves: ['Palace venue'],
    priorities: ['Catering', 'Decor', 'Photography']
  },
  budget: mockBudget,
  timeline: {
    tasks: [
      {
        id: 'task_1',
        title: 'Book palace venue in Jaipur',
        category: 'venue',
        daysBeforeEvent: 90,
        targetDate: '2026-09-15',
        priority: 'critical',
        dependsOn: [],
        status: 'ready'
      }
    ],
    eventDate: '2026-12-15',
    hasCycles: false,
    criticalPathTaskIds: ['task_1']
  },
  vendorBriefs: {},
  quotes: [],
  changeLog: [
    {
      id: 'log_1',
      timestamp: '2026-10-24T12:00:00Z',
      fieldChanged: 'custom',
      previousValue: null,
      newValue: 'Initial plan',
      reason: 'Setup',
      impactSummary: 'Plan initialized'
    }
  ],
  lastUpdated: '2026-10-24T12:00:00Z'
};

// Helper to run axe-core on rendered React components
async function testA11y(element: React.ReactElement) {
  const html = renderToString(element);
  if (html.includes('<main')) {
    document.body.innerHTML = html;
  } else {
    document.body.innerHTML = `<main id="test-main">${html}</main>`;
  }
  
  const results = await axe.run(document.body, {
    rules: {
      // Color-contrast in jsdom lacks computed CSS stylesheets, so we disable only contrast in headless JSDOM
      'color-contrast': { enabled: false }
    }
  });

  return results.violations;
}

describe('Accessibility (axe-core) Verification', () => {
  it('AccessibleDonutChart has zero axe accessibility violations', async () => {
    const violations = await testA11y(<AccessibleDonutChart budget={mockBudget} />);
    expect(violations).toEqual([]);
  });

  it('AccessibleDonutChart data table alternative has zero accessibility violations', async () => {
    const violations = await testA11y(<AccessibleDonutChart budget={mockBudget} forcedView="table" />);
    expect(violations).toEqual([]);
  });

  it('AccessibleBarChart standalone SVG has zero accessibility violations', async () => {
    const violations = await testA11y(<AccessibleBarChart budget={mockBudget} />);
    expect(violations).toEqual([]);
  });

  it('AccessibleBarChart data table alternative has zero accessibility violations', async () => {
    const violations = await testA11y(<AccessibleBarChart budget={mockBudget} forcedView="table" />);
    expect(violations).toEqual([]);
  });

  it('OnboardingWizard has zero accessibility violations', async () => {
    const violations = await testA11y(
      <EventProvider>
        <OnboardingWizard />
      </EventProvider>
    );
    expect(violations).toEqual([]);
  });

  it('ChangesTab has zero accessibility violations', async () => {
    localStorage.setItem('utsav_planner_event_state_v1', JSON.stringify(mockEventState));
    const violations = await testA11y(
      <EventProvider>
        <ChangesTab />
      </EventProvider>
    );
    expect(violations).toEqual([]);
  });

  it('Full App shell with tablist and live region has zero accessibility violations', async () => {
    localStorage.setItem('utsav_planner_event_state_v1', JSON.stringify(mockEventState));
    const violations = await testA11y(
      <EventProvider>
        <App />
      </EventProvider>
    );
    expect(violations).toEqual([]);
  });
});
