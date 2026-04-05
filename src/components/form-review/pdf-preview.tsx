'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfPreviewProps {
  pdfUrl: string | null;
  loading?: boolean;
}

export function PdfPreview({ pdfUrl, loading }: PdfPreviewProps) {
  const t = useTranslations('form');
  const [iframeError, setIframeError] = useState(false);

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-md p-8 flex flex-col items-center justify-center gap-3 bg-gray-50 min-h-[400px]">
        <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">{t('preview.loading')}</p>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="border border-gray-200 rounded-md p-8 flex flex-col items-center justify-center gap-3 bg-gray-50 min-h-[400px]">
        <FileText size={32} className="text-gray-300" />
        <p className="text-sm text-gray-400">{t('preview.title')}</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <p className="text-sm font-semibold">{t('preview.title')}</p>
        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-black transition-colors flex items-center gap-1"
          >
            <ExternalLink size={12} />
            Open
          </a>
          <a
            href={pdfUrl}
            download
            className="text-xs text-gray-500 hover:text-black transition-colors flex items-center gap-1"
          >
            <Download size={12} />
            {t('actions.downloadPdf')}
          </a>
        </div>
      </div>

      {iframeError ? (
        <div className="p-8 flex flex-col items-center gap-3 bg-gray-50">
          <FileText size={32} className="text-gray-300" />
          <p className="text-sm text-gray-500">Preview not available in your browser.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(pdfUrl, '_blank')}
          >
            Open PDF in new tab
          </Button>
        </div>
      ) : (
        <iframe
          src={pdfUrl}
          title="Schengen application form preview"
          className="w-full h-[600px] bg-white"
          onError={() => setIframeError(true)}
        />
      )}
    </div>
  );
}
