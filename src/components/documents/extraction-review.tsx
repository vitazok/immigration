'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DocumentExtraction, ExtractedField } from '@/lib/types/documents';

interface ExtractionReviewProps {
  documentId: string;
  extraction: DocumentExtraction;
  onConfirm: (corrections: Record<string, string>) => void;
}

export function ExtractionReview({ documentId, extraction, onConfirm }: ExtractionReviewProps) {
  const t = useTranslations('documents');
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fields = Object.entries(extraction.fields);

  function startEdit(key: string, currentValue: string) {
    setEditingField(key);
    setEditValue(corrections[key] ?? currentValue);
  }

  function applyEdit(key: string) {
    setCorrections((prev) => ({ ...prev, [key]: editValue }));
    setEditingField(null);
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue('');
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await fetch(`/api/documents/${documentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrections }),
      });
      onConfirm(corrections);
    } finally {
      setSaving(false);
    }
  }

  function confidenceVariant(field: ExtractedField): 'high' | 'medium' | 'low' {
    if (field.confidence >= 0.9) return 'high';
    if (field.confidence >= 0.7) return 'medium';
    return 'low';
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <p className="text-sm font-semibold">{t('extraction.title')}</p>
        <p className="text-xs text-gray-400">{t(`types.${extraction.documentType}`)}</p>
      </div>

      <div className="divide-y divide-gray-100">
        {fields.map(([key, field]) => {
          const displayValue = corrections[key] ?? field.value;
          const variant = corrections[key] ? 'high' : confidenceVariant(field);
          const isEditing = editingField === key;

          return (
            <div key={key} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
                {isEditing ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="text-sm py-1"
                      autoFocus
                    />
                    <button
                      onClick={() => applyEdit(key)}
                      className="text-xs font-medium px-2 py-1 bg-black text-white rounded"
                    >
                      OK
                    </button>
                    <button onClick={cancelEdit} className="text-xs text-gray-400">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-sm truncate">{displayValue}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={variant}>
                  {corrections[key]
                    ? t('extraction.source.manual')
                    : t(`extraction.confidence.${confidenceVariant(field)}`)}
                </Badge>
                {!isEditing && (
                  <button
                    onClick={() => startEdit(key, field.value)}
                    className="text-xs text-gray-400 hover:text-black transition-colors"
                  >
                    {t('extraction.editHint')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <Button
          onClick={handleConfirm}
          loading={saving}
          className="w-full"
        >
          Confirm extracted data
        </Button>
      </div>
    </div>
  );
}
