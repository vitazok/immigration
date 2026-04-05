// Determines the correct consulate based on applicant's nationality, destination, and residence.
// Rules sourced from Schengen Visa Code Article 5.

export interface ConsulateRouterInput {
  nationality: string;       // ISO 3166-1 alpha-3
  mainDestination: string;   // ISO 3166-1 alpha-3
  residenceCountry: string;  // ISO 3166-1 alpha-3 (where they currently live)
}

export interface ConsulateRouterResult {
  consulateId: string;
  explanation: string;
}

// MVP routing table — expand as more consulates are added
const ROUTING_TABLE: Record<string, Record<string, string>> = {
  // Format: nationality -> destination -> consulateId
  IND: {
    FRA: 'FR_NEW_DELHI',
  },
};

export function routeToConsulate(input: ConsulateRouterInput): ConsulateRouterResult {
  const { nationality, mainDestination, residenceCountry } = input;

  // Try exact match first
  const byNationality = ROUTING_TABLE[nationality];
  if (byNationality) {
    const consulateId = byNationality[mainDestination];
    if (consulateId) {
      return {
        consulateId,
        explanation: `${nationality} nationals applying for ${mainDestination} visa should use ${consulateId}.`,
      };
    }
  }

  // Fallback: if applicant resides in India, try India-based consulates
  if (residenceCountry === 'IND' && mainDestination === 'FRA') {
    return {
      consulateId: 'FR_NEW_DELHI',
      explanation: 'India-based applicants for France visas apply through the Embassy of France, New Delhi.',
    };
  }

  throw new Error(
    `Unsupported combination: nationality=${nationality}, destination=${mainDestination}, residence=${residenceCountry}. ` +
    `Currently only India → France is supported.`
  );
}
