# CLAUDE.md — VisaAgent Agent Instructions

Read `visaagent-prd.md` in this repo root before starting any work. It contains the full product spec, data models, API contracts, knowledge base seed data, and test fixture definitions. This file is your quick-reference for conventions and guardrails.

## Project Overview

VisaAgent is a Schengen visa application assistant for the web.
MVP scope: Indian applicants → France tourist visa → Embassy of France, New Delhi (via VFS Global).
Domain: flufex.com
Repo: github.com/vitazok/immigration (monorepo)

## Tech Stack

- **Frontend:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **Backend:** API routes in Next.js route handlers (Fastify standalone server is NOT needed for MVP — use Next.js API routes)
- **Database:** PostgreSQL via Prisma ORM (Railway managed)
- **LLM:** OpenRouter (OpenAI-compatible API) — free models via `openai` SDK. Smart model (DeepSeek) for generation/analysis, fast model (Llama) for chat assistant. Models configurable in `src/lib/llm/client.ts`.
- **Auth:** Clerk (use `@clerk/nextjs`)
- **i18n:** next-intl with JSON translation files
- **PDF:** pdf-lib for AcroForm filling and generation
- **OCR:** Google Cloud Vision API
- **File storage:** Cloudflare R2 (S3-compatible, use `@aws-sdk/client-s3`)
- **Payment:** Stripe (post-MVP, but install and configure skeleton now)

## Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npx prisma generate      # Generate Prisma client after schema changes
npx prisma db push       # Push schema to database
npx prisma studio        # Visual database browser
npm test                 # Unit tests (vitest)
npm run test:integration # Integration tests
npm run seed             # Seed knowledge base from data/consulates/
```

## User Flow

1. **Landing + Onboarding** (`/[locale]`) — 3 dropdowns (nationality, destination, purpose) → visa recommendation card → "Start application"
2. **Application Dashboard** (`/[locale]/application/[id]`) — Document checklist + 6-section form (37 fields) with inline editing, confidence indicators, progress bar
3. **Quality Check** (`/[locale]/quality-check`) — AI-powered blockers/warnings/recommendations → finalize PDF + cover letter

Auth gate: anonymous until upload or form save → then Clerk sign-in.

## Project Structure

```
/
├── CLAUDE.md                          # This file
├── visaagent-prd.md                   # Full PRD — READ THIS FIRST
├── TODO.md                            # Build log, session history, next steps
├── package.json
├── .env.example
├── data/
│   └── consulates/
│       └── FR_NEW_DELHI.json          # MVP consulate seed data
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout (required by App Router)
│   │   ├── [locale]/                  # i18n dynamic segment (next-intl)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Landing + onboarding (visa finder)
│   │   │   ├── application/[id]/      # Application dashboard (checklist + form)
│   │   │   │   └── page.tsx
│   │   │   ├── quality-check/
│   │   │   ├── dashboard/
│   │   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── sign-up/[[...sign-up]]/
│   │   └── api/                       # API route handlers
│   │       ├── application/           # POST create, GET [id], PUT [id]/form
│   │       ├── documents/
│   │       ├── assembly/
│   │       ├── quality/
│   │       ├── chat/
│   │       ├── knowledge/
│   │       └── stripe/
│   ├── lib/
│   │   ├── auth.ts                    # getClerkUserId() — returns null for anon
│   │   ├── intake/                    # Consulate routing only (no interview logic)
│   │   │   └── consulate-router.ts    # (nationality, dest, purpose) → VisaRecommendation
│   │   ├── documents/                 # Layer 2: OCR & extraction
│   │   ├── knowledge/                 # Layer 3: Knowledge base queries
│   │   ├── assembly/                  # Layer 4: Form filling & doc gen
│   │   ├── quality/                   # Layer 5: Validation & checks
│   │   ├── llm/                       # LLM client (OpenRouter via openai SDK)
│   │   │   ├── client.ts              # OpenRouter config, model IDs
│   │   │   └── prompts/               # Prompt templates as functions
│   │   ├── db/                        # Prisma client & helpers
│   │   └── types/                     # Shared TypeScript interfaces
│   │       ├── applicant.ts
│   │       ├── application.ts         # VisaRecommendation, ApplicationSummary
│   │       ├── trip.ts
│   │       ├── documents.ts
│   │       ├── consulate.ts
│   │       ├── form-mapping.ts
│   │       ├── quality.ts
│   │       └── index.ts
│   ├── components/
│   │   ├── ui/                        # Reusable primitives (button, input, card, etc.)
│   │   ├── onboarding/                # VisaFinder, RecommendationCard
│   │   ├── application/               # Dashboard, DocumentChecklist, FormSections, etc.
│   │   ├── documents/                 # UploadZone, DocumentCard, ExtractionReview
│   │   ├── form-review/               # FieldRow, ConfidenceBadge, PdfPreview
│   │   ├── help/                      # Tooltips, FAQ drawer, chat widget
│   │   └── layout/                    # Header, Footer, LocaleSwitcher
│   └── messages/
│       ├── en/
│       └── hi/
├── prisma/
│   └── schema.prisma                  # 7 models: Application, Applicant, Trip, etc.
├── tests/
│   ├── fixtures/                      # Synthetic test data (3 profiles, MRZ samples, bank stmts)
│   ├── unit/                          # mrz, form-mapper, quality-rules, consulate-router
│   ├── integration/                   # pipeline (MRZ→form→quality), application-flow (new)
│   └── e2e/
└── scripts/
    └── seed-knowledge-base.ts
