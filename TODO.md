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
| Models | Sonnet `claude-sonnet-4-6` for generation · Haiku `claude-haiku-4-5-20251001` for chat |

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
- [x] `tests/integration/pipeline.test.ts`
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

---

## What the Next Agent Needs to Know

### Quick start
```bash
npm install          # Dependencies are already installed but run if node_modules is missing
npm run dev          # Starts at http://localhost:3000/en
npm test             # 47 tests, all passing
npx tsc --noEmit     # 0 errors
npx next build       # Succeeds
```

### Current state
- **All 11 build phases complete** — foundation, database schema, types, LLM client, knowledge base, core libraries, API routes, i18n, pages, UI components, tests
- **Build passes**, **typecheck passes**, **47 tests pass**
- **Dev server works** — landing page, auth (Clerk), all page routes render
- **API routes work** — return proper JSON (but DB-dependent ones fail without Postgres)

### What still needs to happen for full local testing
1. **PostgreSQL** — set up local or Railway instance, put `DATABASE_URL` in `.env.local`, run `npx prisma db push`
2. **Seed data** — run `npm run seed` to load consulate knowledge base into DB

### What still needs to happen before production
1. Fill remaining API keys in `.env.local` (Anthropic, Google Vision, R2)
2. Copy Schengen form PDF to `public/forms/schengen-form.pdf`
3. Review Hindi translations with native speaker
4. Replace hardcoded English strings on landing/dashboard pages with `t()` calls
5. Test full end-to-end flow with real API keys

### Key files
- `CLAUDE.md` — Agent instructions and conventions
- `visaagent-prd.md` — Full product spec
- `TODO.md` — This file (build checklist + session log)
- `.env.local` — Has Clerk keys set; all others are placeholders
- `.env.example` — Template for all required env vars

---

## Human Action Required (before going live)

1. ~~**Clerk** — create app at clerk.com, copy publishable + secret keys~~ ✅ Done
2. **API Keys** — fill in `.env.local` with real values (Anthropic, Google Cloud Vision, R2)
3. **PDF field verification** — copy `CS_14076-05_EN_05.pdf` to `public/forms/schengen-form.pdf` so the form-fill pipeline can load it
4. **Railway** — create a PostgreSQL instance, copy `DATABASE_URL` to `.env.local`
5. **Cloudflare R2** — create bucket `visaagent-documents`, copy access keys
6. **Google Cloud Vision** — enable Vision API, create service account, copy API key
7. **Run** `npx prisma db push` to create database tables
8. **Run** `npm run seed` to load consulate knowledge base
9. **Hindi translations** — review `src/messages/hi/` with a native speaker before launch
10. **Cover letter** — review AI-generated cover letter output against real immigration consultant feedback
