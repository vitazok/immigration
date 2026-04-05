'use client';

import { ArrowRight, Clock, FileText, AlertTriangle } from 'lucide-react';
import type { VisaRecommendation } from '@/lib/types/application';

interface RecommendationCardProps {
  recommendation: VisaRecommendation;
  onStart: () => void;
}

export function RecommendationCard({ recommendation, onStart }: RecommendationCardProps) {
  const {
    visaName,
    consulateName,
    vfsProvider,
    processingDays,
    refusalRate,
    requiredDocCount,
  } = recommendation;

  const vfsLabel = vfsProvider === 'vfs_global' ? 'VFS Global' : vfsProvider;

  return (
    <div className="border border-gray-200 rounded-md p-6 space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{visaName}</h3>
        <p className="text-sm text-gray-600">
          {consulateName} via {vfsLabel}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-1">
          <Clock size={18} className="mx-auto text-gray-400" />
          <p className="text-sm font-semibold">{processingDays.min}–{processingDays.max} days</p>
          <p className="text-xs text-gray-500">Processing</p>
        </div>
        <div className="space-y-1">
          <FileText size={18} className="mx-auto text-gray-400" />
          <p className="text-sm font-semibold">{requiredDocCount} documents</p>
          <p className="text-xs text-gray-500">Required</p>
        </div>
        <div className="space-y-1">
          <AlertTriangle size={18} className="mx-auto text-gray-400" />
          <p className="text-sm font-semibold">~{Math.round(refusalRate * 100)}%</p>
          <p className="text-xs text-gray-500">Refusal rate</p>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-900 transition-colors"
      >
        Start application <ArrowRight size={16} />
      </button>
    </div>
  );
}
