'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface FaqDrawerProps {
  step: string;
  consulateId: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export function FaqDrawer({ step, consulateId }: FaqDrawerProps) {
  const t = useTranslations('help');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && faqs.length === 0) {
      loadFaqs();
    }
  }, [open]);

  async function loadFaqs() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/knowledge/faqs?step=${encodeURIComponent(step)}&consulate=${consulateId}&locale=${locale}`
      );
      const data = (await res.json()) as { data?: FAQ[] };
      setFaqs(data.data ?? []);
    } catch {
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAQ trigger button — fixed bottom-left on mobile, sidebar on desktop */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 sm:left-6 z-20 flex items-center gap-1.5 text-xs bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm hover:border-black transition-colors"
      >
        <HelpCircle size={13} />
        FAQ
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-30 flex justify-end" onClick={() => setOpen(false)}>
          <div
            className="bg-white w-full sm:w-96 h-full sm:h-auto sm:absolute sm:right-0 sm:top-0 shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold">{t('faq.title')}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              {loading && (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}
                </div>
              )}

              {!loading && faqs.length === 0 && (
                <p className="text-sm text-gray-400">{t('faq.noFaqs')}</p>
              )}

              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-md overflow-hidden">
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium">{faq.question}</p>
                    {expandedIndex === i ? <ChevronUp size={14} className="flex-shrink-0 text-gray-400" /> : <ChevronDown size={14} className="flex-shrink-0 text-gray-400" />}
                  </button>
                  {expandedIndex === i && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
