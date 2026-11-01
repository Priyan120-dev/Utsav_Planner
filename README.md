# 🪔 Utsav Planner (उत्सव Planner)
> **GenAI-Powered Indian Celebration & Event Planning Orchestrator**  
> Architected for Weddings, Milestone Birthdays, Anniversaries, and Community Festivals.

[![Tests](https://img.shields.io/badge/tests-107%20passed-success)](https://vitest.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)](https://www.typescriptlang.org)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-targets%20WCAG%202.1%20AA-purple)](#-accessibility-targets-wcag-21-aa-verified-with-axe-core-automated-tests)
[![Gemini API](https://img.shields.io/badge/AI-Official%20Google%20GenAI%20SDK-orange)](https://ai.google.dev)

---

## 📖 Problem Framing
Planning celebrations in India (from multi-day Hindu/Sikh/Muslim/Christian weddings to milestone 50th birthdays and Ganesh Utsavs) is notoriously chaotic:
- **Opaque Vendor Pricing & Hidden Surcharges:** Raw quotes are sent over WhatsApp with unitemized lump sums, concealing generator fuel surcharges, GST gaps, and overtime penalties.
- **Cascading Dependencies:** A venue delay invalidates priest muhurats, invitation print runs, and decor fabrications.
- **Volatile Budgets & Guest Lists:** Family guest counts fluctuate mid-planning, requiring continuous rebalancing across 10+ interdependent expense lines.
- **The "Hallucination Trap":** Typical LLM wrappers invent confirmed vendor quotes or perform flawed math.

### The Utsav Planner Solution
Utsav Planner couples **deterministic, strictly tested TypeScript arithmetic and graph algorithms** (`/shared`) with **Gemini generative intelligence** (`/server`). The LLM is invoked **only** for human judgment, cultural synthesis, negotiation extraction, and trade-off phrasing. All arithmetic, timeline DAG validation, and Total Cost of Ownership (TCO) calculations are performed deterministically in pure code.

---

## 🏛️ Architecture & Data Flow

```mermaid
graph TD
    subgraph Client ["React + Vite + TypeScript (Client)"]
        UI["Accessible Celebratory UI<br>(targets WCAG 2.1 AA, Tailored Indian Palette)"]
        Store["Single Source of Truth: EventState<br>(React Context + LocalStorage + Undo Stack)"]
        Debounce["useDebounce Hook<br>(60fps local slider updates)"]
        DualView["Accessible Donut & Bar Charts<br>Dual Screen-Reader Data Table Alternative"]
    end

    subgraph Shared ["Pure TypeScript Domain Logic (/shared)"]
        BudgetMath["budgetLogic.ts<br>• Occasion Baselines<br>• Priority Weighting<br>• Proportional Rebalancing<br>• Per-Head Math"]
        GraphMath["timelineLogic.ts<br>• Cycle Detection (DFS)<br>• Topological Sort<br>• Critical Path Method (CPM)<br>• Deadline Calculations"]
        QuoteMath["quoteLogic.ts<br>• Total Cost of Ownership (TCO)<br>• Missing Field Gap Analysis<br>• Availability Guardrails"]
        Schemas["schemas.ts<br>Zod Schema Contracts for States & AI"]
    end

    subgraph Server ["Node.js + Express API Proxy (/server)"]
        Security["Security Layer<br>• Helmet & Strict CORS<br>• Express Rate Limits<br>• 1MB Body Limit"]
        PromptEngine["Prompts Layer (/server/prompts/*)<br>• Untrusted Data Delimiter Defense<br>• Indian Celebration Persona (v1)"]
        Cache["MemoryCache<br>In-Memory SHA-256 Request Cache"]
        GeminiService["geminiService.ts<br>• Official @google/genai SDK<br>• Structured JSON Schemas<br>• Automatic Retry on Schema Drift"]
    end

    UI --> Store
    Store --> Debounce
    Store --> DualView
    Store <--> Shared
    Debounce --> Server
    Server --> GeminiService
    GeminiService --> Cache
    GeminiService --> GeminiAPI[("Google Gemini 3.8 Flash")]
```

---

## 🌟 The Five Pillars in Depth

### 1. Personalised Onboarding & Constraint Mapping
- **Dual Mode:** Choose between a free-text narrative box (*"We are hosting a 3-day royal Marwari wedding in Udaipur for 350 guests with 35 lakhs budget..."*) or a multi-step guided wizard.
- **AI Extraction & Smart Clarifications:** Gemini extracts structured parameters (occasion, city, budget, guest count, cultural traditions, dietary requirements, accessibility needs, and top 3 priorities). If key constraints are missing or ambiguous, the model asks **maximum 3 targeted follow-up questions** rather than guessing.
- **Tailored Cultural Recommendations:** AI generates bespoke recommendations (e.g. Mewar Palace Elegance theme, Ker Sangri banquet counter, and senior citizen seating near the Mandap stage).

### 2. Categorised Budgeting & Dynamic Trade-Offs
- **10 Comprehensive Categories:** Venue & Grounds, Catering & Dining, Decor & Mandap, Photography & Cinematic Video, Music & DJ, Attire & Styling, Invitations & RSVP, Guest Logistics, Puja & Misc Essentials, and Emergency Contingency Buffer.
- **Deterministic Baseline & Priority Shifting:** Pure code sets occasion-specific baselines, elevates categories matching the host's top 3 priorities, and enforces a **minimum 5%–10% contingency safety reserve**.
- **Interactive Sliders with Auto-Rebalancing:** Moving any slider immediately recalculates deltas, per-head costs, and proportionally shifts non-contingency lines in pure TypeScript at 60fps. After a debounce delay, Gemini produces an empathetic, plain-language trade-off explanation alongside 2–4 concrete decision levers.
- **Guardrail Badge:** Every figure is labeled with the mandatory disclaimer badge: `Estimate, not a verified vendor price`.

### 3. Sequenced Timeline & Dependent Tasks
- **Culturally Tailored Tasks:** Gemini generates 10–16 sequenced tasks spanning pre-planning to day-of execution.
- **Dependency Graph Validation:** Pure code validates the Directed Acyclic Graph (DAG) using cycle detection (`detectCycles`) and computes topological ordering. A task remains **locked** until all prerequisite tasks are marked `done`.
- **Critical Path & Risk Detection:** Highlighting the critical path chain, along with real-time badges for **Overdue** and **At Risk (&le; 3 days)** tasks.
- **Date Shift Simulation with Diff:** Moving the event date triggers deterministic deadline recomputation in code, followed by AI analysis highlighting unrealistic deadlines, compression tactics, and non-essential tasks to drop.

### 4. Vendor Coordination & Quote Comparison
- **Requirements Brief & Vetting Questions:** For any category, generates a formal RFP specification along with **8–10 targeted negotiation questions** designed to uncover hidden Indian vendor costs (diesel generator meter charges, PPL music licenses, cash receipt vs GST, corkage penalties, tasting fees).
- **Untrusted Quote Parser:** Paste raw vendor WhatsApp messages or emails. Gemini extracts structured fields (base price, guest capacity, inclusions, exclusions, additional charges, payment milestones, cancellation policy) with `null` for unstated items.
- **Side-by-Side Comparison Matrix:** Code computes the **Total Cost of Ownership (TCO)** by summing base price and extracted fees, comparing against the category budget, and flagging missing data and consumer red flags.
- **Availability Guardrail:** Prominently displays: `Availability not verified: confirm directly with vendor.`

### 5. Resilience to Dynamic Changes ("Something Changed")
- **Mid-Flight Adjustments Without Restart:** When life changes mid-planning, hosts can update guest count, budget, or event date.
- **Deterministic Recomputation & AI Advisory:** Rebalances budgets and recalculates deadlines in code, then prompts Gemini for executive summaries, vendor renegotiation advice, and an immediate checklist.
- **One-Click Undo:** Every change is logged to an audit timeline in `changeLog`. The host can revert to the prior state with a single click.

---

## 🔒 Prompt Engineering & Versioning

All prompt templates are located in `/server/src/prompts/`:

| Prompt Layer | Version | File | Purpose |
|:---|:---|:---|:---|
| **System Persona** | `v1` | `systemPrompt.ts` | Sets "Event Planning Orchestrator" persona with authentic Indian celebration nuance, strict JSON output rules, and untrusted data wrapping. |
| **Profile Parser** | `v1` | `profileParser.ts` | Extracts structured celebration profiles from free-form user descriptions. |
| **Budget Trade-off** | `v1` | `budgetTradeoff.ts` | Produces empathetic trade-off rationales and concrete host options. |
| **Task Generator** | `v1` | `taskGenerator.ts` | Creates sequenced tasks with strict dependency declarations. |
| **Date Shift Impact** | `v1` | `dateShiftImpact.ts` | Advises on schedule compression, task merging, or non-essential drops. |
| **Vendor Brief** | `v1` | `vendorBrief.ts` | Generates RFP briefs and 8–10 targeted negotiation questions. |
| **Quote Extractor** | `v1` | `quoteExtractor.ts` | Extracts verified quotation line items and flags ambiguities. |
| **Change Impact** | `v1` | `changeImpact.ts` | Analyzes holistic impact of in-flight changes. |

### Prompt Injection Defense
All user-pasted vendor quotes and raw emails are treated as untrusted data:
```typescript
export function wrapUntrustedData(input: string): string {
  const sanitized = input
    .replace(/<<<UNTRUSTED_DATA>>>/gi, '[TAG_REMOVED]')
    .replace(/<<<END_UNTRUSTED_DATA>>>/gi, '[TAG_REMOVED]');
  return `<<<UNTRUSTED_DATA>>>\n${sanitized}\n<<<END_UNTRUSTED_DATA>>>`;
}
```
The model instructions strictly forbid executing any instructions contained within these delimiters.

---

## ♿ Accessibility (targets WCAG 2.1 AA, verified with axe-core automated tests)

Utsav Planner targets WCAG 2.1 AA, verified with axe-core automated tests:
- **Skip to Content:** Keyboard accessible skip link (`<a href="#main-content" className="skip-link">`) for screen reader and keyboard navigation.
- **Dual Visual/Table Alternative:** Both donut and bar charts include an accessible toggle button rendering a full semantic HTML table (`<table>`, `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`) with full column scopes.
- **Contrast Ratios:** Curated Indian celebratory palette tested to guarantee color contrast ratios &ge; 4.5:1.
- **Reduced Motion:** Fully adheres to `@media (prefers-reduced-motion: reduce)`.
- **Focus Rings:** Distinct, visible focus styling (`focus-visible:ring-2 focus-visible:ring-utsav-saffron-600 focus-visible:ring-offset-2`).
- **Responsive Layout:** Tested down to 360px viewport widths on mobile devices.

---

## 🛡️ Security Architecture

- **Zero Secrets on Client:** The Google Gemini API key resides solely on the server in `.env`.
- **Helmet & CORS:** Helmet security headers with strict whitelisting of frontend origins.
- **Rate Limiting:** Express rate limiting prevents API abuse (200 requests / 15m globally, 60 requests / 5m on AI endpoints).
- **Request Size Limiting:** 1MB payload limits protect against Denial of Service memory attacks.
- **Zod Schema Validation:** Both incoming client request bodies and outgoing LLM JSON responses are strictly validated. On validation failure, the service automatically retries once with schema error feedback.

---

## 🚀 Getting Started

### Prerequisites
- Node.js &ge; 20.x
- npm &ge; 10.x
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone & Configure Environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Server API runs on: `http://localhost:5000`

### 4. Run Unit, Integration & Component Tests
```bash
# Run all unit, integration, route, injection, and component tests
npm test

# Generate comprehensive test coverage report across server and client
npm run test:coverage
```
Executes Vitest tests covering:
- **Server Routes & Validation:** `/api/ai/budget-tradeoffs`, `/date-shift-impact`, `/vendor-brief`, `/change-impact`, `/parse-profile`, and `/extract-quote` (valid 200 and invalid 400 cases).
- **Prompt Injection Defense:** Strict untrusted-data delimiter isolation (`<<<UNTRUSTED_DATA>>>`) and escaping of nested user breakout tags.
- **LLM Error Handling & Retry:** Single automatic retry on malformed JSON / schema drift and polite error messages on repeated failure.
- **Deterministic Domain Math:** Budget initialization, priority shifting, 60fps proportional rebalancing, cycle detection (DFS), topological sorting, critical path (CPM), date shift diffs, and quote TCO calculations.
- **Client Components & Accessibility:** `OnboardingWizard` (input validation & follow-up questions), `BudgetTab` (instant slider rebalancing & view toggles), `TimelineTab` (locked prerequisite states), and `AccessibleDonutChart` (HTML data table alternatives), verified with `axe-core`.

#### Test Coverage Summary

| Workspace | Test Focus | Tests Passed | % Stmts | % Funcs | Key Tested Modules / Components |
|:---|:---|:---|:---|:---|:---|
| **Server** (`@utsav/server`) | Routes, Injection Defense, Retry, Domain Logic | **43 / 43** | **78.10%** | **85.00%** | `aiRoutes`, `geminiService`, `injectionDefense`, `quoteLogic`, `budgetLogic`, `timelineLogic`, `schemas` |
| **Client** (`@utsav/client`) | Components, Sliders, Context, Views, axe-core A11y | **64 / 64** | **89.86%** | **63.06%** | `OnboardingWizard`, `BudgetTab`, `TimelineTab`, `VendorsTab`, `ChangesTab`, `EventContext`, `useDebounce`, `api`, `App`, `Header`, `AccessibleDonutChart`, `AccessibleBarChart`, `a11y` |
| **Monorepo Total** | **Full Suite** | **107 / 107** | — | — | **20 Test Suites Passing (100% Green)** |

### 5. Production Build
```bash
npm run build
```

---

## 🐳 Docker Deployment

Build and run the multi-stage production container:
```bash
# Build Docker image
docker build -t utsav-planner .

# Run container
docker run -p 5000:5000 --env-file .env utsav-planner
```

---

## ⚠️ Known Limitations & Future Horizons
- **Currency:** Currently optimized for Indian Rupees (₹ INR) and Indian cultural celebration traditions.
- **Multi-Day Itinerary Splitting:** Currently models the celebration as a unified event milestone; future versions will support sub-event breakdown (Day 1 Mehendi, Day 2 Sangeet, Day 3 Pheras) with individual budgets.
- **Vendor CRM Integration:** Direct WhatsApp/Email send integration for RFPs is slated for v2.

---

**Built with pride for celebrations that bring families together.** 🪔
