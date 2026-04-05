'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('common');

  return (
    <footer className="border-t border-gray-100 mt-16">
      <div className="max-w-4xl mx-auto px-6 py-8 text-xs text-gray-400 space-y-1">
        <p>{t('app.disclaimer')}</p>
        <p>© {new Date().getFullYear()} {t('app.name')} · flufex.com</p>
      </div>
    </footer>
  );
}
