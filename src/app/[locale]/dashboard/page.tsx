import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, FileText, Upload, CheckCircle, ClipboardList } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const { userId } = await auth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const steps = [
    { href: `/${locale}/intake`, label: 'Application interview', desc: 'Complete the intake questionnaire', icon: ClipboardList, status: 'active' },
    { href: `/${locale}/documents`, label: 'Document upload', desc: 'Upload and verify your documents', icon: Upload, status: 'pending' },
    { href: `/${locale}/form-review`, label: 'Form review', desc: 'Review and approve the filled form', icon: FileText, status: 'pending' },
    { href: `/${locale}/quality-check`, label: 'Quality check', desc: 'AI review of your complete package', icon: CheckCircle, status: 'pending' },
  ];

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Your application</h1>
        <p className="text-gray-500 mt-1">France tourist visa — Embassy of France, New Delhi</p>
      </div>

      <div className="space-y-3">
        {steps.map(({ href, label, desc, icon: Icon, status }, i) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 border border-gray-200 rounded-md p-4 hover:border-black transition-colors group"
          >
            <div className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md text-gray-400 group-hover:border-black group-hover:text-black transition-colors">
              <Icon size={16} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-gray-500 text-xs">{desc}</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
          </Link>
        ))}
      </div>

      <div className="border border-gray-200 rounded-md p-4 text-sm text-gray-500 space-y-1">
        <p className="font-medium text-gray-900">Processing time</p>
        <p>15–30 business days after VFS submission.</p>
        <p>Apply at least 4–6 weeks before your travel date (8 weeks during April–July).</p>
      </div>
    </div>
  );
}
