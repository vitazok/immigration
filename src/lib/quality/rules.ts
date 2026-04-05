import { differenceInDays } from 'date-fns';
import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';
import type { DocumentUpload } from '@/lib/types/documents';
import type { ConsulateRequirement } from '@/lib/types/consulate';
import type { QualityIssue } from '@/lib/types/quality';

// Rule-based checks — fast, deterministic, no LLM needed.
// These run first; LLM-powered semantic checks run after.

export function runRuleBasedChecks(
  applicant: Partial<ApplicantProfile>,
  trip: Partial<TripDetails>,
  documents: DocumentUpload[],
  consulate: ConsulateRequirement
): { blockers: QualityIssue[]; warnings: QualityIssue[]; recommendations: QualityIssue[] } {
  const blockers: QualityIssue[] = [];
  const warnings: QualityIssue[] = [];
  const recommendations: QualityIssue[] = [];

  const docTypes = new Set(documents.map((d) => d.type));

  // ─── Completeness checks ────────────────────────────────────────────────────

  // Missing required documents
  for (const req of consulate.requiredDocuments) {
    if (req.required && !docTypes.has(req.documentType)) {
      blockers.push({
        code: `MISSING_${req.documentType.toUpperCase()}`,
        category: 'completeness',
        severity: 'blocker',
        title: {
          en: `Missing required document: ${req.documentType.replace(/_/g, ' ')}`,
          hi: `आवश्यक दस्तावेज़ गायब है: ${req.documentType.replace(/_/g, ' ')}`,
        },
        description: {
          en: req.description.en,
          hi: req.description.hi,
        },
        affectedFields: [],
        suggestedAction: {
          en: `Upload your ${req.documentType.replace(/_/g, ' ')} in the Documents step.`,
          hi: `दस्तावेज़ चरण में अपना ${req.documentType.replace(/_/g, ' ')} अपलोड करें।`,
        },
      });
    }
  }

  // Missing passport details
  if (!applicant.passportNumber) {
    blockers.push({
      code: 'MISSING_PASSPORT_NUMBER',
      category: 'completeness',
      severity: 'blocker',
      title: { en: 'Passport number missing', hi: 'पासपोर्ट नंबर गायब है' },
      description: { en: 'Passport number is required for field 13 of the application form.', hi: 'आवेदन पत्र के फ़ील्ड 13 के लिए पासपोर्ट नंबर आवश्यक है।' },
      affectedFields: [13],
      suggestedAction: { en: 'Upload your passport scan to extract the passport number automatically.', hi: 'पासपोर्ट नंबर स्वचालित रूप से निकालने के लिए अपना पासपोर्ट स्कैन अपलोड करें।' },
    });
  }

  // Missing travel dates
  if (!trip.arrivalDate || !trip.departureDate) {
    blockers.push({
      code: 'MISSING_TRAVEL_DATES',
      category: 'completeness',
      severity: 'blocker',
      title: { en: 'Travel dates missing', hi: 'यात्रा तिथियां गायब हैं' },
      description: { en: 'Arrival and departure dates are required for fields 29 and 30.', hi: 'फ़ील्ड 29 और 30 के लिए आगमन और प्रस्थान तिथियां आवश्यक हैं।' },
      affectedFields: [29, 30],
      suggestedAction: { en: 'Complete the intake interview to set your travel dates.', hi: 'अपनी यात्रा तिथियां निर्धारित करने के लिए इंटेक साक्षात्कार पूरा करें।' },
    });
  }

  // ─── Financial checks ────────────────────────────────────────────────────────

  const durationDays = trip.durationDays ?? 0;
  const minBalance = Math.ceil(durationDays / 7) * consulate.financialThresholdMin.amount;

  if (applicant.accountBalance) {
    const balance = applicant.accountBalance.amount;
    if (balance < minBalance) {
      blockers.push({
        code: 'INSUFFICIENT_FUNDS',
        category: 'financial',
        severity: 'blocker',
        title: { en: 'Insufficient bank balance', hi: 'अपर्याप्त बैंक बैलेंस' },
        description: {
          en: `Your closing balance (${applicant.accountBalance.currency} ${balance.toLocaleString()}) is below the minimum required (${applicant.accountBalance.currency} ${minBalance.toLocaleString()}) for a ${durationDays}-day stay.`,
          hi: `आपका क्लोजिंग बैलेंस (${applicant.accountBalance.currency} ${balance.toLocaleString()}) ${durationDays}-दिन के ठहराव के लिए आवश्यक न्यूनतम (${applicant.accountBalance.currency} ${minBalance.toLocaleString()}) से कम है।`,
        },
        affectedFields: [33],
        suggestedAction: {
          en: 'You need a minimum of INR 50,000 per week of stay. Consider reducing your stay duration or demonstrating additional funds.',
          hi: 'आपको ठहराव के प्रत्येक सप्ताह के लिए न्यूनतम INR 50,000 चाहिए। अपनी ठहराव अवधि कम करें या अतिरिक्त धन प्रदर्शित करें।',
        },
      });
    } else if (balance < minBalance * 1.5) {
      warnings.push({
        code: 'LOW_FUNDS_WARNING',
        category: 'financial',
        severity: 'warning',
        title: { en: 'Bank balance is close to minimum', hi: 'बैंक बैलेंस न्यूनतम के करीब है' },
        description: {
          en: `Your balance meets the minimum requirement, but it is not significantly above it. The French consulate may request additional evidence of financial stability.`,
          hi: 'आपका बैलेंस न्यूनतम आवश्यकता को पूरा करता है, लेकिन यह उससे काफी अधिक नहीं है।',
        },
        affectedFields: [33],
        suggestedAction: { en: 'Consider adding a second account statement or showing additional assets.', hi: 'दूसरे खाते का स्टेटमेंट जोड़ने या अतिरिक्त संपत्ति दिखाने पर विचार करें।' },
      });
    }
  }

  // ─── Passport validity check ─────────────────────────────────────────────────

  if (applicant.passportExpiryDate && trip.departureDate) {
    const expiryDate = new Date(applicant.passportExpiryDate);
    const departureDate = new Date(trip.departureDate);
    const daysAfterReturn = differenceInDays(expiryDate, departureDate);

    if (daysAfterReturn < 90) {
      blockers.push({
        code: 'PASSPORT_EXPIRY_TOO_SOON',
        category: 'document_quality',
        severity: 'blocker',
        title: { en: 'Passport expires too soon', hi: 'पासपोर्ट बहुत जल्द समाप्त होता है' },
        description: {
          en: `Your passport expires ${daysAfterReturn} days after your return date. It must be valid for at least 90 days after departure.`,
          hi: `आपका पासपोर्ट वापसी तिथि के ${daysAfterReturn} दिन बाद समाप्त होता है। यह प्रस्थान के बाद कम से कम 90 दिनों तक वैध होना चाहिए।`,
        },
        affectedFields: [15],
        suggestedAction: { en: 'Renew your passport before applying for the visa.', hi: 'वीजा के लिए आवेदन करने से पहले अपना पासपोर्ट नवीनीकृत करें।' },
      });
    }
  }

  // ─── Travel date consistency ─────────────────────────────────────────────────

  if (trip.arrivalDate && trip.departureDate) {
    const arrival = new Date(trip.arrivalDate);
    const departure = new Date(trip.departureDate);
    if (departure <= arrival) {
      blockers.push({
        code: 'DEPARTURE_BEFORE_ARRIVAL',
        category: 'travel_logic',
        severity: 'blocker',
        title: { en: 'Departure date is before arrival date', hi: 'प्रस्थान तिथि आगमन तिथि से पहले है' },
        description: { en: 'The departure date must be after the arrival date.', hi: 'प्रस्थान तिथि आगमन तिथि के बाद होनी चाहिए।' },
        affectedFields: [29, 30],
        suggestedAction: { en: 'Correct your travel dates in the intake step.', hi: 'इंटेक चरण में अपनी यात्रा तिथियां सुधारें।' },
      });
    }

    const stayDays = differenceInDays(departure, arrival);
    if (stayDays > 90) {
      blockers.push({
        code: 'STAY_EXCEEDS_90_DAYS',
        category: 'travel_logic',
        severity: 'blocker',
        title: { en: 'Intended stay exceeds 90 days', hi: 'इच्छित ठहराव 90 दिनों से अधिक है' },
        description: { en: `A Type C Schengen visa allows a maximum stay of 90 days in any 180-day period. Your planned stay is ${stayDays} days.`, hi: `टाइप C शेंगेन वीजा किसी भी 180-दिन की अवधि में अधिकतम 90 दिन रहने की अनुमति देता है।` },
        affectedFields: [25, 29, 30],
        suggestedAction: { en: 'Reduce your intended stay to 90 days or less.', hi: 'अपने इच्छित ठहराव को 90 दिन या उससे कम करें।' },
      });
    }
  }

  // ─── Recommendations ──────────────────────────────────────────────────────────

  if (!applicant.previousSchengenVisas?.length) {
    recommendations.push({
      code: 'FIRST_TIME_TRAVELER_COVER_LETTER',
      category: 'completeness',
      severity: 'recommendation',
      title: { en: 'Strengthen your cover letter', hi: 'अपना कवर लेटर मजबूत करें' },
      description: { en: 'As a first-time Schengen applicant, your cover letter should explicitly address your ties to India and your clear intent to return.', hi: 'पहली बार शेंगेन आवेदक के रूप में, आपके कवर लेटर में भारत से आपके संबंध और वापस लौटने की स्पष्ट मंशा का उल्लेख होना चाहिए।' },
      affectedFields: [],
      suggestedAction: { en: 'Use the AI cover letter generator and review the return intent section carefully.', hi: 'AI कवर लेटर जनरेटर का उपयोग करें और वापसी मंशा अनुभाग की सावधानीपूर्वक समीक्षा करें।' },
    });
  }

  return { blockers, warnings, recommendations };
}
