import type { JourneyStep, JourneyProgress, StepStatus } from '@/lib/types/application';

interface ApplicationState {
  docsUploaded: number;
  docsRequired: number;
  formFieldsFilled: number;
  formFieldsTotal: number;
  hasQualityCheck: boolean;
  qualityBlockers: number;
  hasFinalPdf: boolean;
  journeyProgress: JourneyProgress | null;
}

export function deriveStepStatuses(state: ApplicationState): JourneyStep[] {
  const {
    docsUploaded,
    docsRequired,
    formFieldsFilled,
    formFieldsTotal,
    hasQualityCheck,
    qualityBlockers,
    hasFinalPdf,
    journeyProgress,
  } = state;

  const allDocsUploaded = docsUploaded >= docsRequired;
  const allFieldsFilled = formFieldsFilled >= formFieldsTotal && formFieldsTotal > 0;
  const noBlockers = hasQualityCheck && qualityBlockers === 0;

  // Step 1: Upload Documents
  const step1: StepStatus =
    docsUploaded === 0 ? 'not_started' : allDocsUploaded ? 'completed' : 'in_progress';

  // Step 2: Fill Application Form — unlocks alongside Step 1 (once any doc uploaded)
  let step2: StepStatus;
  if (docsUploaded === 0 && formFieldsFilled === 0) {
    step2 = 'not_started';
  } else if (allFieldsFilled) {
    step2 = 'completed';
  } else if (formFieldsFilled > 0) {
    step2 = 'in_progress';
  } else {
    step2 = 'not_started';
  }

  // Step 3: Quality Check — unlocks when Step 1 OR Step 2 has progress
  const hasProgress = docsUploaded > 0 || formFieldsFilled > 0;
  let step3: StepStatus;
  if (!hasProgress) {
    step3 = 'locked';
  } else if (noBlockers && hasFinalPdf) {
    step3 = 'completed';
  } else if (hasQualityCheck) {
    step3 = 'in_progress';
  } else {
    step3 = 'not_started';
  }

  // Step 4: Submit at VFS — unlocks when Step 3 completed
  const jp = journeyProgress ?? { step4Complete: false, step5Complete: false };
  const step4: StepStatus =
    step3 !== 'completed' ? 'locked' : jp.step4Complete ? 'completed' : 'not_started';

  // Step 5: Track Decision — unlocks when Step 4 completed
  const step5: StepStatus =
    step4 !== 'completed' ? 'locked' : jp.step5Complete ? 'completed' : 'not_started';

  return [
    { id: 'upload_documents', stepNumber: 1, status: step1 },
    { id: 'fill_form', stepNumber: 2, status: step2 },
    { id: 'quality_check', stepNumber: 3, status: step3 },
    { id: 'submit_vfs', stepNumber: 4, status: step4 },
    { id: 'track_decision', stepNumber: 5, status: step5 },
  ];
}

export function getCurrentStepIndex(steps: JourneyStep[]): number {
  // First non-completed, non-locked step
  const idx = steps.findIndex((s) => s.status !== 'completed' && s.status !== 'locked');
  return idx >= 0 ? idx : steps.length - 1;
}
