# VisaAgent — Build Log & TODO

**Project:** VisaAgent — AI-powered Schengen visa assistant  
**Repo:** github.com/vitazok/immigration  
**Domain:** flufex.com  
**Stack:** Next.js 14 · TypeScript · Tailwind · Prisma/PostgreSQL · Claude API · Clerk · Cloudflare R2  
**PRD:** `visaagent-prd.md` · **Agent instructions:** `CLAUDE.md`

---

## Key Decisions (settled)

| Topic | Decision |
|---|---|
| Backend | Next.js API routes only — no Fastify |
| Locales at launch | English (en) + Hindi (hi) — Chinese (zh-CN) deferred, DeepL-ready |
| OCR processing | Synchronous with polling (works on Vercel free tier) |
| Cover letter | Single best output, tone chosen by Claude based on risk profile |
| Stripe | Skeleton only (package + env + webhook stub) |
| Deployment | Vercel (frontend) + Railway (PostgreSQL) |
| PDF form | Real AcroForm field IDs extracted from `CS_14076-05_EN_05.pdf` |
| ZDR header | Removed incorrect beta header — ZDR configured at Anthropic account level |
| pgvector | Not needed for MVP — JSON in-memory knowledge base |
| LLM provider | OpenRouter (free tier) via `openai` SDK — not Anthropic directly |
| Models | Smart `qwen/qwen3.6-plus:free` for generation · Fast `openai/gpt-oss-20b:free` for chat |

---

## Confirmed AcroForm Field IDs (from CS_14076-05_EN_05.pdf)

```
applicantSurname, applicantSurnameAtBirth, applicantFirstname
applicantDateOfBirth, applicantPlaceOfBirth, applicantCountryOfBirth
applicantNationality, applicantNationalityAtBirth, applicantNationalityOther
applicantGenderM, applicantGenderF, applicantGenderA
applicantMaritalCEL, applicantMaritalMAR, applicantMaritalSEP
applicantMaritalDIV, applicantMaritalVEU, applicantMaritalAUT
applicantMaritalPAC, applicantMaritalOther
applicantIdCardNumber
travelDocTypePSP, travelDocTypePO, travelDocTypePOF
travelDocTypePSV, travelDocTypeAUT, travelDocTypeOther
travelDocNumber, travelDocDateOfIssue, travelDocValidUntil, travelDocCountries
applicantResidencePermitYes, applicantResidencePermitNo
applicantResidencePermitNumber, applicantResidencePermitValidUntil
nationalFamilySurname, nationalFamilyFirstNames, nationalFamilyNationality
nationalFamilyCardNumber, nationalFamilyDateOfBirth
relationshipAAC, relationshipAUT, relationshipCON
relationshipENF, relationshipPAC, relationshipPFI
applicantAddressL1-L6, applicantPhone
applicantOccupation, applicantOccupationAddressL1-L3
purposeTOUR, purposeVISF, purposeATRA, purposeVOFF, purposeSPOR
purposeCULT, purposeETUD, purposeMEDI, purposeTRAV, purposeAUTR
purposeOther, purposeOfJourneyInfo
applicantDestinations, applicantDestinationFirstEntry
entries1, entries2, entriesM
formerBiometricVisa
hasFingerprintsTrue, hasFingerprintsFalse, fingerprintsDate
entryPermitAuthority, entryPermitBeginningDate, entryPermitTerminationDate
dateOfArrival, dateOfDeparture
host1Names, host1AddressL1-L3, host1Phone
host2Names, host2AddressL1-L3, host2Phone
hostOrganizationAddressL1-L6, hostOrganizationPhone
hostOrganizationContactAddressL1-L6
fundingTypeM_ARG, fundingTypeM_AUT, fundingTypeM_CCR, fundingTypeM_CHQ
fundingTypeM_HPP, fundingTypeM_TPP, fundingTypeM_Other
fundingTypeHAS_ARG, fundingTypeHAS_AUT, fundingTypeHAS_HFO
fundingTypeHAS_TFP, fundingTypeHAS_TPA, fundingTypeHAS_Other
sponsorTypeA, sponsorTypeHAS, sponsorTypeHS, sponsorTypeM, sponsorTypeOther
townAndDateTime
parental1Names, parental1AddressL1-L5
parental2Names, parental2AddressL1-L5
representativeNames, representativeAddressL1-L6, representativePhone
applicationNumber, applicationNumberPart1, applicationNumberPart2, modificationDate
```

