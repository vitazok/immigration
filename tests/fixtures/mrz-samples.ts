// Synthetic Indian passport MRZ samples for testing.
// DO NOT use real passport data. All values are fictional.

export interface MRZSample {
  name: string;
  line1: string;
  line2: string;
  expected: {
    surname: string;
    givenNames: string[];
    documentNumber: string;
    nationality: string;
    dateOfBirth: string;
    sex: 'male' | 'female' | 'unknown';
    expiryDate: string;
  };
}

export const MRZ_SAMPLES: MRZSample[] = [
  {
    name: 'Male applicant, simple name',
    line1: 'P<INDKUMAR<<RAHUL<<<<<<<<<<<<<<<<<<<<<<<<<<<',
    line2: 'N1234567<7IND9001011M3012316<<<<<<<<<<<<<<04',
    expected: {
      surname: 'KUMAR',
      givenNames: ['RAHUL'],
      documentNumber: 'N1234567',
      nationality: 'IND',
      dateOfBirth: '1990-01-01',
      sex: 'male',
      expiryDate: '2030-12-31',
    },
  },
  {
    name: 'Female applicant, compound name',
    line1: 'P<INDSINGH<<PRIYA<KUMARI<<<<<<<<<<<<<<<<<<<<',
    line2: 'B9876543<1IND9506158F3303090<<<<<<<<<<<<<<02',
    expected: {
      surname: 'SINGH',
      givenNames: ['PRIYA', 'KUMARI'],
      documentNumber: 'B9876543',
      nationality: 'IND',
      dateOfBirth: '1995-06-15',
      sex: 'female',
      expiryDate: '2033-03-09',
    },
  },
  {
    name: 'Male applicant, long surname',
    line1: 'P<INDVENKATARAMAN<<SURESH<KRISHNAMURTHY<<<<<',
    line2: 'Z5555555<0IND8503264M3205312<<<<<<<<<<<<<<02',
    expected: {
      surname: 'VENKATARAMAN',
      givenNames: ['SURESH', 'KRISHNAMURTHY'],
      documentNumber: 'Z5555555',
      nationality: 'IND',
      dateOfBirth: '1985-03-26',
      sex: 'male',
      expiryDate: '2032-05-31',
    },
  },
  {
    name: 'Female applicant, recently expired passport (for expiry validation test)',
    line1: 'P<INDSHARMA<<ANITA<<<<<<<<<<<<<<<<<<<<<<<<<<',
    line2: 'A1111111<5IND0012016F2212315<<<<<<<<<<<<<<08',
    expected: {
      surname: 'SHARMA',
      givenNames: ['ANITA'],
      documentNumber: 'A1111111',
      nationality: 'IND',
      dateOfBirth: '2000-12-01',
      sex: 'female',
      expiryDate: '2022-12-31',
    },
  },
  {
    name: 'Male applicant, first Schengen application',
    line1: 'P<INDPATEL<<VIKRAM<RAMBHAI<<<<<<<<<<<<<<<<<<',
    line2: 'C7777777<9IND9208142M3208313<<<<<<<<<<<<<<02',
    expected: {
      surname: 'PATEL',
      givenNames: ['VIKRAM', 'RAMBHAI'],
      documentNumber: 'C7777777',
      nationality: 'IND',
      dateOfBirth: '1992-08-14',
      sex: 'male',
      expiryDate: '2032-08-31',
    },
  },
];
