import { getTranslations, setRequestLocale } from 'next-intl/server';
import { VisaFinder } from '@/components/onboarding/visa-finder';

export default async function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <div className="max-w-md mx-auto px-6 py-16 space-y-10">
      {/* Hero */}
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t('app.tagline')}</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          AI-powered visa application assistant. Upload documents, auto-fill forms, check for issues before you submit.
        </p>
      </section>

      {/* Visa Finder */}
      <section>
        <VisaFinder />
      </section>

      {/* Scope note */}
      <p className="text-xs text-gray-400 text-center">
        Currently supporting Indian applicants → France tourist visa. More countries coming soon.
      </p>

      <p className="text-xs text-gray-400 text-center">{t('app.disclaimer')}</p>
    </div>
  );
}