---

## TODO — Full Build Checklist

### Phase 1 — Foundation
- [x] `TODO.md` — this file
- [x] `package.json`
- [x] `tsconfig.json`
- [x] `next.config.ts`
- [x] `tailwind.config.ts`
- [x] `postcss.config.js`
- [x] `.env.example`
- [x] `.env.local` (placeholder values for local dev)
- [x] `.gitignore`
- [x] `src/lib/env.ts` (typed, validated env vars)

### Phase 2 — Database
- [x] `prisma/schema.prisma`
- [x] `src/lib/db/client.ts`

### Phase 3 — TypeScript Types
- [x] `src/lib/types/applicant.ts`
- [x] `src/lib/types/trip.ts`
- [x] `src/lib/types/documents.ts`
- [x] `src/lib/types/consulate.ts`
- [x] `src/lib/types/form-mapping.ts`
- [x] `src/lib/types/quality.ts`
- [x] `src/lib/types/index.ts`

### Phase 4 — LLM Client & Prompts
- [x] `src/lib/llm/client.ts`
- [x] `src/lib/llm/prompts/intake.ts`
- [x] `src/lib/llm/prompts/extraction.ts`
- [x] `src/lib/llm/prompts/cover-letter.ts`
- [x] `src/lib/llm/prompts/quality.ts`
- [x] `src/lib/llm/prompts/chat.ts`

### Phase 5 — Knowledge Base
- [x] `data/consulates/FR_NEW_DELHI.json` (with full tooltips + FAQs)
- [x] `src/lib/knowledge/loader.ts`
- [x] `src/lib/knowledge/queries.ts`

### Phase 6 — Core Library Layers
- [x] `src/lib/intake/questions.ts`
- [x] `src/lib/intake/session.ts`
- [x] `src/lib/intake/consulate-router.ts`
- [x] `src/lib/documents/upload.ts`
- [x] `src/lib/documents/ocr.ts`
- [x] `src/lib/documents/extraction.ts`
- [x] `src/lib/documents/mrz.ts`
- [x] `src/lib/assembly/form-mapper.ts`
- [x] `src/lib/assembly/pdf-filler.ts`
- [x] `src/lib/assembly/cover-letter.ts`
- [x] `src/lib/quality/rules.ts`
- [x] `src/lib/quality/checker.ts`

### Phase 7 — API Routes
- [x] `src/app/api/intake/start/route.ts`
- [x] `src/app/api/intake/answer/route.ts`
- [x] `src/app/api/intake/[sessionId]/summary/route.ts`
- [x] `src/app/api/documents/upload/route.ts`
- [x] `src/app/api/documents/[documentId]/extraction/route.ts`
- [x] `src/app/api/documents/[documentId]/confirm/route.ts`
- [x] `src/app/api/assembly/generate-form/route.ts`
- [x] `src/app/api/assembly/update-field/route.ts`
- [x] `src/app/api/assembly/generate-cover-letter/route.ts`
- [x] `src/app/api/assembly/finalize/route.ts`
- [x] `src/app/api/quality/check/route.ts`
- [x] `src/app/api/quality/[applicantId]/report/route.ts`
- [x] `src/app/api/chat/message/route.ts`
- [x] `src/app/api/stripe/webhook/route.ts` (skeleton)
- [x] `src/app/api/knowledge/tooltip/route.ts`
- [x] `src/app/api/knowledge/faqs/route.ts`

### Phase 8 — i18n
- [x] `src/i18n.ts` (next-intl config)
- [x] `src/middleware.ts` (Clerk + next-intl)
- [x] `src/messages/en/common.json`
- [x] `src/messages/en/intake.json`
- [x] `src/messages/en/documents.json`
- [x] `src/messages/en/form.json`
- [x] `src/messages/en/quality.json`
- [x] `src/messages/en/help.json`
- [x] `src/messages/hi/` (all 6 files mirrored)

