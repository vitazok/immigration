'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import type { QualityCheckResult, QualityIssue } from '@/lib/types/quality';
import { ChatWidget } from '@/components/help/chat-widget';
import { FaqDrawer } from '@/components/help/faq-drawer';

export default function QualityCheckPage() {
  const t = useTranslations('quality');
  const [result, setResult] = useState<QualityCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      // applicantId comes from session/context in production
      const applicantId = localStorage.getItem('visaagent_applicant_id') ?? '';
      const res = await fetch('/api/quality/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId }),
      });
      const data = (await res.json()) as { data?: QualityCheckResult; error?: { message: string } };
      if (data.error) throw new Error(data.error.message);
      setResult(data.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quality check failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>

      {!result && (
        <button
          onClick={runCheck}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-md font-semibold disabled:opacity-50"
        >
          {loading ? t('subtitle') : 'Run Quality Check'}
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="space-y-6">
          {/* Score */}
          <div className="border border-gray-200 rounded-md p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t('score.label')}</span>
              <span className="text-3xl font-semibold">{result.overallScore}/100</span>
            </div>
            <div className={`text-sm font-medium ${result.riskLevel === 'low' ? 'text-green-700' : result.riskLevel === 'medium' ? 'text-yellow-700' : 'text-red-700'}`}>
              {t(`risk.${result.riskLevel}`)}
            </div>
          </div>

          {/* Blockers */}
          {result.blockers.length > 0 && (
            <IssueSection title={t('sections.blockers')} issues={result.blockers} icon={AlertCircle} color="red" locale="en" />
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <IssueSection title={t('sections.warnings')} issues={result.warnings} icon={AlertTriangle} color="yellow" locale="en" />
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <IssueSection title={t('sections.recommendations')} issues={result.recommendations} icon={Lightbulb} color="gray" locale="en" />
          )}

          {result.blockers.length === 0 && result.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={18} />
              <span className="font-medium">No critical issues found.</span>
            </div>
          )}

          <button onClick={runCheck} className="text-sm text-gray-500 underline underline-offset-2">
            {t('actions.rerun')}
          </button>
        </div>
      )}

      <FaqDrawer step="quality-check" consulateId="FR_NEW_DELHI" />
      <ChatWidget currentStep="quality-check" />
    </div>
  );
}

function IssueSection({
  title,
  issues,
  icon: Icon,
  color,
  locale,
}: {
  title: string;
  issues: QualityIssue[];
  icon: React.ElementType;
  color: string;
  locale: string;
}) {
  const colorMap: Record<string, string> = {
    red: 'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    gray: 'border-gray-200 bg-gray-50',
  };
  const iconColorMap: Record<string, string> = {
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-500',
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500">{title}</h2>
      <div className="space-y-2">
        {issues.map((issue) => (
          <div key={issue.code} className={`border rounded-md p-4 space-y-1 ${colorMap[color] ?? colorMap['gray']}`}>
            <div className="flex items-start gap-2">
              <Icon size={16} className={`flex-shrink-0 mt-0.5 ${iconColorMap[color]}`} />
              <div className="space-y-1">
                <p className="font-semibold text-sm">{issue.title.en}</p>
                <p className="text-sm text-gray-600">{issue.description.en}</p>
                <p className="text-sm font-medium text-gray-800 mt-2">→ {issue.suggestedAction.en}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
