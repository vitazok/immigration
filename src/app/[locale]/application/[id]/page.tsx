import { setRequestLocale } from 'next-intl/server';
import { ApplicationDashboard } from '@/components/application/dashboard';

export default async function ApplicationPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(locale);

  return <ApplicationDashboard applicationId={id} />;
}