### Phase 9 — Pages
- [x] `src/app/[locale]/layout.tsx`
- [x] `src/app/[locale]/page.tsx` (landing)
- [x] `src/app/[locale]/intake/page.tsx`
- [x] `src/app/[locale]/documents/page.tsx`
- [x] `src/app/[locale]/form-review/page.tsx`
- [x] `src/app/[locale]/quality-check/page.tsx`
- [x] `src/app/[locale]/dashboard/page.tsx`
- [x] `src/app/[locale]/sign-in/[[...sign-in]]/page.tsx`
- [x] `src/app/[locale]/sign-up/[[...sign-up]]/page.tsx`

### Phase 10 — UI Components
- [x] `src/components/ui/button.tsx`
- [x] `src/components/ui/input.tsx`
- [x] `src/components/ui/label.tsx`
- [x] `src/components/ui/card.tsx`
- [x] `src/components/ui/badge.tsx`
- [x] `src/components/ui/progress.tsx`
- [x] `src/components/ui/tooltip.tsx`
- [x] `src/components/layout/header.tsx`
- [x] `src/components/layout/footer.tsx`
- [x] `src/components/layout/locale-switcher.tsx`
- [x] `src/components/intake/wizard.tsx`
- [x] `src/components/intake/question-card.tsx`
- [x] `src/components/intake/progress-indicator.tsx`
- [x] `src/components/documents/upload-zone.tsx`
- [x] `src/components/documents/document-card.tsx`
- [x] `src/components/documents/extraction-review.tsx`
- [x] `src/components/form-review/field-row.tsx`
- [x] `src/components/form-review/confidence-badge.tsx`
- [x] `src/components/form-review/pdf-preview.tsx`
- [x] `src/components/help/tooltip-icon.tsx`
- [x] `src/components/help/faq-drawer.tsx`
- [x] `src/components/help/chat-widget.tsx`

### Phase 11 — Tests & Scripts
- [x] `vitest.config.ts`
- [x] `tests/fixtures/mrz-samples.ts`
- [x] `tests/fixtures/bank-statements.ts`
- [x] `tests/fixtures/applicant-profiles.ts`
- [x] `tests/unit/mrz.test.ts`
- [x] `tests/unit/form-mapper.test.ts`
- [x] `tests/unit/quality-rules.test.ts`
- [x] `tests/unit/consulate-router.test.ts` (new — Session 5)
- [x] `tests/integration/pipeline.test.ts`
- [x] `tests/integration/application-flow.test.ts` (new — Session 5)
- [x] `scripts/seed-knowledge-base.ts`
- [x] `scripts/extract-pdf-fields.ts`

---

## Session Log

### Session 1 — 2026-04-04
**Agent:** claude-sonnet-4-6  
**Goal:** Full MVP build from scratch

**Completed this session:**
- Read and reviewed `CLAUDE.md` and `visaagent-prd.md`
- Identified and documented issues: wrong ZDR header, Fastify conflict, PyMuPDF inconsistency
- Extracted real AcroForm field IDs from `CS_14076-05_EN_05.pdf` (version 05, not 02 as PRD stated)
- Confirmed key decisions: Next.js API routes, en+hi locales, sync OCR, Vercel+Railway, Stripe skeleton
- Created `TODO.md` (this file)
- Building full MVP now...

### Session 2 — 2026-04-05
**Agent:** claude-opus-4-6  
**Goal:** Complete remaining UI components, tests, and fix MRZ fixtures

**Completed this session:**
- Created 7 missing UI components: `label.tsx`, `card.tsx`, `tooltip.tsx`, `progress-indicator.tsx`, `extraction-review.tsx`, `confidence-badge.tsx`, `pdf-preview.tsx`
- Created full integration test (`tests/integration/pipeline.test.ts`) — 23 tests covering MRZ → profile → form fields → quality check pipeline for all 3 applicant profiles
- Fixed pre-existing bug in MRZ test fixtures: 8-char Indian passport numbers lacked `<` padding to 9 chars in MRZ line2, causing nationality/DOB/expiry fields to parse at wrong offsets
- Fixed compound given name separator in MRZ line1 (sample 2: `<<` → `<` between given names)
- All 47 tests pass (7 MRZ + 10 form-mapper + 7 quality-rules + 23 integration)
- Updated TODO.md — all phases now 100% complete

