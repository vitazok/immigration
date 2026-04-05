'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TooltipIcon } from '@/components/help/tooltip-icon';
import type { FormFieldMapping } from '@/lib/types/form-mapping';

interface FieldRowProps {
  mapping: FormFieldMapping;
  value: string;
  applicantId: string;
  consulateId: string;
  onUpdated: (fieldNumber: number, value: string) => void;
}

export function FieldRow({ mapping, value, applicantId, consulateId, onUpdated }: FieldRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/assembly/update-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId,
          fieldNumber: mapping.fieldNumber,
          acroFormFieldId: mapping.acroFormFieldId,
          value: editValue,
        }),
      });
      onUpdated(mapping.fieldNumber, editValue);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const confidence = mapping.confidenceLevel;

  return (
    <div className={`flex items-start gap-4 py-3 border-l-2 pl-4 ${
      confidence === 'high' ? 'border-confidence-high' :
      confidence === 'medium' ? 'border-confidence-medium' :
      'border-confidence-low'
    }`}>
      <div className="w-6 text-xs text-gray-400 font-mono mt-1 flex-shrink-0">{mapping.fieldNumber}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-gray-500">{mapping.fieldLabel}</p>
          <TooltipIcon tooltipKey={mapping.tooltipKey} consulateId={consulateId} />
        </div>
        {editing ? (
          <div className="flex gap-2 items-center">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm py-1.5"
              autoFocus
            />
            <Button size="sm" onClick={save} loading={saving}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditValue(value); }}>Cancel</Button>
          </div>
        ) : (
          <p className="text-sm font-medium">{value || <span className="text-gray-300 italic">empty</span>}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        <Badge variant={confidence}>{confidence}</Badge>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setEditValue(value); }}
            className="text-xs text-gray-400 hover:text-black transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

// The full form review panel
export function FormReviewPanel() {
  const t = useTranslations('form');
  const [fieldMappings, setFieldMappings] = useState<FormFieldMapping[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const applicantId = typeof window !== 'undefined'
    ? (localStorage.getItem('visaagent_applicant_id') ?? '')
    : '';
  const tripId = typeof window !== 'undefined'
    ? (localStorage.getItem('visaagent_trip_id') ?? '')
    : '';

  useEffect(() => {
    generateForm();
  }, []);

  async function generateForm() {
    if (!applicantId || !tripId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/assembly/generate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId, tripId }),
      });
      const data = (await res.json()) as {
        data?: { formUrl: string; fieldMappings: FormFieldMapping[] };
      };
      if (data.data) {
        setFieldMappings(data.data.fieldMappings);
        setPdfUrl(data.data.formUrl);
      }
    } finally {
      setLoading(false);
    }
  }

  async function finalize() {
    setGenerating(true);
    try {
      const res = await fetch('/api/assembly/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId }),
      });
      const data = (await res.json()) as { data?: { finalPdfUrl: string } };
      if (data.data) setPdfUrl(data.data.finalPdfUrl);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Confidence legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-confidence-high" />{t('confidence.high')}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-confidence-medium" />{t('confidence.medium')}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-confidence-low" />{t('confidence.low')}</span>
      </div>

      {/* Fields */}
      <div className="divide-y divide-gray-100">
        {fieldMappings.map((mapping) => (
          <FieldRow
            key={mapping.fieldNumber}
            mapping={mapping}
            value={fieldValues[mapping.acroFormFieldId] ?? ''}
            applicantId={applicantId}
            consulateId="FR_NEW_DELHI"
            onUpdated={(num, val) => setFieldValues((prev) => ({ ...prev, [mapping.acroFormFieldId]: val }))}
          />
        ))}
      </div>

      <div className="pt-4 space-y-3">
        <p className="text-xs text-gray-400">{t('warning.reviewAll')}</p>
        <Button onClick={finalize} loading={generating} className="w-full" size="lg">
          {t('actions.generatePdf')}
        </Button>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm underline underline-offset-2">
            {t('actions.downloadPdf')}
          </a>
        )}
      </div>
    </div>
  );
}
