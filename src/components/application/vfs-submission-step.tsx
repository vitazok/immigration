'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink, Check } from 'lucide-react';

interface VfsSubmissionStepProps {
  appointmentUrl: string;
  processingDays: { min: number; max: number };
  knownPractices: string[];
  fees: { visaFee: { amount: number; currency: string }; vfsServiceCharge: { amount: number; currency: string }; note: string } | null;
  completed: boolean;
  onToggleComplete: (completed: boolean) => void;
}

export function VfsSubmissionStep({
  appointmentUrl,
  processingDays,
  knownPractices,
  fees,
  completed,
  onToggleComplete,
}: VfsSubmissionStepProps) {
  const t = useTranslations('journey');

  const whatToBringKeys = [
    'passport',
    'applicationForm',
    'coverLetter',
    'supportingDocs',
    'photos',
    'feePayment',
    'appointmentConfirmation',
  ] as const;

  return (
    <div className="space-y-5">
      {/* Book Appointment */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t('vfs.bookAppointment.title')}</h4>
        <p className="text-xs text-gray-600">
          {t('vfs.bookAppointment.description', {
            min: processingDays.min,
            max: processingDays.max,
          })}
        </p>
        <a
          href={appointmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors"
        >
          {t('vfs.bookAppointment.button')}
          <ExternalLink size={14} />
        </a>
        <p className="text-xs text-gray-400">{t('vfs.bookAppointment.disclaimer')}</p>
      </div>

      {/* Fee Breakdown */}
      {fees && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{t('vfs.fees.title')}</h4>
          <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
            <div className="flex justify-between px-3 py-2">
              <span className="text-sm text-gray-600">{t('vfs.fees.visaFee')}</span>
              <span className="text-sm font-medium">{fees.visaFee.currency} {fees.visaFee.amount}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span className="text-sm text-gray-600">{t('vfs.fees.serviceCharge')}</span>
              <span className="text-sm font-medium">{fees.vfsServiceCharge.currency} {fees.vfsServiceCharge.amount}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">{fees.note}</p>
        </div>
      )}

      {/* What to Bring */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t('vfs.whatToBring.title')}</h4>
        <ul className="space-y-1.5 text-sm text-gray-600">
          {whatToBringKeys.map((key) => (
            <li key={key} className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">-</span>
              <span>{t(`vfs.whatToBring.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Biometrics */}
      <p className="text-xs text-gray-500 border-l-2 border-gray-200 pl-3">
        {t('vfs.biometrics')}
      </p>

      {/* Tips */}
      {knownPractices.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{t('vfs.tips')}</h4>
          <ul className="space-y-1">
            {knownPractices.slice(0, 3).map((practice, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">-</span>
                <span>{practice}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
        {completed ? t('vfs.submitted') : t('vfs.markSubmitted')}
      </button>
    </div>
  );
}