```

## Code Conventions

- All files TypeScript, strict mode enabled in `tsconfig.json`
- Use `import type { X }` for type-only imports
- Named exports everywhere (except Next.js `page.tsx` and `layout.tsx` which use default)
- Async error handling: always try/catch, never swallow errors, always log with context
- API response shape: `{ data: T }` on success, `{ error: { code: string, message: string } }` on failure
- Database: Prisma only — never raw SQL
- Env vars: create a typed `src/lib/env.ts` that validates and exports all env vars. Never use `process.env` directly in business logic.
- Prefer `zod` for runtime validation of API inputs and LLM outputs
- Use `date-fns` for date manipulation — never raw Date parsing

## Design & Style

The visual identity is **minimalist black and white**. This is a high-stakes legal tool, not a lifestyle app — the design should feel clean, trustworthy, and invisible.

- **Color palette:** Black (`#000`), white (`#fff`), and grays (`gray-50` through `gray-900` from Tailwind). No brand colors, no gradients, no colored backgrounds. The only non-grayscale colors allowed are the confidence indicators in form review: green (`#16a34a`), yellow (`#ca8a04`), red (`#dc2626`) — used sparingly on field borders/badges only.
- **Typography:** Use the system font stack (`font-sans` in Tailwind). One font weight for body (`font-normal`), one for emphasis (`font-semibold`). No decorative fonts.
- **Spacing:** Generous whitespace. Don't crowd form fields. Use Tailwind's `space-y-6` or larger between sections. Form fields get `py-3 px-4` minimum padding.
- **Borders:** 1px `border-gray-200` for cards and inputs. No shadows except a subtle `shadow-sm` on the main content card if needed.
- **Buttons:** Primary buttons are black background, white text (`bg-black text-white`). Secondary buttons are white background, black border (`bg-white border border-black`). No rounded-full — use `rounded-md`.
- **Icons:** Use `lucide-react`. Thin stroke weight. Gray by default, black on interactive elements.
- **No decoration:** No hero images, no illustrations, no background patterns, no animated gradients. Content only.
- **Mobile:** Bottom-fixed primary action button on wizard steps. Clear step indicator (e.g., "Step 2 of 5") in plain text, not a fancy stepper component.
- **Help system:** Tooltips are plain text popovers with gray background. FAQ drawer slides in from right (desktop) or bottom (mobile) with white background. Chat widget is a simple black floating button in bottom-right corner.

## Performance

The app must feel fast. Target users are on 4G mobile connections in India — every millisecond matters.

**Page load targets:**
- First Contentful Paint: < 1.5s on 4G
- Largest Contentful Paint: < 2.5s on 4G
- Time to Interactive: < 3.0s on 4G
- Total page weight (initial load): < 200KB compressed

