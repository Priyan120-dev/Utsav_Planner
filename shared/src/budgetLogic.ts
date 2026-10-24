import { 
  BudgetCategory, 
  BudgetCategoryItem, 
  BudgetState, 
  OccasionType 
} from './types.js';

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  'venue',
  'catering',
  'decor',
  'photography_videography',
  'entertainment',
  'attire',
  'invitations',
  'transport',
  'miscellaneous',
  'contingency'
];

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  venue: 'Venue & Grounds',
  catering: 'Catering & Dining',
  decor: 'Decor, Mandap & Lighting',
  photography_videography: 'Photography & Cinematic Video',
  entertainment: 'Music, DJ & Entertainment',
  attire: 'Attire, Jewellery & Styling',
  invitations: 'Invitations & Digital RSVP',
  transport: 'Guest Transport & Logistics',
  miscellaneous: 'Permissions & Puja Essentials',
  contingency: 'Emergency Contingency Buffer'
};

// Baseline percentages per occasion type
export const BASELINE_PERCENTAGES: Record<OccasionType, Record<BudgetCategory, number>> = {
  wedding: {
    venue: 24,
    catering: 28,
    decor: 14,
    photography_videography: 10,
    entertainment: 5,
    attire: 8,
    invitations: 2,
    transport: 2,
    miscellaneous: 2,
    contingency: 5
  },
  birthday: {
    venue: 20,
    catering: 35,
    decor: 16,
    photography_videography: 8,
    entertainment: 10,
    attire: 3,
    invitations: 1,
    transport: 1,
    miscellaneous: 1,
    contingency: 5
  },
  community: {
    venue: 25,
    catering: 30,
    decor: 12,
    photography_videography: 5,
    entertainment: 12,
    attire: 0,
    invitations: 2,
    transport: 4,
    miscellaneous: 3,
    contingency: 7
  },
  anniversary: {
    venue: 22,
    catering: 32,
    decor: 15,
    photography_videography: 12,
    entertainment: 6,
    attire: 5,
    invitations: 1,
    transport: 1,
    miscellaneous: 1,
    contingency: 5
  },
  cultural_festival: {
    venue: 26,
    catering: 26,
    decor: 16,
    photography_videography: 6,
    entertainment: 14,
    attire: 0,
    invitations: 2,
    transport: 3,
    miscellaneous: 2,
    contingency: 5
  }
};

/**
 * Keyword mapper from free-form user priorities to budget categories
 */
export function mapPriorityToCategory(priority: string): BudgetCategory | null {
  const p = priority.toLowerCase();
  if (p.includes('food') || p.includes('cater') || p.includes('feast') || p.includes('dining')) return 'catering';
  if (p.includes('venue') || p.includes('location') || p.includes('resort') || p.includes('hall')) return 'venue';
  if (p.includes('decor') || p.includes('flower') || p.includes('lighting') || p.includes('mandap') || p.includes('ambiance')) return 'decor';
  if (p.includes('photo') || p.includes('video') || p.includes('film') || p.includes('cinemat')) return 'photography_videography';
  if (p.includes('music') || p.includes('dj') || p.includes('dance') || p.includes('entertainment') || p.includes('sangeet')) return 'entertainment';
  if (p.includes('cloth') || p.includes('dress') || p.includes('attire') || p.includes('outfit') || p.includes('jewel')) return 'attire';
  if (p.includes('invite') || p.includes('card') || p.includes('rsvp')) return 'invitations';
  if (p.includes('transport') || p.includes('bus') || p.includes('car') || p.includes('cab')) return 'transport';
  return null;
}

/**
 * Computes baseline percentages shifted by top 3 priorities, ensuring contingency >= 5% and sum == 100%
 */
