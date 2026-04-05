export interface ApplicantProfile {
  id: string;
  // Personal info (from intake + passport extraction)
  surname: string;
  surnameAtBirth: string | null;
  givenNames: string;
  dateOfBirth: string; // YYYY-MM-DD
  placeOfBirth: string;
  countryOfBirth: string; // ISO 3166-1 alpha-3
  currentNationality: string; // ISO 3166-1 alpha-3
  nationalityAtBirth: string | null;
  sex: 'male' | 'female';
  maritalStatus: 'single' | 'married' | 'separated' | 'divorced' | 'widowed' | 'other';

  // Contact
  homeAddress: Address;
  email: string;
  phone: string;

  // Passport (from extraction)
  passportNumber: string;
  passportIssueDate: string; // YYYY-MM-DD
  passportExpiryDate: string; // YYYY-MM-DD
  passportIssuingAuthority: string;
  passportIssuingCountry: string; // ISO 3166-1 alpha-3
  mrzLine1: string;
  mrzLine2: string;

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
  fingerprintsDate: string | null; // YYYY-MM-DD

  // Ties to home country (for risk assessment)
  propertyOwnership: boolean;
  familyDependents: string | null;
  returnIntent: string | null;

  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string | null;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-3
}

export interface MoneyAmount {
  amount: number;
  currency: string; // ISO 4217 (INR, EUR)
}

export interface PreviousVisa {
  validFrom: string; // YYYY-MM-DD
  validTo: string;
  stickerNumber: string | null;
}
