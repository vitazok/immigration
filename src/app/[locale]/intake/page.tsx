'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { IntakeWizard } from '@/components/intake/wizard';
import { FaqDrawer } from '@/components/help/faq-drawer';
import { ChatWidget } from '@/components/help/chat-widget';

export default function IntakePage() {
  const t = useTranslations('intake');
  const locale = useLocale();

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>
      <IntakeWizard locale={locale} />
      <FaqDrawer step="intake" consulateId="FR_NEW_DELHI" />
      <ChatWidget currentStep="intake" />
    </div>
  );
}
