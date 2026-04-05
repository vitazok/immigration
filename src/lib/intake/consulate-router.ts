// Determines the correct consulate and visa type based on applicant inputs.
// Rules sourced from Schengen Visa Code Article 5.

import { getConsulate } from '@/lib/knowledge/queries';
import type { VisaRecommendation } from '@/lib/types/application';

export interface ConsulateRouterInput {
  nationality: string;       // ISO 3166-1 alpha-3
  destination: string;       // ISO 3166-1 alpha-3
  purpose: string;           // tourism, visiting_family, business, etc.
}

// MVP routing table — expand as more consulates are added
const ROUTING_TABLE: Record<string, Record<string, { consulateId: string; visaType: string; visaName: string }>> = {
  IND: {
    FRA: {
      consulateId: 'FR_NEW_DELHI',
      visaType: 'schengen_c',
      visaName: 'Schengen Type C Tourist Visa',
    },
  },
};

export function routeToConsulate(input: ConsulateRouterInput): VisaRecommendation {
  const { nationality, destination } = input;

  const byNationality = ROUTING_TABLE[nationality];
  const route = byNationality?.[destination];

  if (!route) {
    throw new Error(
      `Unsupported combination: nationality=${nationality}, destination=${destination}. ` +
      `Currently only India → France is supported.`
    );
  }

  const consulate = getConsulate(route.consulateId);

  return {
    consulateId: route.consulateId,
    visaType: route.visaType,
    visaName: route.visaName,
    consulateName: `Embassy of ${consulate.country}, ${consulate.city}`,
    vfsProvider: consulate.vfsProvider,
    processingDays: consulate.processingTimeDays,
    refusalRate: consulate.refusalRateEstimate,
    requiredDocCount: consulate.requiredDocuments.filter((d: { required: boolean }) => d.required).length,
  };
}
