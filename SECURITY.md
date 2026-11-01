# Security Policy

Utsav Planner is designed with security-in-depth principles across the entire application stack. This document summarizes the active security measures implemented in the codebase.

---

## 1. Security Architecture & Threat Mitigations

### Server-Side API Key Isolation

- **Zero Client-Side Secrets**: The Google Gemini API key (`GEMINI_API_KEY`) is stored strictly in server-side environment variables and loaded in `server/src/config.ts`.
- **No Direct Client AI Access**: The client frontend never communicates directly with external AI services. All interactions are securely brokered through backend endpoints (`/api/ai/*`).

### HTTP Security Headers (Helmet)

- Express is configured with `helmet()` middleware (`server/src/app.ts`) which automatically provisions industry-standard HTTP security headers, including `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict transport protections.

### CORS Origin Allow-List

- The server employs strict Cross-Origin Resource Sharing (`cors`) validation in `server/src/app.ts`.
- Only explicitly authorized origins defined in `config.CORS_ALLOWED_ORIGINS` (e.g., `http://localhost:5173`, `http://localhost:3000`) are permitted.
- Requests from unauthorized origins receive an immediate `403 Forbidden` with `{ "error": "Origin not allowed" }`.

### Rate Limiting & Abuse Prevention

- An Express rate limiter (`express-rate-limit`) is active across all `/api/` endpoints (`server/src/app.ts`).
- Configured with a 15-minute sliding window limiting requests per IP address, preventing denial-of-service (DoS), brute-force exploration, and runaway AI inference costs.

### Dual-Layer Schema Validation with Zod

- **Strict Input Validation**: Every API route validates incoming client request bodies using rigorous Zod schemas before processing (e.g., verifying types, positive integers, non-empty strings).
- **Guaranteed LLM Output Typing**: AI responses from Gemini are parsed and validated against deterministic Zod response schemas (`server/src/schemas/`) prior to being returned to the client, preventing hallucinated or malformed payloads from penetrating application state.

### Prompt Injection Defense & Delimiters

- Untrusted user inputs (such as free-text event descriptions or copied vendor quotation emails) are sanitized to remove existing delimiter tags.
- Prompts wrap untrusted data inside explicit boundary markers:
  ```
  <<<UNTRUSTED_DATA>>>
  [Sanitized User or Vendor Text]
  <<<END_UNTRUSTED_DATA>>>
  ```
- System instructions instruct the model to treat content enclosed within these tags strictly as passive data and never as executable instructions.

### Payload & Input Size Limits

- Express body parsers enforce request size limits to guard against memory exhaustion.
- Zod schemas enforce explicit character limits on user text:
  - Event free-text description: Minimum 10 characters, maximum 5,000 characters.
  - Vendor quote raw text: Minimum 10 characters, maximum 10,000 characters.

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability within Utsav Planner, please do not file a public issue. Instead, report it privately to the repository maintainer. All legitimate security reports will be acknowledged and addressed promptly.
