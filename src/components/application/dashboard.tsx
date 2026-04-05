'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Shield } from 'lucide-react';
import { ProgressBar } from './progress-bar';
import { DocumentChecklist } from './document-checklist';
import { DocumentUploadModal } from './document-upload-modal';
import { FormSections } from './form-sections';

interface ApplicationData {
  application: {
    id: string;
    status: string;
    visaName: string;
    nationality: string;
    destination: string;
    purpose: string;
  };
  recommendation: {
    consulateId: string;
    visaName: string;
    consulateName: string;
    processingDays: { min: number; max: number };
    refusalRate: number;
    requiredDocCount: number;
  };
  requiredDocuments: Array<{
    documentType: string;
    required: boolean;
    description: { en: string; hi?: string };
    notes: { en: string; hi?: string } | null;
  }>;
  documents: Array<{ id: string; type: string; extractionStatus: string }>;
  formFields: Record<string, string>;
  formFieldsFilled: number;
  formFieldsTotal: number;
  applicant: Record<string, unknown> | null;
  trip: Record<string, unknown> | null;
}

export function ApplicationDashboard({ applicationId }: { applicationId: string }) {
  const { locale } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadApplication = useCallback(async () => {
    try {
      const res = await fetch(`/api/application/${applicationId}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
        return;
      }
      setData(json.data);
    } catch {
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  function handleFieldChange(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (Object.keys(formValues).length === 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/application/${applicationId}/form`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: data?.applicant ? (data.applicant as { id: string }).id : '',
          fields: formValues,
        }),
      });
      const json = await res.json();
      if (json.error) {
        if (json.error.code === 'UNAUTHORIZED') {
          router.push(`/${locale}/sign-in`);
          return;
        }
        setError(json.error.message);
      } else {
        setFormValues({});
        await loadApplication();
      }
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-red-600">{error ?? 'Application not found'}</p>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="text-sm text-gray-600 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const docsRequired = data.requiredDocuments.filter((d) => d.required).length;
  const docsUploaded = data.documents.length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{data.application.visaName}</h1>
        <p className="text-sm text-gray-600">{data.recommendation.consulateName}</p>
      </div>

      {/* Progress */}
      <ProgressBar
        documentsUploaded={docsUploaded}
        documentsRequired={docsRequired}
        formFieldsFilled={data.formFieldsFilled}
        formFieldsTotal={data.formFieldsTotal}
      />

      {/* Document Checklist */}
      <DocumentChecklist
        requiredDocuments={data.requiredDocuments}
        uploadedDocuments={data.documents}
        onUpload={(docType) => setUploadingDocType(docType)}
        locale={(locale as string) ?? 'en'}
      />

      {/* Application Form */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900">Application Form</h2>
        <FormSections
          applicant={data.applicant}
          trip={data.trip}
          formFields={{ ...data.formFields, ...formValues }}
          onFieldChange={handleFieldChange}
          onSave={handleSave}
          saving={saving}
        />
      </div>

      {/* Quality Check */}
      <div className="border border-gray-200 rounded-md p-4 flex items-center gap-3">
        <Shield size={18} className="text-gray-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Quality Check</p>
          <p className="text-xs text-gray-500">AI review for common refusal triggers</p>
        </div>
        <button
          onClick={() => router.push(`/${locale}/quality-check`)}
          className="text-sm bg-white border border-black text-black px-4 py-2 rounded-md font-semibold hover:bg-gray-50 transition-colors"
        >
          Run check
        </button>
      </div>

      {/* Upload Modal */}
      {uploadingDocType && (
        <DocumentUploadModal
          documentType={uploadingDocType}
          applicantId={data.applicant ? (data.applicant as { id: string }).id : null}
          onClose={() => setUploadingDocType(null)}
          onUploadComplete={() => {
            setUploadingDocType(null);
            loadApplication();
          }}
        />
      )}
    </div>
  );
}
