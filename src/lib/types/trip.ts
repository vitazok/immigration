import type { Address } from './applicant';

export interface TripDetails {
  id: string;
  applicantId: string;

  mainDestination: string; // ISO 3166-1 alpha-3
  otherDestinations: string[];
  firstEntryCountry: string; // ISO 3166-1 alpha-3

  purpose: 'tourism' | 'business' | 'visiting_family' | 'cultural' | 'sports' | 'official' | 'medical' | 'study' | 'transit' | 'other';
  purposeDescription: string | null;

  arrivalDate: string; // YYYY-MM-DD
  departureDate: string; // YYYY-MM-DD
  durationDays: number;

  entriesRequested: 'single' | 'double' | 'multiple';

  // Accommodation
  accommodationType: 'hotel' | 'private' | 'other';
  accommodationName: string;
  accommodationAddress: Address;
  accommodationPhone: string | null;
  accommodationEmail: string | null;

  // Inviting
  invitingPerson: InvitingPerson | null;
  invitingOrganization: InvitingOrganization | null;

  // Financial means
  costCoveredBy: 'self' | 'sponsor';
  meansOfSupport: ('cash' | 'credit_card' | 'travelers_cheques' | 'prepaid_accommodation' | 'prepaid_transport' | 'other')[];

  targetConsulateId: string;
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
