import { describe, it, expect } from 'vitest';
import {
  initializeBudgetState,
  computeCategoryPercentages,
  rebalanceBudget,
  recalculateBudgetForParameters
} from '@utsav/shared';

describe('Budget Pure Logic', () => {
  it('initializes budget state and ensures percentages sum to 100 with contingency >= 5%', () => {
    const totalBudget = 2000000;
    const guests = 300;
    const state = initializeBudgetState(
      totalBudget,
      'wedding',
      ['Catering', 'Photography', 'Decor'],
      guests
    );

    expect(state.totalBudgetINR).toBe(2000000);
    expect(state.perGuestTotalINR).toBe(Math.round(2000000 / 300));
    expect(state.contingencyPercent).toBeGreaterThanOrEqual(5);

    // Sum of category allocations equals total budget
    const allocatedSum = Object.values(state.categories).reduce(
      (acc, item) => acc + item.allocatedAmountINR,
      0
    );
    expect(Math.abs(allocatedSum - totalBudget)).toBeLessThanOrEqual(5); // rounding difference <= 5 INR

    // Sum of percentages equals 100
    const pctSum = Object.values(state.categories).reduce((acc, item) => acc + item.percentage, 0);
    expect(pctSum).toBe(100);
  });

  it('shifts baseline allocations based on user priorities', () => {
    const unshifted = computeCategoryPercentages('wedding', ['none', 'none', 'none']);
    const shifted = computeCategoryPercentages('wedding', [
      'Royal Catering feast',
      'Photography & Film',
      'Floral Decor'
    ]);

    // Boosted categories should have higher or equal share
    expect(shifted.catering).toBeGreaterThanOrEqual(unshifted.catering);
    expect(shifted.photography_videography).toBeGreaterThanOrEqual(
      unshifted.photography_videography
    );
    expect(shifted.decor).toBeGreaterThanOrEqual(unshifted.decor);

    // Total remains 100
    const sum = Object.values(shifted).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('rebalances categories deterministically when user moves a slider', () => {
    const initial = initializeBudgetState(1000000, 'wedding', ['Venue', 'Catering', 'Decor'], 200);
    const initialVenuePct = initial.categories.venue.percentage;

    // Raise venue percentage by 10%
    const updated = rebalanceBudget(initial, 'venue', initialVenuePct + 10, 200);

    expect(updated.categories.venue.percentage).toBe(initialVenuePct + 10);
    expect(updated.contingencyPercent).toBeGreaterThanOrEqual(5);

    // Overall sum must strictly remain 100
    const totalPct = Object.values(updated.categories).reduce(
      (acc, item) => acc + item.percentage,
      0
    );
    expect(totalPct).toBe(100);

    // Per guest costs are accurately recomputed
    expect(updated.categories.venue.perGuestINR).toBe(
      Math.round(updated.categories.venue.allocatedAmountINR / 200)
    );
  });

  it('recalculates per-head and allocations when total budget or guest count changes', () => {
    const initial = initializeBudgetState(
      1000000,
      'birthday',
      ['Entertainment', 'Catering', 'Decor'],
      50
    );
    expect(initial.perGuestTotalINR).toBe(20000);

    // Double budget and quadruple guests
    const updated = recalculateBudgetForParameters(initial, 2000000, 200);
    expect(updated.totalBudgetINR).toBe(2000000);
    expect(updated.perGuestTotalINR).toBe(10000);
  });

  it('guarantees total allocation strictly equals total budget across multiple successive rebalances', () => {
    const testBudgets = [250000, 1000000, 3500000, 1234567];
    const guests = 150;

    for (const totalBudget of testBudgets) {
      let state = initializeBudgetState(
        totalBudget,
        'wedding',
        ['Catering', 'Decor', 'Photography'],
        guests
      );

      // Initial allocation strictly matches total budget
      const initialAllocated = Object.values(state.categories).reduce(
        (sum, c) => sum + c.allocatedAmountINR,
        0
      );
      expect(initialAllocated).toBe(totalBudget);

      // Perform successive slider rebalances
      const adjustments: Array<[Parameters<typeof rebalanceBudget>[1], number]> = [
        ['venue', 35],
        ['catering', 42],
        ['decor', 18],
        ['photography_videography', 12],
        ['contingency', 8],
        ['attire', 10],
        ['entertainment', 8]
      ];

      for (const [cat, newPct] of adjustments) {
        state = rebalanceBudget(state, cat, newPct, guests);

        // Percentages always sum to 100%
        const totalPct = Object.values(state.categories).reduce((sum, c) => sum + c.percentage, 0);
        expect(totalPct).toBe(100);

        // Total allocation INR ALWAYS stays equal to the total budget
        const currentAllocated = Object.values(state.categories).reduce(
          (sum, c) => sum + c.allocatedAmountINR,
          0
        );
        expect(currentAllocated).toBe(totalBudget);

        // Emergency buffer never drops below 5%
        expect(state.contingencyPercent).toBeGreaterThanOrEqual(5);
        expect(state.categories.contingency.percentage).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
