import { format } from 'date-fns';
import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';
import type { FormFieldMapping } from '@/lib/types/form-mapping';

// ISO 3166-1 alpha-3 to country name mapping (subset for common visa countries)
const COUNTRY_NAMES: Record<string, string> = {
  IND: 'India',
  FRA: 'France',
  DEU: 'Germany',
  ITA: 'Italy',
  ESP: 'Spain',
  NLD: 'Netherlands',
  BEL: 'Belgium',
  CHE: 'Switzerland',
  AUT: 'Austria',
  PRT: 'Portugal',
  GRC: 'Greece',
  CZE: 'Czech Republic',
  POL: 'Poland',
  HUN: 'Hungary',
  GBR: 'United Kingdom',
  USA: 'United States',
  ARE: 'United Arab Emirates',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

// Maps applicant + trip data to PDF AcroForm field values.
// Returns a record keyed by AcroForm field ID → value to fill.
export function mapApplicationToFormFields(
  applicant: ApplicantProfile,
  trip: TripDetails
): Record<string, string | boolean> {
  const fields: Record<string, string | boolean> = {};

  // Field 1 — Surname
  fields['applicantSurname'] = applicant.surname.toUpperCase();

  // Field 2 — Surname at birth
  fields['applicantSurnameAtBirth'] = applicant.surnameAtBirth
    ? applicant.surnameAtBirth.toUpperCase()
    : 'N/A';

  // Field 3 — First name(s)
  fields['applicantFirstname'] = applicant.givenNames.toUpperCase();

  // Field 4 — Date of birth
  fields['applicantDateOfBirth'] = formatDate(applicant.dateOfBirth);

  // Field 5 — Place of birth
  fields['applicantPlaceOfBirth'] = applicant.placeOfBirth;

  // Field 6 — Country of birth
  fields['applicantCountryOfBirth'] = countryName(applicant.countryOfBirth);

  // Field 7 — Current nationality
  fields['applicantNationality'] = countryName(applicant.currentNationality);

  // Nationality at birth (if different)
  if (applicant.nationalityAtBirth && applicant.nationalityAtBirth !== applicant.currentNationality) {
    fields['applicantNationalityAtBirth'] = countryName(applicant.nationalityAtBirth);
  }

  // Field 8 — Sex (radio buttons)
  fields['applicantGenderM'] = applicant.sex === 'male';
  fields['applicantGenderF'] = applicant.sex === 'female';

  // Field 9 — Marital status
  const maritalMap: Record<string, string> = {
    single: 'applicantMaritalCEL',
    married: 'applicantMaritalMAR',
    separated: 'applicantMaritalSEP',
    divorced: 'applicantMaritalDIV',
    widowed: 'applicantMaritalVEU',
    other: 'applicantMaritalAUT',
  };
  const maritalFieldId = maritalMap[applicant.maritalStatus];
  if (maritalFieldId) {
    fields[maritalFieldId] = true;
  }

  // Field 11 — National identity number (N/A for Indian applicants)
  fields['applicantIdCardNumber'] = 'N/A';

  // Field 12 — Type of travel document (Ordinary passport by default)
  fields['travelDocTypePSP'] = true;

  // Field 13 — Passport number
  fields['travelDocNumber'] = applicant.passportNumber;

  // Field 14 — Date of issue
  fields['travelDocDateOfIssue'] = formatDate(applicant.passportIssueDate);

  // Field 15 — Valid until
  fields['travelDocValidUntil'] = formatDate(applicant.passportExpiryDate);

  // Field 16 — Issued by
  fields['travelDocCountries'] = applicant.passportIssuingAuthority;

  // Field 19 — Home address, email, phone
  const addr = applicant.homeAddress;
  fields['applicantAddressL1'] = addr.street;
  fields['applicantAddressL2'] = addr.city;
  fields['applicantAddressL3'] = [addr.state, addr.postalCode].filter(Boolean).join(' ');
  fields['applicantAddressL4'] = countryName(addr.country);
  fields['applicantPhone'] = applicant.phone;

  // Field 20 — Employer and address
  if (applicant.employerName) {
    fields['applicantOccupation'] = applicant.jobTitle ?? applicant.occupation;
    fields['applicantOccupationAddressL1'] = applicant.employerName;
    if (applicant.employerAddress) {
      fields['applicantOccupationAddressL2'] = `${applicant.employerAddress.street}, ${applicant.employerAddress.city}`;
      fields['applicantOccupationAddressL3'] = countryName(applicant.employerAddress.country);
    }
  } else {
    fields['applicantOccupation'] = applicant.occupation;
  }

  // Field 21 — Purpose of journey
  const purposeMap: Record<string, string> = {
    tourism: 'purposeTOUR',
    visiting_family: 'purposeVISF',
    business: 'purposeATRA',
    official: 'purposeVOFF',
    sports: 'purposeSPOR',
    cultural: 'purposeCULT',
    study: 'purposeETUD',
    medical: 'purposeMEDI',
    transit: 'purposeTRAV',
    other: 'purposeAUTR',
  };
  const purposeFieldId = purposeMap[trip.purpose];
  if (purposeFieldId) {
    fields[purposeFieldId] = true;
  }
  if (trip.purposeDescription) {
    fields['purposeOfJourneyInfo'] = trip.purposeDescription;
  }

  // Field 22 — Destination country
  fields['applicantDestinations'] = countryName(trip.mainDestination);

  // Field 23 — Country of first entry
  fields['applicantDestinationFirstEntry'] = countryName(trip.firstEntryCountry);

  // Field 24 — Number of entries
  fields['entries1'] = trip.entriesRequested === 'single';
  fields['entries2'] = trip.entriesRequested === 'double';
  fields['entriesM'] = trip.entriesRequested === 'multiple';

  // Field 26 — Previous Schengen visas
  if (applicant.previousSchengenVisas.length > 0) {
    const visaList = applicant.previousSchengenVisas
      .map((v) => `${formatDate(v.validFrom)} – ${formatDate(v.validTo)}${v.stickerNumber ? ` (${v.stickerNumber})` : ''}`)
      .join('; ');
    fields['formerBiometricVisa'] = visaList;
  } else {
    fields['formerBiometricVisa'] = 'No';
  }

  // Field 27 — Fingerprints
  fields['hasFingerprintsTrue'] = applicant.fingerprintsPreviouslyCollected;
  fields['hasFingerprintsFalse'] = !applicant.fingerprintsPreviouslyCollected;
  if (applicant.fingerprintsDate) {
    fields['fingerprintsDate'] = formatDate(applicant.fingerprintsDate);
  }

  // Field 29 — Intended date of arrival
  fields['dateOfArrival'] = formatDate(trip.arrivalDate);

  // Field 30 — Intended date of departure
  fields['dateOfDeparture'] = formatDate(trip.departureDate);

  // Field 31 — Host name and address (hotel or person)
  if (trip.invitingPerson) {
    fields['host1Names'] = `${trip.invitingPerson.surname} ${trip.invitingPerson.givenNames}`;
    fields['host1AddressL1'] = trip.invitingPerson.address.street;
    fields['host1AddressL2'] = `${trip.invitingPerson.address.city}, ${trip.invitingPerson.address.postalCode ?? ''}`;
    fields['host1AddressL3'] = countryName(trip.invitingPerson.address.country);
    fields['host1Phone'] = trip.invitingPerson.phone;
  } else {
    fields['host1Names'] = trip.accommodationName;
    const acc = trip.accommodationAddress;
    fields['host1AddressL1'] = acc.street;
    fields['host1AddressL2'] = `${acc.city}, ${acc.postalCode ?? ''}`;
    fields['host1AddressL3'] = countryName(acc.country);
    if (trip.accommodationPhone) {
      fields['host1Phone'] = trip.accommodationPhone;
    }
  }

  // Field 32 — Inviting organization
  if (trip.invitingOrganization) {
    const org = trip.invitingOrganization;
    fields['hostOrganizationAddressL1'] = org.name;
    fields['hostOrganizationAddressL2'] = org.address.street;
    fields['hostOrganizationAddressL3'] = `${org.address.city}, ${org.address.postalCode ?? ''}`;
    fields['hostOrganizationAddressL4'] = countryName(org.address.country);
    fields['hostOrganizationPhone'] = org.phone;
  }

  // Field 33 — Means of support
  if (trip.costCoveredBy === 'self') {
    fields['sponsorTypeM'] = true;
    const meansMap: Record<string, string> = {
      cash: 'fundingTypeM_ARG',
      credit_card: 'fundingTypeM_CCR',
      travelers_cheques: 'fundingTypeM_CHQ',
      prepaid_accommodation: 'fundingTypeM_HPP',
      prepaid_transport: 'fundingTypeM_TPP',
    };
    for (const means of trip.meansOfSupport) {
      const fieldId = meansMap[means];
      if (fieldId) fields[fieldId] = true;
    }
  } else {
    fields['sponsorTypeHAS'] = true;
  }

  // Field 36 — Place and date (computed)
  fields['townAndDateTime'] = `New Delhi, ${format(new Date(), 'dd/MM/yyyy')}`;

  return fields;
}

// Returns the field mapping definitions for the review UI
export function getFieldMappings(): FormFieldMapping[] {
  return FIELD_MAPPINGS;
}

const FIELD_MAPPINGS: FormFieldMapping[] = [
  { fieldNumber: 1, fieldLabel: 'Surname (family name)', acroFormFieldId: 'applicantSurname', fieldType: 'text', dataSource: { type: 'applicant', path: 'surname' }, transformRule: 'UPPERCASE', confidenceLevel: 'high', tooltipKey: 'applicantSurname' },
  { fieldNumber: 2, fieldLabel: 'Surname at birth', acroFormFieldId: 'applicantSurnameAtBirth', fieldType: 'text', dataSource: { type: 'applicant', path: 'surnameAtBirth' }, transformRule: 'UPPERCASE', confidenceLevel: 'medium', tooltipKey: 'applicantSurnameAtBirth' },
  { fieldNumber: 3, fieldLabel: 'First name(s)', acroFormFieldId: 'applicantFirstname', fieldType: 'text', dataSource: { type: 'applicant', path: 'givenNames' }, transformRule: 'UPPERCASE', confidenceLevel: 'high', tooltipKey: 'applicantFirstname' },
  { fieldNumber: 4, fieldLabel: 'Date of birth', acroFormFieldId: 'applicantDateOfBirth', fieldType: 'date', dataSource: { type: 'applicant', path: 'dateOfBirth' }, transformRule: 'DD/MM/YYYY', confidenceLevel: 'high', tooltipKey: 'applicantDateOfBirth' },
  { fieldNumber: 5, fieldLabel: 'Place of birth', acroFormFieldId: 'applicantPlaceOfBirth', fieldType: 'text', dataSource: { type: 'applicant', path: 'placeOfBirth' }, transformRule: null, confidenceLevel: 'medium', tooltipKey: 'applicantPlaceOfBirth' },
  { fieldNumber: 6, fieldLabel: 'Country of birth', acroFormFieldId: 'applicantCountryOfBirth', fieldType: 'text', dataSource: { type: 'applicant', path: 'countryOfBirth' }, transformRule: 'COUNTRY_NAME', confidenceLevel: 'high', tooltipKey: 'applicantCountryOfBirth' },
  { fieldNumber: 7, fieldLabel: 'Current nationality', acroFormFieldId: 'applicantNationality', fieldType: 'text', dataSource: { type: 'applicant', path: 'currentNationality' }, transformRule: 'COUNTRY_NAME', confidenceLevel: 'high', tooltipKey: 'applicantNationality' },
  { fieldNumber: 8, fieldLabel: 'Sex', acroFormFieldId: 'applicantGenderM', fieldType: 'radio', dataSource: { type: 'applicant', path: 'sex' }, transformRule: null, confidenceLevel: 'high', tooltipKey: 'applicantGender' },
  { fieldNumber: 9, fieldLabel: 'Marital status', acroFormFieldId: 'applicantMaritalCEL', fieldType: 'radio', dataSource: { type: 'applicant', path: 'maritalStatus' }, transformRule: null, confidenceLevel: 'medium', tooltipKey: 'applicantMarital' },
  { fieldNumber: 11, fieldLabel: 'National identity number', acroFormFieldId: 'applicantIdCardNumber', fieldType: 'text', dataSource: { type: 'computed', rule: 'naForIndian' }, transformRule: null, confidenceLevel: 'high', tooltipKey: 'applicantIdCardNumber' },
  { fieldNumber: 12, fieldLabel: 'Type of travel document', acroFormFieldId: 'travelDocTypePSP', fieldType: 'radio', dataSource: { type: 'computed', rule: 'ordinaryPassport' }, transformRule: null, confidenceLevel: 'high', tooltipKey: 'travelDocType' },
  { fieldNumber: 13, fieldLabel: 'Passport number', acroFormFieldId: 'travelDocNumber', fieldType: 'text', dataSource: { type: 'applicant', path: 'passportNumber' }, transformRule: null, confidenceLevel: 'high', tooltipKey: 'travelDocNumber' },
  { fieldNumber: 14, fieldLabel: 'Date of issue', acroFormFieldId: 'travelDocDateOfIssue', fieldType: 'date', dataSource: { type: 'applicant', path: 'passportIssueDate' }, transformRule: 'DD/MM/YYYY', confidenceLevel: 'medium', tooltipKey: 'travelDocDateOfIssue' },
  { fieldNumber: 15, fieldLabel: 'Valid until', acroFormFieldId: 'travelDocValidUntil', fieldType: 'date', dataSource: { type: 'applicant', path: 'passportExpiryDate' }, transformRule: 'DD/MM/YYYY', confidenceLevel: 'high', tooltipKey: 'travelDocValidUntil' },
  { fieldNumber: 16, fieldLabel: 'Issued by', acroFormFieldId: 'travelDocCountries', fieldType: 'text', dataSource: { type: 'applicant', path: 'passportIssuingAuthority' }, transformRule: null, confidenceLevel: 'medium', tooltipKey: 'travelDocCountries' },
  { fieldNumber: 19, fieldLabel: 'Home address / email / phone', acroFormFieldId: 'applicantAddressL1', fieldType: 'text', dataSource: { type: 'applicant', path: 'homeAddress' }, transformRule: null, confidenceLevel: 'medium', tooltipKey: 'applicantAddress' },
  { fieldNumber: 20, fieldLabel: 'Employer and employer address', acroFormFieldId: 'applicantOccupation', fieldType: 'text', dataSource: { type: 'applicant', path: 'employerName' }, transformRule: null, confidenceLevel: 'medium', tooltipKey: 'applicantOccupation' },
  { fieldNumber: 21, fieldLabel: 'Main purpose of journey', acroFormFieldId: 'purposeTOUR', fieldType: 'checkbox', dataSource: { type: 'trip', path: 'purpose' }, transformRule: null, confidenceLevel: 'high', tooltipKey: 'purposeTOUR' },
  { fieldNumber: 22, fieldLabel: 'Destination country', acroFormFieldId: 'applicantDestinations', fieldType: 'text', dataSource: { type: 'trip', path: 'mainDestination' }, transformRule: 'COUNTRY_NAME', confidenceLevel: 'high', tooltipKey: 'applicantDestinations' },
  { fieldNumber: 23, fieldLabel: 'Country of first entry', acroFormFieldId: 'applicantDestinationFirstEntry', fieldType: 'text', dataSource: { type: 'trip', path: 'firstEntryCountry' }, transformRule: 'COUNTRY_NAME', confidenceLevel: 'high', tooltipKey: 'applicantDestinationFirstEntry' },
  { fieldNumber: 24, fieldLabel: 'Number of entries requested', acroFormFieldId: 'entries1', fieldType: 'radio', dataSource: { type: 'trip', path: 'entriesRequested' }, transformRule: null, confidenceLevel: 'high', tooltipKey: 'entries' },
  { fieldNumber: 25, fieldLabel: 'Duration of intended stay', acroFormFieldId: 'dateOfArrival', fieldType: 'text', dataSource: { type: 'trip', path: 'durationDays' }, transformRule: null, confidenceLevel: 'high', tooltipKey: 'duration' },
  { fieldNumber: 26, fieldLabel: 'Schengen visas in past 3 years', acroFormFieldId: 'formerBiometricVisa', fieldType: 'text', dataSource: { type: 'applicant', path: 'previousSchengenVisas' }, transformRule: null, confidenceLevel: 'medium', tooltipKey: 'formerBiometricVisa' },
  { fieldNumber: 27, fieldLabel: 'Fingerprints previously collected', acroFormFieldId: 'hasFingerprintsTrue', fieldType: 'radio', dataSource: { type: 'applicant', path: 'fingerprintsPreviouslyCollected' }, transformRule: null, confidenceLevel: 'medium', tooltipKey: 'hasFingerprints' },
  { fieldNumber: 29, fieldLabel: 'Intended date of arrival', acroFormFieldId: 'dateOfArrival', fieldType: 'date', dataSource: { type: 'trip', path: 'arrivalDate' }, transformRule: 'DD/MM/YYYY', confidenceLevel: 'high', tooltipKey: 'dateOfArrival' },
  { fieldNumber: 30, fieldLabel: 'Intended date of departure', acroFormFieldId: 'dateOfDeparture', fieldType: 'date', dataSource: { type: 'trip', path: 'departureDate' }, transformRule: 'DD/MM/YYYY', confidenceLevel: 'high', tooltipKey: 'dateOfDeparture' },
  { fieldNumber: 31, fieldLabel: 'Host name and address', acroFormFieldId: 'host1Names', fieldType: 'text', dataSource: { type: 'trip', path: 'accommodationName' }, transformRule: null, confidenceLevel: 'medium', tooltipKey: 'host1Names' },
  { fieldNumber: 33, fieldLabel: 'Means of support', acroFormFieldId: 'sponsorTypeM', fieldType: 'checkbox', dataSource: { type: 'trip', path: 'costCoveredBy' }, transformRule: null, confidenceLevel: 'high', tooltipKey: 'fundingType' },
  { fieldNumber: 36, fieldLabel: 'Place and date', acroFormFieldId: 'townAndDateTime', fieldType: 'text', dataSource: { type: 'computed', rule: 'currentDate' }, transformRule: 'DD/MM/YYYY', confidenceLevel: 'high', tooltipKey: 'townAndDateTime' },
];
