'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function QualityCheckPage() {
  const router = useRouter();
  const { locale } = useParams();

  useEffect(() => {
    // Check if we have an application ID stored from the onboarding flow
    const applicationId = localStorage.getItem('visaagent_application_id');
    if (applicationId) {
      router.replace(`/${locale}/application/${applicationId}`);
    } else {
      // No application — go to landing
      router.replace(`/${locale}`);
    }
  }, [router, locale]);

  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-sm text-gray-500">Redirecting...</p>
    </div>
  );
}
