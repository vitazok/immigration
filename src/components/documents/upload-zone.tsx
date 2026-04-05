'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DocumentCard } from './document-card';
import type { DocumentType } from '@/lib/types/documents';

const DOCUMENT_TYPES: { type: DocumentType; required: boolean }[] = [
  { type: 'passport', required: true },
  { type: 'bank_statement', required: true },
  { type: 'employer_letter', required: true },
  { type: 'travel_insurance', required: true },
  { type: 'flight_reservation', required: true },
  { type: 'hotel_reservation', required: true },
  { type: 'photo', required: true },
  { type: 'cover_letter', required: false },
];

interface UploadedDoc {
  documentId: string;
  type: DocumentType;
  fileName: string;
  status: 'processing' | 'completed' | 'failed';
}

export function DocumentUploadZone() {
  const t = useTranslations('documents');
  const [uploads, setUploads] = useState<UploadedDoc[]>([]);
  const [activeType, setActiveType] = useState<DocumentType | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applicantId = typeof window !== 'undefined'
    ? (localStorage.getItem('visaagent_applicant_id') ?? '')
    : '';

  function getStatusForType(type: DocumentType): 'uploaded' | 'missing' {
    return uploads.some((u) => u.type === type) ? 'uploaded' : 'missing';
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeType) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicantId', applicantId);
      formData.append('type', activeType);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as {
        data?: { documentId: string };
        error?: { message: string };
      };

      if (data.data) {
        setUploads((prev) => [
          ...prev.filter((u) => u.type !== activeType),
          {
            documentId: data.data!.documentId,
            type: activeType,
            fileName: file.name,
            status: 'processing',
          },
        ]);

        // Poll for extraction status
        pollExtractionStatus(data.data.documentId, activeType);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      setActiveType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function pollExtractionStatus(documentId: string, type: DocumentType) {
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/documents/${documentId}/extraction`);
        const data = (await res.json()) as { data?: { status: string } };
        if (data.data?.status === 'completed' || data.data?.status === 'failed') {
          setUploads((prev) =>
            prev.map((u) =>
              u.documentId === documentId
                ? { ...u, status: data.data!.status as 'completed' | 'failed' }
                : u
            )
          );
          break;
        }
      } catch {
        break;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Document checklist */}
      <div className="space-y-2">
        {DOCUMENT_TYPES.map(({ type, required }) => {
          const status = getStatusForType(type);
          const upload = uploads.find((u) => u.type === type);

          return (
            <div
              key={type}
              className="flex items-center gap-3 border border-gray-200 rounded-md p-4"
            >
              <div className="flex-shrink-0">
                {status === 'uploaded' && upload?.status === 'completed' && (
                  <CheckCircle size={18} className="text-green-600" />
                )}
                {status === 'uploaded' && upload?.status === 'processing' && (
                  <Clock size={18} className="text-yellow-500 animate-pulse" />
                )}
                {status === 'uploaded' && upload?.status === 'failed' && (
                  <AlertCircle size={18} className="text-red-500" />
                )}
                {status === 'missing' && (
                  <div className="w-4 h-4 border border-gray-300 rounded-full" />
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium">{t(`types.${type}`)}</p>
                {upload && (
                  <p className="text-xs text-gray-400">{upload.fileName} · {t(`status.${upload.status}`)}</p>
                )}
                {!upload && required && (
                  <p className="text-xs text-gray-400">{t('checklist.missing')} · {t('checklist.uploaded').replace('Uploaded', 'Required')}</p>
                )}
              </div>

              <button
                onClick={() => {
                  setActiveType(type);
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
                className="text-xs font-medium border border-gray-200 px-3 py-1.5 rounded-md hover:border-black transition-colors disabled:opacity-50"
              >
                {status === 'uploaded' ? 'Replace' : t('actions.upload') || 'Upload'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Documents with extraction results */}
      {uploads.filter((u) => u.status === 'completed').length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">{t('extraction.title')}</h3>
          {uploads
            .filter((u) => u.status === 'completed')
            .map((upload) => (
              <DocumentCard key={upload.documentId} documentId={upload.documentId} type={upload.type} />
            ))}
        </div>
      )}
    </div>
  );
}
