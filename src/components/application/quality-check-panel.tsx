'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, Lightbulb, CheckCircle, Loader2 } from 'lucide-react';
import type { QualityCheckResult, QualityIssue } from '@/lib/types/quality';

interface QualityCheckPanelProps {
  applicantId: string | null;
  initialResult: QualityCheckResult | null;
}

export function QualityCheckPanel({ applicantId, initialResult }: QualityCheckPanelProps) {
  const [result, setResult] = useState<QualityCheckResult | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    if (!applicantId) {
      setError('Sign in and upload documents before running a quality check.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
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
    <div className="space-y-4">
      {!result && (
        <button
          onClick={runCheck}
          disabled={loading || !applicantId}
          className="w-full bg-black text-white py-3 rounded-md font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Checking...' : 'Run Quality Check'}
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="space-y-4">
          {/* Score */}
          <div className="border border-gray-200 rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Overall Score</span>
              <span className="text-2xl font-semibold">{result.overallScore}/100</span>
            </div>
            <div className={`text-sm font-medium ${
              result.riskLevel === 'low' ? 'text-green-700' :
              result.riskLevel === 'medium' ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {result.riskLevel === 'low' ? 'Low risk' :
               result.riskLevel === 'medium' ? 'Medium risk' : 'High risk'}
            </div>
          </div>

          {/* Issues */}
          {result.blockers.length > 0 && (
            <IssueList title="Blockers" issues={result.blockers} icon={AlertCircle} color="red" />
          )}
          {result.warnings.length > 0 && (
            <IssueList title="Warnings" issues={result.warnings} icon={AlertTriangle} color="yellow" />
          )}
          {result.recommendations.length > 0 && (
            <IssueList title="Recommendations" issues={result.recommendations} icon={Lightbulb} color="gray" />
          )}

          {result.blockers.length === 0 && result.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={18} />
              <span className="font-medium text-sm">No critical issues found.</span>
            </div>
          )}

          <button onClick={runCheck} disabled={loading} className="text-sm text-gray-500 underline underline-offset-2">
            {loading ? 'Checking...' : 'Re-run check'}
          </button>
        </div>
      )}
    </div>
  );
}

function IssueList({
  title,
  issues,
  icon: Icon,
  color,
}: {
  title: string;
  issues: QualityIssue[];
  icon: React.ElementType;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    red: 'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    gray: 'border-gray-200 bg-gray-50',
  };
  const iconMap: Record<string, string> = {
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-500',
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-xs uppercase tracking-wide text-gray-500">{title}</h3>
      {issues.map((issue) => (
        <div key={issue.code} className={`border rounded-md p-3 ${bgMap[color] ?? bgMap['gray']}`}>
          <div className="flex items-start gap-2">
            <Icon size={14} className={`flex-shrink-0 mt-0.5 ${iconMap[color]}`} />
            <div className="space-y-1">
              <p className="font-semibold text-sm">{issue.title.en}</p>
              <p className="text-xs text-gray-600">{issue.description.en}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
