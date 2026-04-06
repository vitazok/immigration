'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { JourneyProgress } from './journey-progress';
import { JourneyStepCard } from './journey-step';
import { DocumentChecklist } from './document-checklist';
import { DocumentUploadModal } from './document-upload-modal';
import { FormSections } from './form-sections';
import { QualityCheckPanel } from './quality-check-panel';
import { VfsSubmissionStep } from './vfs-submission-step';
import { TrackDecisionStep } from './track-decision-step';
import { deriveStepStatuses, getCurrentStepIndex } from '@/lib/journey/derive-status';
import type { JourneyStep, JourneyProgress as JourneyProgressType, ExtractionMeta } from '@/lib/types/application';
import type { QualityCheckResult } from '@/lib/types/quality';

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
  extractionMeta: Record<string, ExtractionMeta>;
  qualityCheckResult: QualityCheckResult | null;
  hasFinalPdf: boolean;
  journeyProgress: JourneyProgressType | null;
  consulateGuidance: {
    appointmentBookingUrl: string;
    vfsTrackingUrl: string | null;
    fees: { visaFee: { amount: number; currency: string }; vfsServiceCharge: { amount: number; currency: string }; note: { en: string; hi?: string } } | null;
    knownPractices: string[];
  } | null;
}

export function ApplicationDashboard({ applicationId }: { applicationId: string }) {
  const { locale } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();

  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

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

  // Link applicant to application after sign-in
  const linkApplicant = useCallback(async () => {
    try {
      const res = await fetch(`/api/application/${applicationId}/link`, { method: 'POST' });
      const json = await res.json();
      if (json.data?.applicantId) {
        await loadApplication(); // Reload with linked applicant
      }
    } catch {
      // Non-fatal — user can retry
    }
  }, [applicationId, loadApplication]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  // After sign-in: link applicant if not yet linked, handle ?upload= param
  useEffect(() => {
    if (!data || !isSignedIn) return;
    if (!data.applicant) {
      linkApplicant();
    }
  }, [data, isSignedIn, linkApplicant]);

  // Handle ?upload= query param (redirect back from sign-in)
  useEffect(() => {
    const uploadParam = searchParams.get('upload');
    if (uploadParam && data?.applicant) {
      setUploadingDocType(uploadParam);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('upload');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, data]);

  // Set initial expanded step based on journey progress
  useEffect(() => {
    if (!data || expandedStep !== null) return;
    const steps = computeSteps();
    const currentIdx = getCurrentStepIndex(steps);
    setExpandedStep(steps[currentIdx]?.id ?? 'upload_documents');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function computeSteps(): JourneyStep[] {
    if (!data) return [];
    const docsRequired = data.requiredDocuments.filter((d) => d.required).length;
    return deriveStepStatuses({
      docsUploaded: data.documents.length,
      docsRequired,
      formFieldsFilled: data.formFieldsFilled,
      formFieldsTotal: data.formFieldsTotal,
      hasQualityCheck: data.qualityCheckResult !== null,
      qualityBlockers: data.qualityCheckResult?.blockers.length ?? 0,
      hasFinalPdf: data.hasFinalPdf,
      journeyProgress: data.journeyProgress,
    });
  }

  function handleUploadClick(docType: string) {
    if (!isSignedIn) {
      // Redirect to sign-in with return URL
      const returnUrl = `/${locale}/application/${applicationId}?upload=${docType}`;
      router.push(`/${locale}/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setUploadingDocType(docType);
  }

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

  async function handleJourneyStepToggle(stepId: 'submit_vfs' | 'track_decision', completed: boolean) {
    try {
      await fetch(`/api/application/${applicationId}/journey-step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, completed }),
      });
      await loadApplication();
    } catch {
      setError('Failed to update step');
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

  const steps = computeSteps();
  const currentStepIndex = getCurrentStepIndex(steps);
  const jp = data.journeyProgress ?? { step4Complete: false, step5Complete: false };

  // VFS guidance data from consulate JSON
  const guidance = data.consulateGuidance;
  const appointmentUrl = guidance?.appointmentBookingUrl ?? '';
  const trackingUrl = guidance?.vfsTrackingUrl ?? null;
  const currentLocale = (locale as string) ?? 'en';
  const fees = guidance?.fees
    ? {
        visaFee: guidance.fees.visaFee,
        vfsServiceCharge: guidance.fees.vfsServiceCharge,
        note: (guidance.fees.note as Record<string, string>)?.[currentLocale] ?? (guidance.fees.note as Record<string, string>)?.en ?? '',
      }
    : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{data.application.visaName}</h1>
        <p className="text-sm text-gray-600">{data.recommendation.consulateName}</p>
      </div>

      {/* Journey Progress */}
      <JourneyProgress steps={steps} currentStepIndex={currentStepIndex} />

      {/* Step 1: Upload Documents */}
      <JourneyStepCard
        stepId="upload_documents"
        stepNumber={1}
        status={steps[0]?.status ?? 'not_started'}
        isExpanded={expandedStep === 'upload_documents'}
        onToggle={() => setExpandedStep(expandedStep === 'upload_documents' ? null : 'upload_documents')}
      >
        <DocumentChecklist
          requiredDocuments={data.requiredDocuments}
          uploadedDocuments={data.documents}
          onUpload={handleUploadClick}
          locale={(locale as string) ?? 'en'}
        />
      </JourneyStepCard>

      {/* Step 2: Fill Application Form */}
      <JourneyStepCard
        stepId="fill_form"
        stepNumber={2}
        status={steps[1]?.status ?? 'not_started'}
        isExpanded={expandedStep === 'fill_form'}
        onToggle={() => setExpandedStep(expandedStep === 'fill_form' ? null : 'fill_form')}
      >
        <FormSections
          applicant={data.applicant}
          trip={data.trip}
          formFields={{ ...data.formFields, ...formValues }}
          onFieldChange={handleFieldChange}
          onSave={handleSave}
          saving={saving}
          extractionMeta={data.extractionMeta}
        />
      </JourneyStepCard>

      {/* Step 3: Quality Check */}
      <JourneyStepCard
        stepId="quality_check"
        stepNumber={3}
        status={steps[2]?.status ?? 'locked'}
        isExpanded={expandedStep === 'quality_check'}
        onToggle={() => setExpandedStep(expandedStep === 'quality_check' ? null : 'quality_check')}
      >
        <QualityCheckPanel
          applicantId={data.applicant ? (data.applicant as { id: string }).id : null}
          initialResult={data.qualityCheckResult}
        />
      </JourneyStepCard>

      {/* Step 4: Submit at VFS */}
      <JourneyStepCard
        stepId="submit_vfs"
        stepNumber={4}
        status={steps[3]?.status ?? 'locked'}
        isExpanded={expandedStep === 'submit_vfs'}
        onToggle={() => setExpandedStep(expandedStep === 'submit_vfs' ? null : 'submit_vfs')}
      >
        <VfsSubmissionStep
          appointmentUrl={appointmentUrl}
          processingDays={data.recommendation.processingDays}
          knownPractices={guidance?.knownPractices ?? []}
          fees={fees}
          completed={jp.step4Complete}
          onToggleComplete={(v) => handleJourneyStepToggle('submit_vfs', v)}
        />
      </JourneyStepCard>

      {/* Step 5: Track Decision */}
      <JourneyStepCard
        stepId="track_decision"
        stepNumber={5}
        status={steps[4]?.status ?? 'locked'}
        isExpanded={expandedStep === 'track_decision'}
        onToggle={() => setExpandedStep(expandedStep === 'track_decision' ? null : 'track_decision')}
      >
        <TrackDecisionStep
          processingDays={data.recommendation.processingDays}
          refusalRate={data.recommendation.refusalRate}
          trackingUrl={trackingUrl}
          completed={jp.step5Complete}
          onToggleComplete={(v) => handleJourneyStepToggle('track_decision', v)}
        />
      </JourneyStepCard>

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
