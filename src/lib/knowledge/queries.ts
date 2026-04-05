import { loadConsulate } from './loader';
import type { ConsulateRequirement, DocumentRequirement, FaqEntry, LocalizedString } from '@/lib/types/consulate';
import type { DocumentType } from '@/lib/types/documents';

export function getConsulate(consulateId: string): ConsulateRequirement {
  return loadConsulate(consulateId);
}

export function getDocumentChecklist(consulateId: string): DocumentRequirement[] {
  const consulate = loadConsulate(consulateId);
  return consulate.requiredDocuments;
}

export function getRequiredDocuments(consulateId: string): DocumentRequirement[] {
  return getDocumentChecklist(consulateId).filter((d) => d.required);
}

export function getTooltip(consulateId: string, fieldId: string, locale: string): string | null {
  const consulate = loadConsulate(consulateId);
  const tooltip = consulate.tooltips[fieldId];
  if (!tooltip) return null;
  return getLocalizedString(tooltip, locale);
}

export function getFaqsForStep(consulateId: string, wizardStep: string, locale: string): Array<{ question: string; answer: string }> {
  const consulate = loadConsulate(consulateId);
  return consulate.faqs
    .filter((faq) => faq.wizardStep === wizardStep)
    .sort((a, b) => a.order - b.order)
    .map((faq: FaqEntry) => ({
      question: getLocalizedString(faq.question, locale),
      answer: getLocalizedString(faq.answer, locale),
    }));
}

export function getFinancialThreshold(consulateId: string): { amount: number; currency: string } {
  const consulate = loadConsulate(consulateId);
  return consulate.financialThresholdMin;
}

export function getMinimumRequiredBalance(consulateId: string, durationDays: number): number {
  const threshold = getFinancialThreshold(consulateId);
  return Math.ceil(durationDays / 7) * threshold.amount;
}

export function isDocumentRequired(consulateId: string, docType: DocumentType): boolean {
  const docs = getRequiredDocuments(consulateId);
  return docs.some((d) => d.documentType === docType);
}

// Determine the correct consulate for a given applicant nationality and destination
// For MVP: only FR_NEW_DELHI is supported
export function determineConsulate(params: {
  nationality: string;
  mainDestination: string;
  residenceCountry: string;
}): string {
  const { nationality, mainDestination } = params;

  // MVP: India → France
  if (nationality === 'IND' && mainDestination === 'FRA') {
    return 'FR_NEW_DELHI';
  }

  // Future: expand with more consulate mappings
  // For now, default to FR_NEW_DELHI if France is the destination
  if (mainDestination === 'FRA') {
    return 'FR_NEW_DELHI';
  }

  throw new Error(
    `No consulate found for nationality=${nationality}, destination=${mainDestination}. ` +
    `Only India → France (FR_NEW_DELHI) is supported in MVP.`
  );
}

function getLocalizedString(ls: LocalizedString, locale: string): string {
  if (locale === 'hi' && ls.hi) return ls.hi;
  if (locale === 'zh-CN' && ls['zh-CN']) return ls['zh-CN'];
  return ls.en;
}
