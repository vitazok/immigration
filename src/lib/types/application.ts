export interface VisaRecommendation {
  consulateId: string;
  visaType: string;         // e.g. "schengen_c"
  visaName: string;         // e.g. "Schengen Type C Tourist Visa"
  consulateName: string;    // e.g. "Embassy of France, New Delhi"
  vfsProvider: string;      // e.g. "vfs_global"
  processingDays: { min: number; max: number };
  refusalRate: number;      // 0-1
  requiredDocCount: number;
}

export type ApplicationStatus = 'draft' | 'in_progress' | 'ready_for_review' | 'finalized';

export interface ApplicationSummary {
  id: string;
  status: ApplicationStatus;
  nationality: string;
  destination: string;
  purpose: string;
  consulateId: string;
  visaName: string;
  recommendation: VisaRecommendation;
  documentsUploaded: number;
  documentsRequired: number;
  formFieldsFilled: number;
  formFieldsTotal: number;
}
