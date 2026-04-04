# VisaAgent — Product Requirements Document

**AI-Powered Schengen Visa Application Platform**
Version 2.0 | April 2026 | Agent-Optimized

---

## 1. What This Is

VisaAgent guides applicants through the Schengen short-stay visa (C-type) application process. It combines an LLM reasoning engine with immigration-specific data, document processing, and structured workflows to reduce preparation time from 10–15 hours to under 2 hours while improving application quality and approval rates.

The platform is mobile-first and localized in English, Simplified Chinese, and Hindi. A three-tier contextual help system (tooltips, FAQ panels, AI chat assistant) ensures first-time applicants can complete the process without external guidance.

VisaAgent does NOT replace immigration lawyers. It creates a reliable self-service path for the 70–80% of straightforward applications, with warm handoffs to licensed professionals for edge cases.

**MVP scope:** Indian applicants → France (tourist visa) → Embassy of France, New Delhi via VFS Global.

---

## 2. MVP Use Case

| Parameter | Value |
|---|---|
| Applicant nationality | Indian |
| Destination country | France |
| Consulate | Embassy of France, New Delhi (`FR_NEW_DELHI`) |
| VFS provider | VFS Global |
| Visa type | Short-stay tourist (Type C) |
| Application form | Harmonised form cerfa No. 14076*02 (French variant) |
| Visa fee | €90 adults, €45 children 6–12 |

