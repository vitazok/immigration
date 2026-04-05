import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';
import type { ConsulateRequirement } from '@/lib/types/consulate';

export function buildCoverLetterPrompt(
  applicant: ApplicantProfile,
  trip: TripDetails,
  consulate: ConsulateRequirement,
  riskFlags: string[],
  locale: string
): string {
  const stayDays = trip.durationDays;
  const arrivalFormatted = trip.arrivalDate;
  const departureFormatted = trip.departureDate;

  const hasWeakTies =
    riskFlags.includes('NO_TIES_TO_INDIA') ||
    riskFlags.includes('NO_PROPERTY') ||
    riskFlags.includes('FIRST_TIME_TRAVELER');

  const hasFinancialRisk = riskFlags.includes('INSUFFICIENT_FUNDS') || riskFlags.includes('IRREGULAR_INCOME');

  return `You are an expert immigration document writer. Draft a Schengen visa cover letter for the applicant below.

APPLICANT DETAILS:
Name: ${applicant.givenNames} ${applicant.surname}
Nationality: Indian
Occupation: ${applicant.occupation}
Employer: ${applicant.employerName ?? 'N/A'}
Job Title: ${applicant.jobTitle ?? 'N/A'}
Monthly Salary: ${applicant.monthlySalary ? `${applicant.monthlySalary.currency} ${applicant.monthlySalary.amount.toLocaleString()}` : 'N/A'}
Bank Balance: ${applicant.accountBalance ? `${applicant.accountBalance.currency} ${applicant.accountBalance.amount.toLocaleString()}` : 'N/A'}
Property Owner: ${applicant.propertyOwnership ? 'Yes' : 'No'}
Family Dependents: ${applicant.familyDependents ?? 'None stated'}
Previous Schengen Visas: ${applicant.previousSchengenVisas.length > 0 ? applicant.previousSchengenVisas.length + ' visa(s)' : 'None'}

TRIP DETAILS:
Destination: ${trip.mainDestination}
Arrival: ${arrivalFormatted}
Departure: ${departureFormatted}
Duration: ${stayDays} days
Purpose: ${trip.purpose}
Accommodation: ${trip.accommodationName}, ${JSON.stringify(trip.accommodationAddress)}

CONSULATE: ${consulate.country} Embassy, ${consulate.city}
RISK FLAGS: ${riskFlags.join(', ') || 'None'}

INSTRUCTIONS:
1. Write in English (the submission language). ${locale === 'hi' ? 'After the English letter, add a Hindi reference translation preceded by "--- Hindi Reference Translation ---".' : ''}
2. Tone: Professional, factual, confident. Not pleading or overly emotional.
3. Structure:
   - Opening: State purpose and dates clearly
   - Body paragraph 1: Trip itinerary and purpose details
   - Body paragraph 2: Financial capacity (reference bank balance and salary)
   - Body paragraph 3: Strong ties to India (employment, family, property — emphasize what is strong)
   - Closing: Affirm intent to return before visa expiry
4. Length: 350–450 words for the English letter.
5. ${hasWeakTies ? 'IMPORTANT: Applicant has limited ties to India. Emphasize employment stability and career obligations. Be specific and factual — do not invent details.' : 'Emphasize existing strong ties naturally.'}
6. ${hasFinancialRisk ? 'IMPORTANT: Financial profile is borderline. Be precise about actual amounts. Do not exaggerate.' : 'Mention financial capacity confidently.'}
7. Address it to: "The Consul General, Embassy of France, New Delhi"
8. Sign off with: "[Applicant Name]" and "[Date]"

Return ONLY the letter text, no preamble.`;
}
