import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';

export interface IntakeQuestion {
  id: string;
  field: string; // dot-path into ApplicantProfile or TripDetails
  text: string;
  helpText: string;
  inputType: 'text' | 'date' | 'select' | 'multiselect' | 'boolean' | 'number';
  options?: string[];
  required: boolean;
  validationHint?: string;
}

export interface IntakeSessionState {
  answeredFields: Record<string, unknown>;
  currentStep: string;
  progressPercent: number;
}

export function buildIntakeSystemPrompt(locale: string): string {
  return `You are an expert immigration document assistant helping Indian applicants prepare their Schengen (France) tourist visa application.

Your role is to conduct a structured interview to collect all required information for:
1. The 37-field Schengen application form (cerfa 14076*05)
2. A personalized document checklist
3. A risk assessment (low/medium/high)

Rules:
- Ask ONE question at a time. Never ask multiple questions in the same turn.
- Keep questions clear and direct — this is a legal document, not a conversation.
- When the user's answer is ambiguous, ask a brief clarifying follow-up.
- Always respond in ${locale === 'hi' ? 'Hindi' : 'English'}.
- Return your response as JSON matching the IntakeQuestion interface.
- Never make assumptions about missing data — ask instead.
- For Indian applicants, field 11 (national identity number) should default to "N/A".
- For most Indian applicants, fields 17/18 (EU family member) are not applicable.`;
}

export function buildNextQuestionPrompt(
  answeredFields: Record<string, unknown>,
  locale: string
): string {
  const answeredCount = Object.keys(answeredFields).length;
  const answeredJson = JSON.stringify(answeredFields, null, 2);

  return `You are conducting a Schengen visa intake interview.

Already collected (${answeredCount} fields):
${answeredJson}

Based on what is already collected, determine the NEXT most important question to ask.

Follow this collection order:
1. Trip basics: destination, dates, purpose
2. Personal info: name, DOB, nationality, sex, marital status
3. Passport details: number, issue date, expiry, issuing authority
4. Home address and contact details
5. Employment: occupation type, employer name/address, salary
6. Financial: bank name, account balance, average monthly balance
7. Travel history: previous Schengen visas, fingerprints
8. Accommodation: hotel name and address, or host details
9. Financial means for trip: how costs are covered
10. Ties to India: property ownership, family dependents, return intent

If all critical fields are collected, return null for nextQuestion and set isComplete: true.

Respond with JSON:
{
  "nextQuestion": IntakeQuestion | null,
  "isComplete": boolean,
  "progressPercent": number,
  "consulateId": "FR_NEW_DELHI" | null,
  "riskFlags": string[]
}

The IntakeQuestion shape:
{
  "id": "unique_snake_case_id",
  "field": "applicant.surname" | "trip.arrivalDate" | etc,
  "text": "Question text in ${locale === 'hi' ? 'Hindi' : 'English'}",
  "helpText": "Brief explanation of why this is needed",
  "inputType": "text" | "date" | "select" | "multiselect" | "boolean" | "number",
  "options": ["option1", "option2"] | undefined,
  "required": true | false,
  "validationHint": "e.g., DD/MM/YYYY format" | undefined
}`;
}

export function buildRiskAssessmentPrompt(
  applicant: Partial<ApplicantProfile>,
  trip: Partial<TripDetails>
): string {
  return `Assess the Schengen visa application risk for this Indian applicant applying to France.

Applicant profile:
${JSON.stringify(applicant, null, 2)}

Trip details:
${JSON.stringify(trip, null, 2)}

Known French consulate refusal triggers:
- Insufficient bank balance (< INR 50,000 per week of stay)
- Irregular salary deposits
- No property ownership or family ties
- First-time traveler with no Schengen history
- Inconsistent purpose of visit
- Vague accommodation plans
- Passport expiry < 3 months after return date

Respond with JSON:
{
  "level": "low" | "medium" | "high",
  "flags": ["INSUFFICIENT_FUNDS", "NO_TIES_TO_INDIA", ...],
  "summary": "One paragraph in English summarizing the risk profile",
  "coverLetterFocus": ["key point 1 to address in cover letter", ...]
}`;
}