export function computeCategoryPercentages(
  occasion: OccasionType,
  priorities: [string, string, string]
): Record<BudgetCategory, number> {
  const base = { ...(BASELINE_PERCENTAGES[occasion] || BASELINE_PERCENTAGES.wedding) };
  
  // Identify categories linked to user priorities
  const boostedCategories: BudgetCategory[] = [];
  for (const prio of priorities) {
    const cat = mapPriorityToCategory(prio);
    if (cat && !boostedCategories.includes(cat) && cat !== 'contingency') {
      boostedCategories.push(cat);
    }
  }

  // If boosted, shift percentage up
  if (boostedCategories.length > 0) {
    const boostPerCategory = Math.floor(6 / boostedCategories.length); // 6% total boost distributed
    let totalBoostApplied = 0;

    for (const cat of boostedCategories) {
      base[cat] += boostPerCategory;
      totalBoostApplied += boostPerCategory;
    }

    // Deduct equally from non-boosted, non-contingency categories that have room
    const nonBoosted = BUDGET_CATEGORIES.filter(
      c => !boostedCategories.includes(c) && c !== 'contingency' && base[c] > 3
    );

    let remainingToDeduct = totalBoostApplied;
    while (remainingToDeduct > 0 && nonBoosted.length > 0) {
      for (const c of nonBoosted) {
        if (remainingToDeduct > 0 && base[c] > 2) {
          base[c] -= 1;
          remainingToDeduct -= 1;
        }
      }
    }
  }

  // Ensure contingency buffer minimum 5%
  if (base.contingency < 5) {
    base.contingency = 5;
  }

  // Normalize to exactly 100%
  let sum = Object.values(base).reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    const diff = 100 - sum;
    base.catering += diff; // adjust catering as standard balancer
  }

  return base;
}

/**
 * Creates initial BudgetState from total budget, occasion, priorities, and guest count
 */
export function initializeBudgetState(
  totalBudgetINR: number,
  occasion: OccasionType,
  priorities: [string, string, string],
  expectedGuests: number
): BudgetState {
  const percentages = computeCategoryPercentages(occasion, priorities);
  const categories: Record<BudgetCategory, BudgetCategoryItem> = {} as any;
  let totalAllocatedINR = 0;

  for (const cat of BUDGET_CATEGORIES) {
    const pct = percentages[cat];
    const amount = Math.round((totalBudgetINR * pct) / 100);
    totalAllocatedINR += amount;

    const perGuest = expectedGuests > 0 ? Math.round(amount / expectedGuests) : 0;

    categories[cat] = {
      category: cat,
      label: CATEGORY_LABELS[cat],
      allocatedAmountINR: amount,
      percentage: pct,
      perGuestINR: perGuest,
      isContingency: cat === 'contingency'
    };
  }

  // Ensure total allocated amount strictly matches totalBudgetINR
  const initDiff = totalBudgetINR - totalAllocatedINR;
  if (initDiff !== 0) {
    const leadCat: BudgetCategory = categories['catering'] ? 'catering' : 'venue';
    categories[leadCat].allocatedAmountINR += initDiff;
    categories[leadCat].perGuestINR = expectedGuests > 0 
      ? Math.round(categories[leadCat].allocatedAmountINR / expectedGuests) 
      : 0;
  }

  return {
    totalBudgetINR,
    categories,
    contingencyPercent: percentages.contingency,
    perGuestTotalINR: expectedGuests > 0 ? Math.round(totalBudgetINR / expectedGuests) : 0
  };
}

/**
 * Interactive slider adjustment: when user changes percentage of one category,
 * code deterministically rebalances the other categories proportionally.
 */
