'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink, Check } from 'lucide-react';

interface TrackDecisionStepProps {
  processingDays: { min: number; max: number };
  refusalRate: number;
  trackingUrl: string | null;
  completed: boolean;
  onToggleComplete: (completed: boolean) => void;
}

export function TrackDecisionStep({
  processingDays,
  refusalRate,
  trackingUrl,
  completed,
  onToggleComplete,
}: TrackDecisionStepProps) {
  const t = useTranslations('journey');

  return (
    <div className="space-y-5">
      {/* Processing timeline */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t('track.timeline.title')}</h4>
        <div className="border border-gray-200 rounded-md p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('track.timeline.processing')}</span>
            <span className="font-medium">
              {t('track.timeline.businessDays', {
                min: processingDays.min,
                max: processingDays.max,
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('track.timeline.refusalRate')}</span>
            <span className="font-medium">{Math.round(refusalRate * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Track application */}
      {trackingUrl && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{t('track.trackApplication.title')}</h4>
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-black px-4 py-2 rounded-md border border-black hover:bg-gray-50 transition-colors"
          >
            {t('track.trackApplication.button')}
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* What happens next */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t('track.whatNext.title')}</h4>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <p className="font-medium text-black">{t('track.whatNext.approvedTitle')}</p>
            <p className="text-xs mt-0.5">{t('track.whatNext.approvedDescription')}</p>
          </div>
          <div>
            <p className="font-medium text-black">{t('track.whatNext.refusedTitle')}</p>
            <p className="text-xs mt-0.5">{t('track.whatNext.refusedDescription')}</p>
          </div>
        </div>
      </div>

      {/* Mark as done */}
      <button
        onClick={() => onToggleComplete(!completed)}
        className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md border transition-colors ${
          completed
            ? 'bg-black text-white border-black'
            : 'bg-white text-black border-gray-300 hover:border-black'
        }`}
      >
        {completed && <Check size={14} />}
        {completed ? t('track.received') : t('track.markReceived')}
      </button>
    </div>
  );
}
