import { EventState, EventProfile, BudgetCategory, QuoteItem, VendorBrief } from '@utsav/shared';

export interface EventContextType {
  eventState: EventState | null;
  isLoading: boolean;
  error: string | null;
  announcement: string;
  announce: (message: string) => void;
  clearError: () => void;
  initializeEvent: (profile: EventProfile) => Promise<void>;
  updateSliderPercentage: (
    category: BudgetCategory,
    newPercentage: number,
    signal?: AbortSignal
  ) => Promise<void>;
  rebalanceCategoryBudget: (category: BudgetCategory, newPercentage: number) => void;
  setBudgetTradeoffAdvice: (tradeoff: {
    explanation: string;
    actionableOptions: string[];
    disclaimer: string;
  }) => void;
  toggleTaskStatus: (taskId: string) => void;
  saveVendorBrief: (brief: VendorBrief & { category: BudgetCategory }) => void;
  saveQuote: (quote: QuoteItem) => void;
  commitDynamicChange: (
    changeType: 'budget' | 'guests' | 'date',
    newValue: string | number,
    reason: string,
    impactSummary: string
  ) => void;
  undoLastChange: () => void;
  loadDemoEvent: () => Promise<void>;
  resetEvent: () => void;
}
