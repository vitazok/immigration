import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  // Redirect to landing page — the application dashboard at /application/[id] is now the main view
  redirect(`/${locale}`);
}
