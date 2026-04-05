'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { DocumentExtraction, ExtractedField } from '@/lib/types/documents';
import type { DocumentType } from '@/lib/types/documents';

interface DocumentCardProps {
  documentId: string;
  type: DocumentType;
}

export function DocumentCard({ documentId, type }: DocumentCardProps) {
  const t = useTranslations('documents');
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/documents/${documentId}/extraction`)
      .then((r) => r.json())
      .then((data: { data?: { result: DocumentExtraction } }) => {
        if (data.data?.result) setExtraction(data.data.result);
      })
      .catch(() => null);
  }, [documentId]);

  async function saveEdit(fieldKey: string) {
    setSaving(true);
    try {
      await fetch(`/api/documents/${documentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrections: { [fieldKey]: editValue } }),
      });
      setExtraction((prev) =>
        prev
          ? {
              ...prev,
              fields: {
                ...prev.fields,
                [fieldKey]: { ...prev.fields[fieldKey], value: editValue, source: 'manual' } as ExtractedField,
              },
            }
          : prev
      );
    } finally {
      setSaving(false);
      setEditing(null);
    }
  }

  if (!extraction) return null;

  const fields = Object.entries(extraction.fields).slice(0, 8); // Show top 8 fields

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm font-semibold">{t(`types.${type}`)}</p>
      </div>
      <div className="divide-y divide-gray-100">
        {fields.map(([key, field]) => {
          const confidence = field.confidence >= 0.9 ? 'high' : field.confidence >= 0.7 ? 'medium' : 'low';
          return (
            <div key={key} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
                {editing === key ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="text-sm py-1"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(key)}
                      disabled={saving}
                      className="text-xs font-medium px-2 py-1 bg-black text-white rounded disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditing(null)} className="text-xs text-gray-400">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-sm truncate">{field.value}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={confidence}>{t(`extraction.confidence.${confidence}`)}</Badge>
                {editing !== key && (
                  <button
                    onClick={() => { setEditing(key); setEditValue(field.value); }}
                    className="text-xs text-gray-400 hover:text-black transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
