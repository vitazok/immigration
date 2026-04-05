'use client';

import { useTranslations } from 'next-intl';
import { FormReviewPanel } from '@/components/form-review/field-row';
import { FaqDrawer } from '@/components/help/faq-drawer';
import { ChatWidget } from '@/components/help/chat-widget';

export default function FormReviewPage() {
  const t = useTranslations('form');

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>
      <FormReviewPanel />
      <FaqDrawer step="form-review" consulateId="FR_NEW_DELHI" />
      <ChatWidget currentStep="form-review" />
    </div>
  );
}