**Frontend rules:**
- Use Next.js App Router with Server Components by default — client components only when interactivity is required (forms, upload, chat)
- `'use client'` directive only on components that genuinely need browser APIs or React state
- Lazy-load heavy components: PDF preview (`next/dynamic`), Cropper.js, chat widget
- Images: use `next/image` with WebP format and appropriate `sizes` attribute
- No client-side analytics or tracking scripts at MVP
- Bundle analysis: run `next build` and check that no single route JS bundle exceeds 100KB compressed
- Prefetch the next wizard step using `<Link prefetch>` so transitions feel instant

**API rules:**
- All API routes must respond in < 500ms for non-LLM operations
- LLM calls (intake questions, cover letter, quality check) must stream responses where possible using Anthropic streaming API
- Document upload: return `202 Accepted` immediately, process OCR asynchronously via background job, poll for result
- Database queries: add indexes on `applicantId`, `sessionId`, and `consulateId`. Use Prisma `select` to fetch only needed fields — never `findMany` without a `select` or `take` clause
- Knowledge base JSON: load once at server start, cache in memory — never read from disk per request

**Chat assistant:**
- Use the fast model (currently `openai/gpt-oss-20b:free` via OpenRouter)
- Stream responses token-by-token to the UI
- Response must begin appearing within 1 second of user sending message
- Keep conversation context minimal — send only current application state + last 5 messages, not full history

## i18n Rules

- Framework: next-intl with App Router integration
- Translation JSON files live in `src/messages/{locale}/`
- All user-facing strings use `t('namespace.key')` — NEVER hardcode English text in components
- Key format: `{feature}.{context}.{element}` — e.g., `intake.question.nationality`, `form.field.surname.tooltip`, `help.faq.bankStatement.q1`
- All 3 locales (en, zh-CN, hi) must be updated together. Never add a key to one locale without the other two.
- The Schengen application form is always filled in English regardless of UI locale
- LLM-generated dynamic content (cover letters, chat responses) should be generated in the user's selected locale
- Language switcher in header — switching must not cause page reload or form state loss

## Data Models

Canonical TypeScript interfaces are defined in PRD Section 7. Implement them in `src/lib/types/` as separate files:

- `applicant.ts` — `ApplicantProfile`, `Address`, `MoneyAmount`, `PreviousVisa`
- `trip.ts` — `TripDetails`, `InvitingPerson`, `InvitingOrganization`
- `documents.ts` — `DocumentUpload`, `DocumentExtraction`, `ExtractedField`, `BoundingBox`
- `consulate.ts` — `ConsulateRequirement`, `DocumentRequirement`, `LocalizedString`, `FaqEntry`
- `form-mapping.ts` — `FormFieldMapping`, `DataSource`
- `quality.ts` — `QualityCheckResult`, `QualityIssue`

Import from `@/lib/types/` — never redefine these types elsewhere.

## API Routes

Full route contracts with request/response shapes are in PRD Section 9. Key endpoints:

**Application (new flow):**
- `POST /api/application/create` — Create application from onboarding (nationality + destination + purpose). No auth required. Returns `{ applicationId, tripId, recommendation }`.
- `GET /api/application/[id]` — Get full application state (docs, form fields, progress, applicant, trip, recommendation, requiredDocuments). No auth required.
- `PUT /api/application/[id]/form` — Save form field values (partial updates). **Requires auth.** Fields prefixed `applicant.*` update Applicant, `trip.*` update Trip.

**Documents & Assembly:**
- `POST /api/documents/upload` — Upload document for extraction
- `POST /api/assembly/generate-form` — Generate filled PDF
- `POST /api/assembly/generate-cover-letter` — Generate cover letter
- `POST /api/quality/check` — Run quality checks
- `POST /api/chat/message` — AI chat assistant (uses fast model)

## Form Filling Pipeline

The Schengen form has 37 numbered fields. Full mapping table is in PRD Section 8.

Pipeline steps:
1. Collect data from intake (Layer 1) and document extraction (Layer 2)
2. Map to 37 fields using deterministic rules (PRD Section 8 mapping table)
3. Fill PDF AcroForm using pdf-lib — do NOT flatten yet
4. Render web preview with confidence-colored fields (green/yellow/red)
5. User reviews and corrects
6. Generate final flattened PDF on user approval