**Why this combination:** France received 201,774 applications from India in 2024 (2nd highest after Switzerland's 217,373). France has a ~16% refusal rate for Indian applicants — high enough that quality improvement has clear value. France is also the #1 global Schengen destination (~3M total applications), so everything built for France-India generalizes broadly.

---

## 3. Core Problems Solved

1. **Information fragmentation** — requirements scattered across consulate sites, VFS portals, and forums in multiple languages. Applicants miss documents, use wrong formats, target wrong consulate. Solved by: LLM + structured knowledge base.

2. **Form filling complexity** — 37-field application form with ambiguous questions. Inconsistencies between form and supporting documents trigger refusals. Solved by: conversational intake + auto-fill with source provenance.

3. **No quality feedback** — applicants submit and hope with no pre-submission review. Preventable refusals create permanent negative records in VIS database. Solved by: AI-powered completeness and consistency checks.

4. **Document preparation burden** — 10–15 hours of tedious work per application. Solved partially: AI drafts cover letters and extracts data; human obtains originals.

**Explicitly out of scope:** VFS/TLS appointment booking (blocked by anti-bot systems and legal constraints), biometrics collection (physical presence required), strategic legal case planning (requires licensed professionals).

---

## 4. Architecture

Five-layer system, each with distinct responsibilities:

**Layer 1 — Conversational Intake** (`/src/lib/intake/`)
Structured interview gathering trip intent, personal details, employment, finances, travel history, ties to home country. Uses Claude Sonnet with structured output schemas. Determines correct consulate, produces personalized document checklist, generates risk assessment.

**Layer 2 — Document Processing** (`/src/lib/documents/`)
Upload, OCR, and extraction from passport scans, bank statements, employer letters. Vision models for passport MRZ parsing. LLM-based field extraction with confidence scores. Validates completeness and flags inconsistencies.

**Layer 3 — Immigration Knowledge Base** (`/src/lib/knowledge/`)
Consulate-specific requirements, document checklists, financial thresholds, form field mappings, refusal pattern data. Stored as structured JSON in `/data/consulates/`, version-controlled. RAG layer for LLM grounding.

**Layer 4 — Application Assembly** (`/src/lib/assembly/`)
Generates filled application form PDF (pdf-lib AcroForm filling), drafts cover letter, produces document checklist with status tracking. Web-based side-by-side review interface before final PDF generation.

**Layer 5 — Quality Assurance** (`/src/lib/quality/`)
Pre-submission review checking completeness, internal consistency, risk flags, alignment with consulate expectations. Rule-based validation + LLM-powered semantic consistency checks.

**LLM strategy:** General-purpose foundation model (Claude) as reasoning engine, augmented with immigration-specific data layers via RAG. No fine-tuning — Schengen visa regulations amount to hundreds of thousands of tokens (too small for meaningful fine-tuning), and consulate practices shift quarterly (making continuous fine-tuning impractical).

---

## 5. Technology Stack

| Component | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + React + Tailwind CSS | SSR for SEO, mobile-first |
| i18n | next-intl with JSON translation files | App Router native, ICU message format |
| Backend API | Node.js + Fastify + TypeScript | Unified JS stack, best agent support |
| LLM Engine | Anthropic Claude API (Sonnet for generation, Haiku for chat assistant) | Structured output, multilingual, long-context |
| Document OCR | Google Cloud Vision API | Best accuracy for Asian-language documents |
| Mobile Document Capture | Cropper.js + HTML5 capture attribute | Cross-browser camera access |
| PDF Processing | pdf-lib (form filling), PyMuPDF (extraction) | AcroForm manipulation |
| Database | PostgreSQL + pgvector (Railway managed) | Relational + vector for RAG |
| File Storage | Cloudflare R2 (S3-compatible) | Document uploads, generated PDFs |
| Auth | Clerk | Best Next.js integration, built-in components |
| Hosting (frontend) | Vercel | — |
| Hosting (backend) | Railway | Managed, European region, managed Postgres |
| Payment | Stripe | Post-MVP monetization |
| Domain | flufex.com | — |
| Repo | github.com/vitazok/immigration | Monorepo |

---

## 6. Project Structure

```
/
├── CLAUDE.md                          # Agent instructions (see Section 15)
├── package.json                       # Root workspace config
├── .env.example                       # All required env vars
├── data/
│   └── consulates/
│       └── FR_NEW_DELHI.json          # Knowledge base seed data
├── src/
│   ├── app/                           # Next.js App Router pages
│   │   ├── [locale]/                  # i18n dynamic segment
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── intake/                # Wizard steps
│   │   │   ├── documents/             # Upload & review
│   │   │   ├── form-review/           # 37-field review UI
│   │   │   ├── quality-check/         # Pre-submission report
│   │   │   └── dashboard/             # Application status
│   │   └── api/                       # API routes (Next.js route handlers)
│   │       ├── intake/
│   │       ├── documents/
│   │       ├── assembly/
│   │       ├── quality/
│   │       └── chat/                  # AI chat assistant endpoint
│   ├── lib/
│   │   ├── intake/                    # Layer 1: Interview logic
│   │   ├── documents/                 # Layer 2: OCR & extraction
│   │   ├── knowledge/                 # Layer 3: Knowledge base queries
│   │   ├── assembly/                  # Layer 4: Form filling & doc gen
│   │   ├── quality/                   # Layer 5: Validation & checks
│   │   ├── llm/                       # Claude API client & prompts
│   │   ├── db/                        # Prisma schema & client
│   │   └── types/                     # Shared TypeScript interfaces
│   ├── components/
│   │   ├── ui/                        # Reusable UI primitives
│   │   ├── intake/                    # Intake wizard components
│   │   ├── documents/                 # Upload & preview components
│   │   ├── form-review/               # Form review components
│   │   ├── help/                      # Tooltips, FAQ, chat widget
│   │   └── layout/                    # Header, footer, nav
│   └── messages/
│       ├── en/                        # English translations
│       ├── zh-CN/                     # Simplified Chinese
│       └── hi/                        # Hindi
├── prisma/
│   └── schema.prisma                  # Database schema
├── tests/
│   ├── fixtures/                      # Synthetic test data
│   │   ├── mrz-samples.ts            # Generated MRZ strings
│   │   ├── bank-statements.ts        # Mock extraction outputs
│   │   └── applicant-profiles.ts     # Complete test profiles
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── scripts/
    └── seed-knowledge-base.ts         # Populate consulate data
```

---

## 7. Core Data Models

These are the canonical TypeScript interfaces. Implement exactly as shown.

```typescript
// src/lib/types/applicant.ts

export interface ApplicantProfile {
  id: string;
  // Personal info (from intake + passport extraction)
  surname: string;                    // As in passport MRZ
  surnameAtBirth: string | null;
  givenNames: string;                 // As in passport MRZ
  dateOfBirth: string;                // YYYY-MM-DD
  placeOfBirth: string;
  countryOfBirth: string;             // ISO 3166-1 alpha-3
  currentNationality: string;         // ISO 3166-1 alpha-3
  nationalityAtBirth: string | null;
  sex: 'male' | 'female';
  maritalStatus: 'single' | 'married' | 'separated' | 'divorced' | 'widowed' | 'other';
  
  // Contact
  homeAddress: Address;
  email: string;
  phone: string;
  
  // Document info (from passport extraction)
  passportNumber: string;
  passportIssueDate: string;          // YYYY-MM-DD
  passportExpiryDate: string;         // YYYY-MM-DD
  passportIssuingAuthority: string;
  passportIssuingCountry: string;     // ISO 3166-1 alpha-3
  mrzLine1: string;                   // Raw MRZ line 1
  mrzLine2: string;                   // Raw MRZ line 2
  
  // Employment
  occupation: 'employed' | 'self_employed' | 'student' | 'retired' | 'unemployed' | 'other';
  employerName: string | null;
  employerAddress: Address | null;
  employerPhone: string | null;
  jobTitle: string | null;
  monthlySalary: MoneyAmount | null;
  employmentStartDate: string | null; // YYYY-MM-DD
  
  // Financial
  bankName: string | null;
  accountBalance: MoneyAmount | null;
  averageMonthlyBalance: MoneyAmount | null;
  
  // Travel history
  previousSchengenVisas: PreviousVisa[];
  fingerprintsPreviouslyCollected: boolean;
  fingerprintsDate: string | null;    // YYYY-MM-DD
  
  // Ties to home country (for risk assessment)
  propertyOwnership: boolean;
  familyDependents: string | null;    // Description of family ties
  returnIntent: string | null;        // Narrative for cover letter
  
  createdAt: string;                  // ISO 8601
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;                    // ISO 3166-1 alpha-3
}

export interface MoneyAmount {
  amount: number;
  currency: string;                   // ISO 4217 (INR, EUR, CNY)
}

export interface PreviousVisa {
  validFrom: string;                  // YYYY-MM-DD
  validTo: string;
  stickerNumber: string | null;
}
```

```typescript
// src/lib/types/trip.ts

export interface TripDetails {
  id: string;
  applicantId: string;
  
  mainDestination: string;            // ISO 3166-1 alpha-3 (FRA for France)
  otherDestinations: string[];        // Additional Schengen countries
  firstEntryCountry: string;          // ISO 3166-1 alpha-3
  
  purpose: 'tourism' | 'business' | 'visiting_family' | 'cultural' | 'sports' | 'official' | 'medical' | 'study' | 'transit' | 'other';
  purposeDescription: string | null;
  
  arrivalDate: string;                // YYYY-MM-DD
  departureDate: string;              // YYYY-MM-DD
  durationDays: number;
  
  entriesRequested: 'single' | 'double' | 'multiple';
  
  // Accommodation
  accommodationType: 'hotel' | 'private' | 'other';
  accommodationName: string;          // Hotel name or host name
  accommodationAddress: Address;
  accommodationPhone: string | null;
  accommodationEmail: string | null;
  
  // Inviting person/organization (if applicable)
  invitingPerson: InvitingPerson | null;
  invitingOrganization: InvitingOrganization | null;
  
  // Financial means for trip
  costCoveredBy: 'self' | 'sponsor';
  meansOfSupport: ('cash' | 'credit_card' | 'travelers_cheques' | 'prepaid_accommodation' | 'prepaid_transport' | 'other')[];
  
  // Consulate determination (calculated)
  targetConsulateId: string;          // e.g., "FR_NEW_DELHI"
}

export interface InvitingPerson {
  surname: string;
  givenNames: string;
  address: Address;
  phone: string;
  email: string;
}

export interface InvitingOrganization {
  name: string;
  address: Address;
  phone: string;
  contactPerson: string;
  contactEmail: string;
}
```

```typescript
// src/lib/types/documents.ts

export interface DocumentUpload {
  id: string;
  applicantId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;                    // S3/R2 URL
  mimeType: string;
  uploadedAt: string;
  
  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractionResult: DocumentExtraction | null;
  extractionConfidence: number | null; // 0.0 to 1.0
}

export type DocumentType = 
  | 'passport'
  | 'bank_statement'
  | 'employer_letter'
  | 'cover_letter'
  | 'travel_insurance'
  | 'flight_reservation'
  | 'hotel_reservation'
  | 'photo'
  | 'other';

export interface DocumentExtraction {
  documentType: DocumentType;
  fields: Record<string, ExtractedField>;
  rawText: string | null;
}

export interface ExtractedField {
  key: string;
  value: string;
  confidence: number;                 // 0.0 to 1.0
  source: 'mrz' | 'ocr' | 'llm_extraction' | 'manual';
  boundingBox: BoundingBox | null;    // For highlighting in UI
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}
```

```typescript
// src/lib/types/consulate.ts

export interface ConsulateRequirement {
  consulateId: string;                // e.g., "FR_NEW_DELHI"
  country: string;                    // "France"
  city: string;                       // "New Delhi"
  countryCode: string;                // ISO 3166-1 alpha-3
  
  vfsProvider: 'vfs_global' | 'tls_contact' | 'bls_international';
  appointmentBookingUrl: string;
  
  requiredDocuments: DocumentRequirement[];
  
  financialThresholdMin: MoneyAmount; // Minimum balance/daily budget
  bankStatementMonths: number;        // How many months required
  
  photoSpec: {
    width: number;                    // mm
    height: number;                   // mm
    background: string;               // "white"
    standard: string;                 // "ICAO"
  };
  
  processingTimeDays: { min: number; max: number };
  
  knownPractices: string[];           // Informal notes on consulate behaviors
  
  lastVerifiedDate: string;           // YYYY-MM-DD
  refusalRateEstimate: number;        // 0.0 to 1.0
  
  formFieldOverrides: Record<string, string>; // Consulate-specific form defaults
  
  tooltips: Record<string, LocalizedString>; // Field-level help text
  faqs: FaqEntry[];                   // Step-level FAQs
}

export interface DocumentRequirement {
  documentType: DocumentType;
  required: boolean;
  description: LocalizedString;
  notes: LocalizedString | null;      // Consulate-specific notes
  templateUrl: string | null;         // Template for generated docs
}

export interface LocalizedString {
  en: string;
  'zh-CN': string;
  hi: string;
}

export interface FaqEntry {
  wizardStep: string;                 // Which step this FAQ belongs to
  question: LocalizedString;
  answer: LocalizedString;
  order: number;
}
```

```typescript
// src/lib/types/form-mapping.ts

export interface FormFieldMapping {
  fieldNumber: number;                // 1–37
  fieldLabel: string;                 // Official label
  acroFormFieldId: string;            // PDF AcroForm field name
  fieldType: 'text' | 'checkbox' | 'radio' | 'date' | 'dropdown';
  
  dataSource: DataSource;
  transformRule: string | null;       // e.g., "DD/MM/YYYY", "UPPERCASE"
  
  // For review UI
  confidenceLevel: 'high' | 'medium' | 'low'; // Based on data source
  tooltipKey: string;                 // Key into consulate tooltips
}

export type DataSource = 
  | { type: 'applicant'; path: string }      // e.g., "surname"
  | { type: 'trip'; path: string }           // e.g., "mainDestination"
  | { type: 'extraction'; docType: DocumentType; field: string }
  | { type: 'computed'; rule: string }       // e.g., "determineDuration"
  | { type: 'manual' };                      // User must fill
```

```typescript
// src/lib/types/quality.ts

export interface QualityCheckResult {
  applicationId: string;
  checkedAt: string;
  overallScore: number;               // 0–100
  riskLevel: 'low' | 'medium' | 'high';
  
  blockers: QualityIssue[];           // Will likely cause refusal
  warnings: QualityIssue[];           // May trigger additional doc requests
  recommendations: QualityIssue[];    // Optional improvements
}

export interface QualityIssue {
  code: string;                       // Machine-readable, e.g., "MISSING_BANK_STATEMENT"
  category: 'completeness' | 'consistency' | 'financial' | 'travel_logic' | 'document_quality';
  severity: 'blocker' | 'warning' | 'recommendation';
  title: LocalizedString;
  description: LocalizedString;
  affectedFields: number[];           // Form field numbers
  suggestedAction: LocalizedString;
}
```

---

## 8. The 37-Field Mapping

The Schengen application form (Annex I, Visa Code) has 37 numbered fields. The form is identical for all nationalities and all Schengen states. The AcroForm field IDs below must be verified against the actual French-variant PDF template once obtained — the agent should download the official PDF from France-Visas and inspect field names using pdf-lib.

| # | Label | Type | Data Source | Transform |
|---|---|---|---|---|
| 1 | Surname (family name) | text | `applicant.surname` | UPPERCASE |
| 2 | Surname at birth | text | `applicant.surnameAtBirth` | UPPERCASE, "N/A" if null |
| 3 | First name(s) | text | `applicant.givenNames` | UPPERCASE |
| 4 | Date of birth | date | `applicant.dateOfBirth` | DD/MM/YYYY |
| 5 | Place of birth | text | `applicant.placeOfBirth` | — |
| 6 | Country of birth | text | `applicant.countryOfBirth` | Country name from code |
| 7 | Current nationality | text | `applicant.currentNationality` | Country name from code |
| 8 | Sex | radio | `applicant.sex` | Male/Female |
| 9 | Marital status | radio | `applicant.maritalStatus` | Capitalize |
| 10 | Parental authority / legal guardian (minors) | text | manual | — |
| 11 | National identity number | text | manual | "N/A" for Indian applicants |
| 12 | Type of travel document | radio | computed | "Ordinary passport" default |
| 13 | Number of travel document | text | `applicant.passportNumber` | — |
| 14 | Date of issue | date | `applicant.passportIssueDate` | DD/MM/YYYY |
| 15 | Valid until | date | `applicant.passportExpiryDate` | DD/MM/YYYY |
| 16 | Issued by | text | `applicant.passportIssuingAuthority` | — |
| 17 | Personal data of family member (EU/EEA/CH) | text | manual | "N/A" for most Indian applicants |
| 18 | Family relationship with EU/EEA/CH citizen | radio | manual | "N/A" for most |
| 19 | Home address, email, phone | text | `applicant.homeAddress` + `applicant.email` + `applicant.phone` | Format as single string |
| 20 | Employer and employer's address | text | `applicant.employerName` + `applicant.employerAddress` | Combined string |
| 21 | Main purpose of journey | checkbox | `trip.purpose` | Map to form options |
| 22 | Destination country | text | `trip.mainDestination` | Country name |
| 23 | Country of first entry | text | `trip.firstEntryCountry` | Country name |
| 24 | Number of entries requested | radio | `trip.entriesRequested` | Single/Two/Multiple |
| 25 | Duration of intended stay | text | `trip.durationDays` | Number string |
| 26 | Schengen visas issued past 3 years | text | `applicant.previousSchengenVisas` | Format dates, "No" if empty |
| 27 | Fingerprints collected previously | radio | `applicant.fingerprintsPreviouslyCollected` | Yes/No + date |
| 28 | Entry permit for final destination | text | manual | "N/A" if not applicable |
| 29 | Intended date of arrival | date | `trip.arrivalDate` | DD/MM/YYYY |
| 30 | Intended date of departure | date | `trip.departureDate` | DD/MM/YYYY |
| 31 | Surname and first name of inviting person / hotel | text | `trip.accommodationName` + `trip.accommodationAddress` | — |
| 32 | Name and address of inviting company/org | text | `trip.invitingOrganization` | — |
| 33 | Cost of travelling and living covered by | checkbox | `trip.costCoveredBy` + `trip.meansOfSupport` | Map to form checkboxes |
| 34 | Personal data of EU/EEA/CH family member | text | manual | Skip for most Indian applicants |
| 35 | Family relationship with EU/EEA/CH citizen | radio | manual | Skip for most |
| 36 | Place and date | text | computed | City + current date, DD/MM/YYYY |
| 37 | Signature | — | manual | User signs printed form |

**Important:** The agent must download the actual French-variant harmonised PDF form (cerfa 14076*02) from France-Visas and extract the exact AcroForm field IDs using:
```typescript
import { PDFDocument } from 'pdf-lib';
const pdf = await PDFDocument.load(formBytes);
const form = pdf.getForm();
form.getFields().forEach(f => console.log(f.getName(), f.constructor.name));
```
Then update this mapping with the real field IDs.

---

## 9. API Routes

All routes prefixed with `/api/`. Request/response bodies are JSON.

### Intake
```
POST   /api/intake/start
  Body: { locale: "en" | "zh-CN" | "hi" }
  Response: { sessionId: string, firstQuestion: IntakeQuestion }

POST   /api/intake/answer
  Body: { sessionId: string, questionId: string, answer: any }
  Response: { nextQuestion: IntakeQuestion | null, progress: number }

GET    /api/intake/:sessionId/summary
  Response: { applicant: Partial<ApplicantProfile>, trip: Partial<TripDetails>, 
              consulateId: string, checklist: DocumentRequirement[], 
              riskAssessment: { level: string, flags: string[] } }
```

### Documents
```
POST   /api/documents/upload
  Body: FormData { file: File, type: DocumentType, applicantId: string }
  Response: { documentId: string, extractionStatus: "pending" }

GET    /api/documents/:documentId/extraction
  Response: { status: string, result: DocumentExtraction | null }

POST   /api/documents/:documentId/confirm
  Body: { corrections: Record<string, string> }
  Response: { confirmed: true }
```

### Assembly
```
POST   /api/assembly/generate-form
  Body: { applicantId: string, tripId: string }
  Response: { formUrl: string, fieldMappings: FormFieldMapping[], 
              fieldsNeedingReview: number[] }

POST   /api/assembly/update-field
  Body: { applicantId: string, fieldNumber: number, value: string }
  Response: { updated: true }

POST   /api/assembly/generate-cover-letter
  Body: { applicantId: string, tripId: string }
  Response: { coverLetterUrl: string, coverLetterText: string }

POST   /api/assembly/finalize
  Body: { applicantId: string }
  Response: { finalPdfUrl: string, packageContents: string[] }
```

### Quality
```
POST   /api/quality/check
  Body: { applicantId: string }
  Response: QualityCheckResult

GET    /api/quality/:applicantId/report
  Response: QualityCheckResult
```

### Chat Assistant
```
POST   /api/chat/message
  Body: { sessionId: string, applicantId: string | null, 
          currentStep: string, message: string, locale: string }
  Response: { reply: string, suggestedActions: string[] | null }
```

The chat assistant is a **separate endpoint** with its own conversation history per session. It receives the current application context (wizard step, collected data, target consulate) and returns contextual answers. It uses Claude Haiku for speed and cost. In the UI, it appears as a floating chat widget on every wizard screen.

---

## 10. Features

### F1: Smart Intake Interview (P0 — MVP)

Conversational interface gathering all information needed for a Schengen visa application through structured dialogue. Determines correct consulate, identifies risk profile, produces personalized document checklist.

**Inputs:** Nationality, destinations and dates, purpose, employment status, finances, travel history, family ties.

**Outputs:** Consulate determination, personalized checklist with consulate-specific requirements, risk score (low/medium/high), flagged concerns.

**Acceptance criteria:**
- Correct consulate determination in 99%+ of cases
- Checklist covers 100% of required documents for identified consulate
- Risk flags catch 90%+ of common refusal triggers (insufficient funds, weak ties, inconsistent purpose)

### F2: Document Upload & Extraction (P0 — MVP)

Upload interface for passport scans, bank statements, employer letters. AI extracts structured data, validates against requirements, flags missing/inconsistent information.

**Key extraction targets:**
- Passport: full name, DOB, nationality, passport number, issue/expiry dates, MRZ data
- Bank statements: account holder, account number, statement period, closing balance, average balance, salary deposits
- Employer letter: company name, position, salary, employment start date, leave dates

**Acceptance criteria:**
- Passport MRZ extraction at 99.5%+ accuracy
- Bank statement field extraction at 95%+ for SBI, HDFC, ICICI (top 3 Indian banks)
- Graceful degradation to manual entry when confidence < 0.7

### F3: Application Form Auto-Fill (P0 — MVP)

Generates pre-filled Schengen application form (37 fields) from intake + extraction data. Web-based review with side-by-side source provenance before final PDF generation.

**Technical approach:** Load blank cerfa 14076*02 French-variant PDF → fill AcroForm fields via pdf-lib → render web preview with field-level confidence colors (green=high from MRZ, yellow=medium from OCR, red=low/inferred) → user reviews and corrects → generate final flattened PDF.

**Acceptance criteria:**
- 100% of extractable fields pre-filled when source data available
- Side-by-side review shows provenance of each value
- Final PDF is valid AcroForm accepted by VFS submission systems

### F4: Cover Letter & Document Generation (P0 — MVP)

AI-generated cover letter tailored to applicant profile, trip purpose, and target consulate. Emphasizes ties to home country (property, family, stable employment). Language calibrated to consulate expectations.

**Acceptance criteria:**
- Generated cover letters rated "acceptable or better" by immigration consultants in 90%+ of test cases
- Letters address consulate-specific concerns (e.g., emphasizing return intent for high-risk profiles)
- Output in English for submission + reference translation in user's preferred language

### F5: Pre-Submission Quality Check (P0 — MVP)

Automated review of complete application package. Checks completeness, consistency, and risk factors.

**Output categories:**
- **Blockers**: issues that will likely cause refusal
- **Warnings**: may trigger additional document requests
- **Recommendations**: optional improvements

**Acceptance criteria:**
- Catches 95%+ of completeness issues
- Catches 90%+ of cross-document inconsistencies (e.g., name spelled differently on passport vs. employer letter)
- Zero false blockers that would delay a valid application

### F6: Multilingual Interface (P0 — MVP)

Entire UI in English, Simplified Chinese, and Hindi. Form itself always filled in English (consulate requirement). All surrounding UI, explanations, and reference copies localized.

**Implementation:** next-intl, all strings via `t()` with keys in `/src/messages/{locale}/`. Dynamic LLM-generated content pre-translated at content-update time and cached. Language switcher in header, instant switch without form state loss.

**Chinese name handling:** Extract both Pinyin (MRZ) and Chinese characters (visual zone) from passport. Display side-by-side. Pinyin for official form, Chinese characters for user reference.

**Acceptance criteria:**
- 100% of UI chrome in all 3 languages at launch
- Language switch instant, no state loss
- Cover letter in English + reference translation

### F7: Mobile-First Responsive Design (P0 — MVP)

Mobile-first, works on 360px screens. Camera-first document upload on mobile (input `accept="image/*" capture="environment"`). Document edge detection overlay. Sequential captures for multi-page documents.

**Breakpoints:**
- Mobile (< 640px): single column, bottom-fixed nav, camera-first upload, collapsible form sections
- Tablet (640–1024px): single column with wider margins
- Desktop (> 1024px): two-column form review with PDF preview, sidebar nav, drag-and-drop upload

**Acceptance criteria:**
- All wizard steps functional on iOS Safari and Android Chrome at 360px
- Camera upload produces extraction-quality images 90%+ of cases
- No horizontal scrolling at any breakpoint
- Page load under 3 seconds on 4G

### F8: Contextual Help & FAQ (P0 — MVP)

Three-tier help system:

**Tier 1 — Tooltips:** Every form field has a `(?)` icon with plain-language explanation and example. Stored in knowledge base as localized JSON.

**Tier 2 — FAQ Panels:** Each wizard step has collapsible FAQ panel (drawer on mobile, sidebar on desktop) with 5–8 curated questions. Consulate-specific.

**Tier 3 — AI Chat Assistant:** Floating chat button → lightweight chat powered by Claude Haiku. Has access to user's current application state + relevant knowledge base entries. Rate-limited.

**Acceptance criteria:**
- 100% of form fields have tooltips in all 3 languages
- FAQ panels cover 90%+ of forum questions for Indian applicants to France
- Chat responds in < 2 seconds with contextually accurate answers 90%+
- Help system doesn't obscure form or disrupt flow

### F9: Applicant Profile & Repeat Applications (P1 — Post-MVP)

Persistent profile storing personal data, document scans, application history. Pre-populates intake for repeat applicants, highlights changes since last application.

### F10: Complex Case Triage & Referral (P1 — Post-MVP)

Identifies applications exceeding platform capability (prior refusals, dual-intent, insufficient finances). Triages to partner immigration consultants with packaged intake data.

### F11: Internal Knowledge Dashboard (P2 — Future)

Internal tool for operations team to maintain consulate requirements, track refusal patterns, identify emerging issues.

---

## 11. Design & Style

Minimalist black and white. This is a high-stakes legal tool — the design should feel clean, trustworthy, and invisible.

**Color palette:** Black, white, and Tailwind grays (`gray-50` through `gray-900`). No brand colors, gradients, or colored backgrounds. The only non-grayscale colors are confidence indicators in form review: green for high confidence (MRZ-sourced), yellow for medium (OCR), red for low (inferred/manual needed) — used sparingly on field borders and badges only.

**Typography:** System font stack. One weight for body, one for emphasis. No decorative fonts.

**Components:** Generous whitespace between sections. 1px gray borders on cards and inputs, no shadows. Primary buttons are black with white text, secondary buttons are white with black border. Icons from lucide-react, thin stroke, gray default.

**No decoration:** No hero images, illustrations, background patterns, or animated gradients. Content only.

**Help system styling:** Tooltips are plain text popovers with gray background. FAQ drawer slides from right (desktop) or bottom (mobile), white background. Chat widget is a simple black floating button in bottom-right.

---

## 12. Performance Requirements

Target users are on 4G mobile connections in India. The app must feel fast.

**Page load targets:**
- First Contentful Paint: < 1.5s on 4G
- Largest Contentful Paint: < 2.5s on 4G
- Time to Interactive: < 3.0s on 4G
- Total initial page weight: < 200KB compressed

**Frontend rules:**
- Next.js Server Components by default — `'use client'` only when interactivity is required
- Lazy-load heavy components (PDF preview, Cropper.js, chat widget) via `next/dynamic`
- Images via `next/image` with WebP and appropriate `sizes`
- No client-side analytics or tracking at MVP
- No route JS bundle > 100KB compressed
- Prefetch next wizard step for instant transitions

**API rules:**
- Non-LLM routes respond in < 500ms
- LLM calls stream responses using Anthropic streaming API
- Document upload returns `202 Accepted` immediately, OCR runs async
- Database queries use indexes on `applicantId`, `sessionId`, `consulateId`; always use Prisma `select`
- Knowledge base JSON loaded once at server start, cached in memory

**Chat assistant:**
- Claude Haiku for speed
- Stream tokens to UI
- First token within 1 second
- Send only current app state + last 5 messages, not full history

---

## 13. Knowledge Base Seed Data — FR_NEW_DELHI

The agent must create this file at `/data/consulates/FR_NEW_DELHI.json` and populate it with the data below. This is the MVP's only consulate entry.

```json
{
  "consulateId": "FR_NEW_DELHI",
  "country": "France",
  "city": "New Delhi",
  "countryCode": "FRA",
  "vfsProvider": "vfs_global",
  "appointmentBookingUrl": "https://visa.vfsglobal.com/ind/en/fra/",
  "requiredDocuments": [
    { "documentType": "passport", "required": true,
      "description": { "en": "Original passport valid for at least 3 months beyond return date, with at least 2 blank pages. Plus photocopy of all pages with stamps/visas.", "zh-CN": "原始护照，有效期需超过回程日期3个月以上，至少有2个空白页。加上所有有签证/印章页的复印件。", "hi": "मूल पासपोर्ट जो वापसी की तारीख से कम से कम 3 महीने तक वैध हो, कम से कम 2 खाली पृष्ठ हों। साथ ही सभी स्टाम्प/वीजा वाले पृष्ठों की फोटोकॉपी।" } },
    { "documentType": "photo", "required": true,
      "description": { "en": "2 recent passport-size photos (35x45mm), white background, ICAO compliant.", "zh-CN": "2张近期护照尺寸照片（35x45mm），白色背景，符合ICAO标准。", "hi": "2 हालिया पासपोर्ट साइज फोटो (35x45mm), सफेद पृष्ठभूमि, ICAO अनुपालन।" } },
    { "documentType": "bank_statement", "required": true,
      "description": { "en": "Bank statements for last 3 months, showing regular income and minimum closing balance of INR 50,000 per week of stay. Stamped and signed by bank.", "zh-CN": "最近3个月的银行对账单，显示定期收入和每周停留最低余额5万印度卢比。需银行盖章签字。", "hi": "पिछले 3 महीनों के बैंक स्टेटमेंट, नियमित आय और ठहरने के प्रति सप्ताह न्यूनतम INR 50,000 का क्लोजिंग बैलेंस दिखाते हुए। बैंक द्वारा मुहर और हस्ताक्षरित।" } },
    { "documentType": "employer_letter", "required": true,
      "description": { "en": "Employment letter on company letterhead stating position, salary, employment dates, and approved leave for travel period. Signed by HR or manager.", "zh-CN": "公司信头纸上的雇佣信，说明职位、薪资、雇佣日期和批准的旅行假期。由人力资源或经理签字。", "hi": "कंपनी लेटरहेड पर रोजगार पत्र जिसमें पद, वेतन, रोजगार तिथियां और यात्रा अवधि के लिए स्वीकृत छुट्टी का उल्लेख हो। HR या मैनेजर द्वारा हस्ताक्षरित।" } },
    { "documentType": "cover_letter", "required": true,
      "description": { "en": "Cover letter explaining purpose of travel, itinerary, ties to India, and intent to return.", "zh-CN": "说明旅行目的、行程安排、与印度的联系以及回国意愿的求职信。", "hi": "यात्रा का उद्देश्य, यात्रा कार्यक्रम, भारत से संबंध और वापस लौटने की मंशा का वर्णन करने वाला कवर लेटर।" } },
    { "documentType": "travel_insurance", "required": true,
      "description": { "en": "Travel medical insurance covering minimum €30,000, valid in all Schengen states, covering full travel dates including emergency medical, hospitalization, and repatriation.", "zh-CN": "旅行医疗保险，覆盖最低3万欧元，在所有申根国有效，覆盖完整旅行日期，包括紧急医疗、住院和遣返。", "hi": "यात्रा चिकित्सा बीमा जो न्यूनतम €30,000 कवर करे, सभी शेंगेन राज्यों में वैध, पूर्ण यात्रा तिथियों को कवर करने वाला जिसमें आपातकालीन चिकित्सा, अस्पताल में भर्ती और प्रत्यावर्तन शामिल हो।" } },
    { "documentType": "flight_reservation", "required": true,
      "description": { "en": "Round-trip flight reservation (confirmed or tentative). Dates must match application form exactly.", "zh-CN": "往返机票预订（确认或暂定）。日期必须与申请表完全匹配。", "hi": "राउंड-ट्रिप फ्लाइट आरक्षण (पुष्ट या अस्थायी)। तिथियां आवेदन पत्र से बिल्कुल मेल खानी चाहिए।" } },
    { "documentType": "hotel_reservation", "required": true,
      "description": { "en": "Hotel booking or proof of accommodation for entire stay. Dates must match application form.", "zh-CN": "整个停留期间的酒店预订或住宿证明。日期必须与申请表匹配。", "hi": "पूरे ठहराव के लिए होटल बुकिंग या आवास का प्रमाण। तिथियां आवेदन पत्र से मेल खानी चाहिए।" } }
  ],
  "financialThresholdMin": { "amount": 50000, "currency": "INR" },
  "bankStatementMonths": 3,
  "photoSpec": { "width": 35, "height": 45, "background": "white", "standard": "ICAO" },
  "processingTimeDays": { "min": 15, "max": 30 },
  "knownPractices": [
    "French consulate in New Delhi is strict about date consistency between form, flight bookings, and insurance.",
    "Cover letters that explicitly address return intent perform better for first-time travelers.",
    "Bank statements from SBI, HDFC, and ICICI are processed fastest; smaller regional banks may cause delays.",
    "Salary credit pattern is closely examined — irregular deposits raise flags.",
    "Due to high volume, apply at least 8 weeks before travel during April–July peak season.",
    "VFS centres available across India (14 cities); all forward to New Delhi consulate for decision."
  ],
  "lastVerifiedDate": "2026-03-15",
  "refusalRateEstimate": 0.16,
  "formFieldOverrides": {},
  "tooltips": {},
  "faqs": []
}
```

---

## 14. Environment Variables

Create `.env.example` with these keys:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/visaagent

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google Cloud Vision (OCR)
GOOGLE_CLOUD_VISION_API_KEY=...

# Cloudflare R2 (file storage)
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=visaagent-documents
R2_ENDPOINT=https://....r2.cloudflarestorage.com

# Clerk (auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Stripe (post-MVP)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_APP_URL=https://flufex.com
NODE_ENV=development
```

---

## 15. Test Fixtures

The agent must create synthetic test data. Do NOT use real personal data.

**Synthetic Indian passport MRZ:**
```
P<INDKUMAR<<RAHUL<<<<<<<<<<<<<<<<<<<<<<<<<<<
N1234567<8IND9001015M3012315<<<<<<<<<<<<<<04
```
Format: ICAO 9303, Type P, issuing state IND. The agent should generate 5+ variants covering: male/female, different name lengths, different expiry dates, married name changes.

**Mock bank statement extraction output (SBI):**
```json
{
  "accountHolder": "RAHUL KUMAR",
  "accountNumber": "XXXXXXXX1234",
  "bankName": "State Bank of India",
  "statementPeriod": { "from": "2026-01-01", "to": "2026-03-31" },
  "closingBalance": { "amount": 485000, "currency": "INR" },
  "averageMonthlyBalance": { "amount": 420000, "currency": "INR" },
  "salaryDeposits": [
    { "date": "2026-01-28", "amount": 95000, "description": "SALARY JAN 2026" },
    { "date": "2026-02-28", "amount": 95000, "description": "SALARY FEB 2026" },
    { "date": "2026-03-28", "amount": 95000, "description": "SALARY MAR 2026" }
  ]
}
```
Generate variants for HDFC and ICICI, with different balance levels (some below threshold to test warnings).

**Complete test applicant profiles:** Create 3 profiles: (1) strong applicant (employed professional, good finances, prior Schengen travel), (2) first-time traveler (young professional, adequate finances, no travel history), (3) risky applicant (irregular income, low balance, no property — should trigger warnings).

---

## 16. Error Handling & Edge Cases

These rules apply across all layers. Implement defensively.

| Scenario | Behavior |
|---|---|
| OCR extraction confidence < 0.7 | Show manual entry form with extracted values as editable suggestions. Yellow highlight. |
| LLM returns malformed JSON | Retry once with stricter prompt. If still fails, fall back to manual entry for affected fields. Log error. |
| Bank statement in unsupported language | Show warning: "We couldn't automatically extract data from this document. Please enter the values manually." Pre-fill any fields that did extract. |
| Passport photo too blurry for MRZ | Prompt user to retake with guidance overlay. Allow manual passport data entry as fallback. |
| User uploads wrong document type | Detect via LLM classification. Show: "This looks like [X], but we expected [Y]. Did you mean to upload this as [X]?" |
| Form field conflict (intake vs. extraction) | Show both values side-by-side with source labels. User picks. |
| Network failure during upload | Retry with exponential backoff (3 attempts). Show progress indicator. Resume from last successful chunk. |
| Session timeout | Save all form state to database every 30 seconds. Restore on re-login. |
| Consulate data older than 90 days | Show banner: "Requirements were last verified on [date]. Please check [consulate URL] for any recent changes." |

---

## 17. Agent Instructions

The `CLAUDE.md` file in the repo root contains all agent instructions: tech stack, commands, code conventions, file organization, i18n rules, testing requirements, and prohibited patterns. Claude Code reads it automatically when entering the repo.

`CLAUDE.md` references this PRD for detailed specs (data models, API routes, knowledge base seed data, test fixtures, form mappings). The two files work together — `CLAUDE.md` is the quick-reference, this PRD is the deep reference.

---

## 18. Human vs. AI Task Allocation

| Task | AI Role | Human Role | Confidence |
|---|---|---|---|
| Determine correct consulate | Fully automated from itinerary rules | User confirms destination plan | High |
| Generate document checklist | Fully automated from knowledge base | Domain experts maintain KB | High |
| Fill application form | Auto-fill from intake + extraction | User reviews every field before PDF generation | High |
| Draft cover letter | AI generates tailored draft | User reviews, edits, approves | High |
| Draft employer letter template | AI generates with correct format | User's employer signs and stamps | Medium |
| Extract passport data | MRZ parsing + OCR | User confirms if confidence low | High |
| Extract bank statement data | OCR + LLM for major banks (SBI, HDFC, ICICI) | User verifies figures; manual entry for unsupported banks | Medium |
| Assess application risk | Flag common refusal triggers | Immigration consultant reviews high-risk cases via referral | Medium |
| Book VFS appointment | NOT IN SCOPE | User books manually | N/A |
| Provide biometrics | NOT IN SCOPE | User attends in person | N/A |
| Strategic case planning | NOT IN SCOPE | Referred to partner consultants | N/A |

---

## 19. Data Security & Privacy

Visa applications contain highly sensitive PII. The platform must comply with GDPR and India's DPDP Act.

- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- LLM API calls use zero-data-retention agreements (Anthropic supports this)
- Document uploads auto-deleted 90 days after application completion unless user opts in to profile storage
- No passport images or financial data used for model training
- Clerk handles auth tokens and session management — no custom auth
- Database connection via SSL

---

## 20. Business Model

| Tier | Price | Includes |
|---|---|---|
| Free | $0 | Consulate determination, basic checklist, general guidance chat |
| Standard | $29–49 / application | Full intake, extraction, form auto-fill, cover letter, quality check, final PDF |
| Premium | $79–99 / application | Standard + expert review, strategic cover letter, post-submission guidance |
| Annual | $99–149 / year | Unlimited Standard applications, persistent profile, one-click repeat |

Payment via Stripe. Implement post-MVP.

---

## 21. Milestones

**MVP (Month 1–4):** Single consulate (FR_NEW_DELHI). Tourist visa only. Features F1–F8. Web app (mobile-first). Full i18n. Contextual help.

**V1.1 (Month 5–6):** Add 5 more Schengen countries. Business visa type. Applicant profile (F9). Quality improvements from user feedback.

**V1.2 (Month 7–9):** Complex case triage (F10). Payment integration (Stripe). Partner consultant onboarding.

**V2.0 (Month 10–12):** Internal dashboard (F11). Multi-visa-type support (UK, US, Canada). API for travel agencies.

---

## 22. Success Metrics

| Metric | MVP Target | V1 Target |
|---|---|---|
| Time from start to complete package | < 2 hours | < 1 hour |
| Application completeness (no missing docs at VFS) | > 95% | > 98% |
| Form auto-fill accuracy (before user review) | > 90% | > 95% |
| Mobile completion rate | > 60% | > 75% |
| AI chat accuracy | > 85% | > 92% |
| Cost per application (LLM + infra) | < $3.00 | < $2.00 |
| NPS | > 40 | > 60 |
| Monthly active applications | 500 | 5,000 |

---

## 23. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| LLM generates incorrect form data → visa refusal | Critical | Mandatory human review of all fields. No auto-submission. Clear disclaimers. |
| Knowledge base becomes stale | High | Quarterly review. 90-day staleness alerts. User feedback loop. |
| Unauthorized practice of law claims | High | Platform provides info and doc preparation, not legal advice. Clear TOS. Refer complex cases out. |
| Data breach exposing PII | Critical | Encryption, ZDR LLM APIs, auto-deletion, annual pen testing. |
| VFS changes form/process | Medium | Modular form engine with per-consulate templates. Monitor VFS portals. 48-hour update SLA. |
