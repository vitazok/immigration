'use client';

import { Upload, CheckCircle, FileText } from 'lucide-react';

interface DocumentRequirement {
  documentType: string;
  required: boolean;
  description: { en: string; hi?: string };
  notes: { en: string; hi?: string } | null;
}

interface UploadedDoc {
  id: string;
  type: string;
  extractionStatus: string;
}

interface DocumentChecklistProps {
  requiredDocuments: DocumentRequirement[];
  uploadedDocuments: UploadedDoc[];
  onUpload: (documentType: string) => void;
  locale: string;
}

export function DocumentChecklist({
  requiredDocuments,
  uploadedDocuments,
  onUpload,
  locale,
}: DocumentChecklistProps) {
  const localeKey = locale === 'hi' ? 'hi' : 'en';

  function getStatus(docType: string) {
    const uploaded = uploadedDocuments.find((d) => d.type === docType);
    if (!uploaded) return 'not_started';
    if (uploaded.extractionStatus === 'completed') return 'extracted';
    if (uploaded.extractionStatus === 'processing') return 'processing';
    return 'uploaded';
  }

  const LABELS: Record<string, string> = {
    passport: 'Passport',
    photo: 'Passport Photo',
    bank_statement: 'Bank Statement',
    employer_letter: 'Employer Letter',
    cover_letter: 'Cover Letter',
    travel_insurance: 'Travel Insurance',
    flight_reservation: 'Flight Reservation',
    hotel_reservation: 'Hotel Booking',
    other: 'Other Document',
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
      <div className="space-y-1">
        {requiredDocuments.filter((d) => d.required).map((doc) => {
          const status = getStatus(doc.documentType);
          const isComplete = status === 'extracted' || status === 'uploaded';
          const desc = doc.description[localeKey as keyof typeof doc.description] ?? doc.description.en;

          return (
            <button
              key={doc.documentType}
              onClick={() => onUpload(doc.documentType)}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0">
                {isComplete ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : status === 'processing' ? (
                  <FileText size={18} className="text-yellow-600" />
                ) : (
                  <Upload size={18} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {LABELS[doc.documentType] ?? doc.documentType}
                </p>
                <p className="text-xs text-gray-500 truncate">{desc}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {status === 'not_started' && 'Upload'}
                {status === 'processing' && 'Processing...'}
                {status === 'uploaded' && 'Uploaded'}
                {status === 'extracted' && 'Done'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