**Critical:** Before building the pipeline, download the official French-variant harmonised form (cerfa 14076*02) and extract actual AcroForm field IDs:
```typescript
import { PDFDocument } from 'pdf-lib';
const pdf = await PDFDocument.load(formBytes);
const form = pdf.getForm();
form.getFields().forEach(f => console.log(f.getName(), f.constructor.name));
```
Update the mapping table with real field IDs.

## Knowledge Base

- Consulate data stored as JSON in `data/consulates/{CONSULATE_ID}.json`
- MVP has exactly one entry: `FR_NEW_DELHI.json` (full seed data in PRD Section 15)
- Adding a new consulate = adding a new JSON file — no code changes required
- The `src/lib/knowledge/` module loads and queries these files
- Tooltips and FAQs are part of the consulate JSON, keyed by locale

## Testing

- Test framework: Vitest — `npm test` runs all tests
- **65 tests across 6 files** (as of Session 5):
  - `tests/unit/mrz.test.ts` — 7 tests: MRZ parsing for 5 passport variants
  - `tests/unit/form-mapper.test.ts` — 10 tests: applicant+trip → 37 PDF field mapping
  - `tests/unit/quality-rules.test.ts` — 7 tests: rule-based quality checks
  - `tests/unit/consulate-router.test.ts` — 6 tests: visa routing (new flow)
  - `tests/integration/pipeline.test.ts` — 23 tests: MRZ → profile → form → quality (3 profiles)
  - `tests/integration/application-flow.test.ts` — 12 tests: onboarding → routing → checklist → form → quality (new flow)
- All tests use synthetic fixtures from `tests/fixtures/` — 3 applicant profiles (strong, first-time, risky), 5 MRZ samples, 3 bank statements (SBI, HDFC, ICICI)
- Never use real personal data in tests

## Error Handling

Full error handling matrix is in PRD Section 16. Key rules:

- OCR confidence < 0.7 → show manual entry with extracted values as suggestions
- LLM malformed output → retry once with stricter prompt, then fall back to manual
- Unsupported document language → warn user, allow manual entry
- Form field conflict (intake vs. extraction) → show both values, user picks
- Save form state to DB every 30 seconds for session recovery
- Knowledge base entries older than 90 days → show staleness warning banner

## LLM Usage

- Use `openai` SDK pointed at OpenRouter (`https://openrouter.ai/api/v1`)
- Client configured in `src/lib/llm/client.ts` — single file for all LLM access
- Smart model (`MODELS.sonnet`): intake interview, document analysis, cover letter, quality — currently `qwen/qwen3.6-plus:free`
- Fast model (`MODELS.haiku`): chat assistant (speed priority) — currently `openai/gpt-oss-20b:free`
- Browse free models at https://openrouter.ai/models?pricing=free — swap model IDs in `client.ts` anytime
- All prompts stored in `src/lib/llm/prompts/` as exported functions that take typed parameters and return prompt strings
- LLM outputs must be validated with zod schemas before use — never trust raw LLM output
- Cost: $0 while using free-tier models. Free models have rate limits — switch to paid models for production traffic

## Security & Privacy

- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- LLM API calls go through OpenRouter — review their data retention policy for production use
- Document uploads auto-deleted 90 days after application completion
- No passport images or financial data used for model training
- Clerk handles auth — no custom session management
- Database connection via SSL
- Never log PII (passport numbers, bank account numbers) — mask in logs

## Things NOT to Do

- **Never** store raw passport images longer than the processing session
- **Never** call LLM APIs outside of `src/lib/llm/client.ts` — all access goes through the shared OpenRouter client
- **Never** flatten the PDF form until the user explicitly approves
- **Never** auto-submit anything to VFS — explicitly out of scope
- **Never** hardcode consulate-specific logic — always read from knowledge base JSON
- **Never** use `any` type — use `unknown` and narrow with type guards
- **Never** hardcode English strings in components — always use `t()`
- **Never** write raw SQL — use Prisma
- **Never** access `process.env` directly in business logic — use the typed `env.ts`
- **Never** generate test data with real names, passport numbers, or financial data
