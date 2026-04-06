'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Check, Lock } from 'lucide-react';
import type { StepStatus } from '@/lib/types/application';

const STEP_KEYS: Record<string, string> = {
  upload_documents: 'uploadDocuments',
  fill_form: 'fillForm',
  quality_check: 'qualityCheck',
  submit_vfs: 'submitVfs',
  track_decision: 'trackDecision',
};

interface JourneyStepCardProps {
  stepId: string;
  stepNumber: number;
  status: StepStatus;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function JourneyStepCard({
  stepId,
  stepNumber,
  status,
  isExpanded,
  onToggle,
  children,
}: JourneyStepCardProps) {
  const t = useTranslations('journey');
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const stepKey = STEP_KEYS[stepId] ?? stepId;

  return (
    <div className={`border rounded-md ${
      isLocked ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200'
    }`}>
      <button
        type="button"
        onClick={isLocked ? undefined : onToggle}
        disabled={isLocked}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
          isLocked ? 'cursor-default' : 'hover:bg-gray-50'
        }`}
      >
        {/* Status icon */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
          isCompleted
            ? 'bg-black text-white'
            : isLocked
            ? 'bg-gray-100 text-gray-300'
            : 'border-2 border-black text-black'
        }`}>
          {isCompleted ? <Check size={14} /> : isLocked ? <Lock size={12} /> : stepNumber}
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-semibold ${isLocked ? 'text-gray-400' : 'text-black'}`}>
            {t(`step.${stepKey}.title`)}
          </span>
          {!isExpanded && (
            <p className={`text-xs mt-0.5 ${isLocked ? 'text-gray-300' : 'text-gray-500'}`}>
              {t(`step.${stepKey}.description`)}
            </p>
          )}
        </div>

        {/* Status label + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCompleted && (
            <span className="text-xs text-gray-500">{t('status.done')}</span>
          )}
          {status === 'in_progress' && (
            <span className="text-xs text-gray-500">{t('status.inProgress')}</span>
          )}
          {!isLocked && (
            isExpanded
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && !isLocked && (
        <div className="border-t border-gray-200 px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
