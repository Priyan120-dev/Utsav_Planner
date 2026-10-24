export type OccasionType = 
  | 'wedding' 
  | 'birthday' 
  | 'community' 
  | 'anniversary' 
  | 'cultural_festival';

export type TaskStatus = 'locked' | 'ready' | 'in_progress' | 'done';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type BudgetCategory = 
  | 'venue'
  | 'catering'
  | 'decor'
  | 'photography_videography'
  | 'entertainment'
  | 'attire'
  | 'invitations'
  | 'transport'
  | 'miscellaneous'
  | 'contingency';

export interface CulturalRecommendations {
  themes: string[];
  menuDirections: string[];
  decorIdeas: string[];
  culturalNotes: string[];
}

export interface EventProfile {
  occasion: OccasionType;
  title: string;
  totalBudgetINR: number;
  expectedGuests: number;
  eventDate: string; // ISO 8601 YYYY-MM-DD
  city: string;
  atmosphereTheme: string;
  culturalNeeds: string[];
  dietaryNeeds: string[];
  accessibilityNeeds: string[];
  mustHaves: string[];
  priorities: [string, string, string]; // Top 3 priorities
  followUpQuestions?: string[];
  recommendations?: CulturalRecommendations;
}

export interface BudgetCategoryItem {
  category: BudgetCategory;
  label: string;
  allocatedAmountINR: number;
  percentage: number;
  perGuestINR: number;
  isContingency?: boolean;
}

export interface BudgetTradeoffAi {
  explanation: string;
  actionableOptions: string[];
  disclaimer: string;
}

export interface BudgetState {
  totalBudgetINR: number;
  categories: Record<BudgetCategory, BudgetCategoryItem>;
  contingencyPercent: number; // 5% - 10% min buffer
  perGuestTotalINR: number;
  lastAiTradeoff?: BudgetTradeoffAi;
}

export interface TaskItem {
  id: string;
  title: string;
  category: BudgetCategory;
  daysBeforeEvent: number;
  targetDate: string; // ISO 8601 YYYY-MM-DD
  priority: TaskPriority;
  dependsOn: string[]; // List of IDs this task depends upon
  status: TaskStatus;
  isCriticalPath?: boolean;
  isOverdue?: boolean;
  isAtRisk?: boolean;
}

export interface DateShiftImpact {
  previousDate: string;
  newDate: string;
  daysShifted: number;
  unrealisticTaskIds: string[];
  compressionAdvice: string;
  suggestedDrops: string[];
}

export interface TimelineState {
  tasks: TaskItem[];
  eventDate: string;
  hasCycles: boolean;
  criticalPathTaskIds: string[];
  lastDateShiftImpact?: DateShiftImpact;
}

export interface VendorBrief {
  category: BudgetCategory;
  scopeSummary: string;
  keyInclusions: string[];
  capacityRequirement: string;
  timingDetails: string;
  accessibilityRequirements: string[];
  negotiationQuestions: string[]; // 8-10 targeted questions
}

export interface AdditionalCharge {
  item: string;
  amountINR: number;
}

export interface QuoteItem {
  id: string;
  category: BudgetCategory;
  vendorName: string;
  basePriceINR: number;
  guestCapacity: number | null;
  inclusions: string[];
  exclusions: string[];
  additionalChargesINR: number;
  additionalChargesBreakdown: AdditionalCharge[];
  paymentTerms: string | null;
  cancellationPolicy: string | null;
  missingInfo: string[];
  redFlags: string[];
  computedTotalCostINR: number; // base + additional charges computed deterministically
  availabilityDisclaimer: string;
}

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  fieldChanged: 'budget' | 'guests' | 'date' | 'priorities' | 'custom';
  previousValue: unknown;
  newValue: unknown;
  reason: string;
  impactSummary: string;
}

export interface EventState {
  version: number;
  id: string;
  profile: EventProfile;
  budget: BudgetState;
  timeline: TimelineState;
  vendorBriefs: Partial<Record<BudgetCategory, VendorBrief>>;
  quotes: QuoteItem[];
  changeLog: ChangeLogEntry[];
  lastUpdated: string;
}

// AI Service Request and Response Types
export interface ParseProfileRequest {
  freeText: string;
  existingProfile?: Partial<EventProfile>;
}

export interface BudgetTradeoffRequest {
  eventState: EventState;
  categoryAdjusted: BudgetCategory;
  newPercentage: number;
}

export interface GenerateTasksRequest {
  eventProfile: EventProfile;
}

export interface DateShiftRequest {
  eventState: EventState;
  newEventDate: string;
}

export interface VendorBriefRequest {
  eventProfile: EventProfile;
  category: BudgetCategory;
  allocatedBudgetINR: number;
}

export interface ExtractQuoteRequest {
  rawText: string;
  category: BudgetCategory;
}

export interface DynamicChangeRequest {
  eventState: EventState;
  changeType: 'budget' | 'guests' | 'date';
  newValue: string | number;
  reason?: string;
}

export interface DynamicChangeImpactResult {
  impactSummary: string;
  budgetAdvice: string;
  timelineAdvice: string;
  vendorAdvice: string;
  suggestedActionItems: string[];
}
