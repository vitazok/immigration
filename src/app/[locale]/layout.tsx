import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import '../globals.css';

export const metadata: Metadata = {
  title: 'VisaAgent — Schengen Visa Assistant',
  description: 'Prepare your Schengen tourist visa application with AI guidance. Designed for Indian applicants.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-white text-black font-sans antialiased">
        <ClerkProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
