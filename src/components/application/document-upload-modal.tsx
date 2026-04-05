'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';

interface DocumentUploadModalProps {
  documentType: string;
  applicantId: string | null;
  onClose: () => void;
  onUploadComplete: () => void;
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

export function DocumentUploadModal({
  documentType,
  applicantId,
  onClose,
  onUploadComplete,
}: DocumentUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!applicantId) {
      setError('Please sign in to upload documents.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicantId', applicantId);
      formData.append('type', documentType);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onUploadComplete();
        onClose();
      }, 1000);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Upload {LABELS[documentType] ?? documentType}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {success ? (
          <p className="text-sm text-green-600 font-semibold">Uploaded successfully!</p>
        ) : (
          <div
            className="border-2 border-dashed border-gray-200 rounded-md p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 size={24} className="mx-auto text-gray-400 animate-spin" />
            ) : (
              <Upload size={24} className="mx-auto text-gray-400" />
            )}
            <p className="mt-2 text-sm text-gray-600">
              {uploading ? 'Uploading...' : 'Click to select a file'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG, or WebP — max 10MB</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
