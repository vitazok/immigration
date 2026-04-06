'use client';

import { useTranslations } from 'next-intl';
import type { JourneyStep } from '@/lib/types/application';

const STEP_KEYS: Record<string, string> = {
  upload_documents: 'uploadDocuments',
  fill_form: 'fillForm',
  quality_check: 'qualityCheck',
  submit_vfs: 'submitVfs',
  track_decision: 'trackDecision',
};

interface JourneyProgressProps {
  steps: JourneyStep[];
  currentStepIndex: number;
}

export function JourneyProgress({ steps, currentStepIndex }: JourneyProgressProps) {
  const t = useTranslations('journey');
  const currentStep = steps[currentStepIndex];
  const completedCount = steps.filter((s) => s.status === 'completed').length;

  const stepKey = currentStep ? STEP_KEYS[currentStep.id] : null;
  const label = stepKey ? t(`step.${stepKey}.title`) : t('status.done');

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        {t('progress.stepOf', {
          current: currentStep?.stepNumber ?? completedCount + 1,
          total: steps.length,
          label,
        })}
      </p>
      <div className="flex gap-1">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`h-1 flex-1 rounded-full ${
              step.status === 'completed'
                ? 'bg-black'
                : i === currentStepIndex
                ? 'bg-gray-400'
                : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