export function rebalanceBudget(
  currentBudget: BudgetState,
  targetCategory: BudgetCategory,
  newPercentage: number,
  expectedGuests: number
): BudgetState {
  // Clamp between 0 and 90% (leaving room for contingency)
  const clampedPct = Math.max(0, Math.min(targetCategory === 'contingency' ? 50 : 85, Math.round(newPercentage)));
  const oldPct = currentBudget.categories[targetCategory].percentage;
  const delta = clampedPct - oldPct;

  if (delta === 0) {
    return currentBudget;
  }

  // Other categories to adjust (excluding the target and ensuring contingency never drops below 5%)
  const otherCategories = BUDGET_CATEGORIES.filter(c => c !== targetCategory);
  const currentOtherSum = otherCategories.reduce(
    (sum, c) => sum + currentBudget.categories[c].percentage, 
    0
  );

  const updatedPercentages: Record<BudgetCategory, number> = {} as any;
  updatedPercentages[targetCategory] = clampedPct;

  let assignedOtherSum = 0;
  for (const c of otherCategories) {
    if (currentOtherSum === 0) {
      updatedPercentages[c] = Math.round((100 - clampedPct) / otherCategories.length);
    } else {
      const share = currentBudget.categories[c].percentage / currentOtherSum;
      const newCatPct = Math.max(
        c === 'contingency' ? 5 : 0, 
        Math.round(currentBudget.categories[c].percentage - (delta * share))
      );
      updatedPercentages[c] = newCatPct;
    }
    assignedOtherSum += updatedPercentages[c];
  }

  // Normalize final sum to exactly 100
  let totalSum = clampedPct + assignedOtherSum;
  let discrepancy = 100 - totalSum;

  if (discrepancy !== 0) {
    // Distribute discrepancy to a flexible category that isn't the target or contingency
    const candidate = otherCategories.find(c => c !== 'contingency' && updatedPercentages[c] + discrepancy >= 0) 
      || otherCategories[0];
    updatedPercentages[candidate] += discrepancy;
  }

  // Guardrail: contingency must be at least 5%
  if (updatedPercentages.contingency < 5) {
    const shortage = 5 - updatedPercentages.contingency;
    updatedPercentages.contingency = 5;
    // deduct from largest category that isn't target
    const largestNonTarget = otherCategories
      .filter(c => c !== 'contingency')
      .sort((a, b) => updatedPercentages[b] - updatedPercentages[a])[0];
    if (largestNonTarget && updatedPercentages[largestNonTarget] > shortage) {
      updatedPercentages[largestNonTarget] -= shortage;
    }
  }

  // Rebuild category items
  const newCategories: Record<BudgetCategory, BudgetCategoryItem> = {} as any;
  let totalAllocatedINR = 0;
  for (const cat of BUDGET_CATEGORIES) {
    const pct = updatedPercentages[cat];
    const amount = Math.round((currentBudget.totalBudgetINR * pct) / 100);
    totalAllocatedINR += amount;

    newCategories[cat] = {
      category: cat,
      label: CATEGORY_LABELS[cat],
      allocatedAmountINR: amount,
      percentage: pct,
      perGuestINR: expectedGuests > 0 ? Math.round(amount / expectedGuests) : 0,
      isContingency: cat === 'contingency'
    };
  }

  // Ensure total allocated amount strictly equals totalBudgetINR
  const diffINR = currentBudget.totalBudgetINR - totalAllocatedINR;
  if (diffINR !== 0) {
    const adjustCat = targetCategory !== 'contingency' ? targetCategory : 'venue';
    newCategories[adjustCat].allocatedAmountINR += diffINR;
    newCategories[adjustCat].perGuestINR = expectedGuests > 0 
      ? Math.round(newCategories[adjustCat].allocatedAmountINR / expectedGuests) 
      : 0;
  }

  return {
    ...currentBudget,
    categories: newCategories,
    contingencyPercent: updatedPercentages.contingency,
    perGuestTotalINR: expectedGuests > 0 ? Math.round(currentBudget.totalBudgetINR / expectedGuests) : 0
  };
}

/**
 * Updates guest count or total budget across all existing category items deterministically
 */
export function recalculateBudgetForParameters(
  currentBudget: BudgetState,
  newTotalBudgetINR: number,
  newGuestCount: number
): BudgetState {
  const newCategories: Record<BudgetCategory, BudgetCategoryItem> = {} as any;

  for (const cat of BUDGET_CATEGORIES) {
    const item = currentBudget.categories[cat];
    const amount = Math.round((newTotalBudgetINR * item.percentage) / 100);
    const perGuest = newGuestCount > 0 ? Math.round(amount / newGuestCount) : 0;

    newCategories[cat] = {
      ...item,
      allocatedAmountINR: amount,
      perGuestINR: perGuest
    };
  }

  return {
    ...currentBudget,
    totalBudgetINR: newTotalBudgetINR,
    categories: newCategories,
    perGuestTotalINR: newGuestCount > 0 ? Math.round(newTotalBudgetINR / newGuestCount) : 0
  };
}
