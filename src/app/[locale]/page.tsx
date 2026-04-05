import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, FileText, Upload, CheckCircle, MessageCircle } from 'lucide-react';

export default async function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-16">
      {/* Hero */}
      <section className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight">{t('app.tagline')}</h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          Prepare your complete Schengen visa application in under 2 hours.
          AI-guided interview, automatic document extraction, pre-filled forms.
        </p>
        <div className="flex gap-3">
          <Link
            href={`/${locale}/intake`}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-900 transition-colors"
          >
            Get started <ArrowRight size={16} />
          </Link>
          <Link
            href={`/${locale}/sign-in`}
            className="inline-flex items-center gap-2 bg-white border border-black text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
        <p className="text-xs text-gray-400">{t('app.disclaimer')}</p>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">How it works</h2>
        <div className="space-y-4">
          {[
            { icon: MessageCircle, step: '1', title: '10-minute interview', desc: 'Answer simple questions about your trip, background, and finances.' },
            { icon: Upload, step: '2', title: 'Upload documents', desc: 'Passport, bank statement, employer letter. AI extracts data automatically.' },
            { icon: FileText, step: '3', title: 'Review your form', desc: 'Pre-filled Schengen application form with confidence indicators. Edit any field.' },
            { icon: CheckCircle, step: '4', title: 'Quality check & download', desc: 'AI reviews your complete package for common refusal triggers before you submit.' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-sm font-semibold text-gray-500">
                {step}
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scope */}
      <section className="border border-gray-200 rounded-md p-6 space-y-3">
        <p className="font-semibold text-sm text-gray-900">Currently supported</p>
        <p className="text-sm text-gray-600">
          Indian applicants → France (Type C tourist visa) → Embassy of France, New Delhi via VFS Global.
        </p>
        <p className="text-xs text-gray-400">More countries coming soon.</p>
      </section>
    </div>
  );
}