**Build blockers fixed:**
- `next.config.ts` → `next.config.mjs` (Next.js 14 doesn't support `.ts` config)
- `src/middleware.ts` — `auth.protect()` → `auth().protect()` (Clerk v5 API)
- `src/middleware.ts` — excluded `/api` routes from middleware matcher (Clerk was rewriting API requests with `protect-rewrite`)
- `src/middleware.ts` — skip intl middleware for `/api` routes
- `src/components/layout/footer.tsx` — added missing `'use client'` directive
- `src/i18n.ts` — fixed `messages` type to `AbstractIntlMessages`
- `src/lib/env.ts` — lazy proxy instead of eager validation (build doesn't crash without env vars)
- All server component pages — added `setRequestLocale(locale)` for next-intl static rendering
- Created root `src/app/layout.tsx` (required by App Router)
- Removed unused `useTranslations` import from landing page (server component uses `getTranslations`)

**Verification:**
- `npx tsc --noEmit` — 0 errors
- `npx next build` — builds successfully
- `npx vitest --run` — 47/47 tests pass
- `npm run dev` — dev server starts, pages render, Clerk auth works
- API routes return JSON correctly

**Clerk auth configured** — user created a Clerk account and set keys in `.env.local`

**Current blocker for full local testing:** No PostgreSQL database. The intake wizard calls `/api/intake/start` which needs Prisma/DB. Options: set up local Postgres, or add mock/in-memory mode.

### Session 3 — 2026-04-05
**Agent:** claude-opus-4-6
**Goal:** Set up Railway PostgreSQL and switch LLM provider to OpenRouter

**Completed this session:**
- Connected Railway PostgreSQL — `npx prisma db push` created all 6 tables
- Created `.env` for Prisma CLI (reads `.env` not `.env.local`)
- Ran `npm run seed` — validated FR_NEW_DELHI consulate data
- Switched LLM provider from Anthropic SDK to OpenRouter via `openai` SDK
  - Rewrote `src/lib/llm/client.ts` — OpenAI SDK pointed at `openrouter.ai/api/v1`
  - Updated `src/lib/env.ts` — `OPENROUTER_API_KEY` replaces `ANTHROPIC_API_KEY`
  - Updated stream consumers in `cover-letter.ts` and `chat/message/route.ts` (simplified — no more Anthropic-specific event types)
  - Removed unused `anthropic` import from `session.ts`
  - Updated `.env.local`, `.env.example`, `CLAUDE.md`, `TODO.md`
- Smart model: `qwen/qwen3.6-plus:free` · Fast model: `openai/gpt-oss-20b:free`
- All 47 tests pass, typecheck clean

- OpenRouter API key set and verified — both models respond correctly
- Tested structured JSON output (Qwen3.6 Plus) and chat (gpt-oss-20b) — both work

### Session 4 — 2026-04-05
**Agent:** claude-opus-4-6
**Goal:** Redesign user flow — replace rigid intake wizard with AI-first onboarding + application dashboard

**Completed this session:**
- **New flow:** Landing page (3-dropdown visa finder) → Recommendation card → Application dashboard (document checklist + smart form + quality check)
- **Data layer:** Added `Application` model to Prisma, expanded consulate router to return `VisaRecommendation`, created 3 new API routes (`/api/application/create`, `/api/application/[id]`, `/api/application/[id]/form`)
- **Landing page:** Replaced old hero + "Get started" with `VisaFinder` component (nationality/destination/purpose dropdowns) + `RecommendationCard` (visa type, processing time, refusal rate, doc count)
- **Application dashboard:** `ApplicationDashboard` at `/application/[id]` with:
  - `ProgressBar` — overall completion (docs + form fields)
  - `DocumentChecklist` — per-document upload from consulate requirements
  - `DocumentUploadModal` — focused single-document upload
  - `FormSections` — 6 collapsible sections (Personal, Passport, Travel, Employment, Travel History, Ties) with 24 fields, inline editing, confidence indicators
  - Quality check link
- **Auth:** Anonymous until upload/save, then redirect to sign-in
- **Removed:** Old intake pages, wizard components, intake API routes, session/questions logic
- All 47 tests pass, typecheck clean

### Session 5 — 2026-04-05
**Agent:** claude-opus-4-6
**Goal:** Complete Phase 6 — tests, docs, verification

**Completed this session:**
- Added 18 new tests across 2 new test files:
  - `tests/unit/consulate-router.test.ts` — 6 tests: routing IND→FRA, recommendation metadata, doc count, all purposes, error cases
  - `tests/integration/application-flow.test.ts` — 12 tests: full new flow (onboarding → routing → doc checklist → form mapping → quality check → progress calculation) for all 3 profiles
- Updated `CLAUDE.md` — new user flow section, updated project structure tree, updated API routes section with auth requirements, updated testing section, fixed stale Claude Haiku reference
- Updated `TODO.md` — session log, updated "What the Next Agent Needs to Know"
- **All 65 tests pass** (47 original + 18 new), typecheck clean, `next build` succeeds

**Verification:**
- `npx tsc --noEmit` — 0 errors
- `npx next build` — builds successfully
- `npx vitest --run` — 65/65 tests pass

---

## What the Next Agent Needs to Know

### Quick start
```bash
npm install          # Dependencies are already installed but run if node_modules is missing
npm run dev          # Starts at http://localhost:3000/en
npm test             # 65 tests, all passing
npx tsc --noEmit     # 0 errors
npx next build       # Production build succeeds
```

### Current state
- **User flow:** Landing (3-dropdown visa finder → recommendation card) → Application dashboard (document checklist + 6-section form + progress bar) → Quality check
- **Build passes**, **typecheck passes**, **65 tests pass** (6 test files)
- **Railway PostgreSQL connected** — 7 tables (Applicant, Trip, Application, DocumentUpload, FormState, IntakeSession, ChatMessage)
- **OpenRouter LLM connected** — Smart: `qwen/qwen3.6-plus:free` · Fast: `openai/gpt-oss-20b:free`
- **Clerk auth configured** — anonymous start, sign-in required on upload/form save
- **Session 4 redesign changes are uncommitted** — all working but need `git add` + `git commit`

### What still needs to happen
1. **Commit Session 4+5 changes** — significant redesign is uncommitted (see `git status`)
2. Fill remaining API keys in `.env.local` (Google Vision, R2)
3. Test document upload + extraction end-to-end (needs Google Vision + R2)
4. Connect form save → form-mapper → PDF generation pipeline
5. Review Hindi translations with native speaker
6. i18n: replace remaining hardcoded English strings with `t()` calls
7. Evaluate free model quality — switch to paid OpenRouter models if output isn't good enough

### Key files
- `CLAUDE.md` — Agent instructions and conventions (updated Session 5)
- `visaagent-prd.md` — Full product spec
- `TODO.md` — This file (build checklist + session log)
- `.env.local` — Has Clerk + OpenRouter + Railway keys set; Google Vision + R2 are placeholders
- `.env.example` — Template for all required env vars
- `prisma/schema.prisma` — 7 models including Application (added Session 4)
- `src/lib/intake/consulate-router.ts` — Visa routing: (nationality, dest, purpose) → VisaRecommendation
- `src/lib/types/application.ts` — VisaRecommendation, ApplicationSummary types

---

## Human Action Required (before going live)

1. ~~**Clerk** — create app at clerk.com, copy publishable + secret keys~~ ✅ Done
2. ~~**Railway** — create PostgreSQL instance, copy `DATABASE_URL`, run `prisma db push`~~ ✅ Done
3. ~~**PDF field verification** — `CS_14076-05_EN_05.pdf` copied to `public/forms/schengen-form.pdf`~~ ✅ Done
4. ~~**OpenRouter** — get API key, set `OPENROUTER_API_KEY` in `.env.local`~~ ✅ Done
5. **Cloudflare R2** — create bucket `visaagent-documents`, copy access keys
6. **Google Cloud Vision** — enable Vision API, create service account, copy API key
7. **Hindi translations** — review `src/messages/hi/` with a native speaker before launch
8. **Cover letter** — review AI-generated cover letter output against real immigration consultant feedback
