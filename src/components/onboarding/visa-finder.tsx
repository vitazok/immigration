'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { RecommendationCard } from './recommendation-card';
import type { VisaRecommendation } from '@/lib/types/application';

const NATIONALITIES = [
  { value: 'IND', label: 'India' },
] as const;

const DESTINATIONS = [
  { value: 'FRA', label: 'France' },
] as const;

const PURPOSES = [
  { value: 'tourism', label: 'Tourism / Leisure' },
  { value: 'visiting_family', label: 'Visit family or friends' },
  { value: 'business', label: 'Business' },
  { value: 'cultural', label: 'Cultural / Sports event' },
  { value: 'medical', label: 'Medical treatment' },
  { value: 'study', label: 'Study' },
  { value: 'transit', label: 'Transit' },
] as const;

export function VisaFinder() {
  const router = useRouter();
  const { locale } = useParams();
  const [nationality, setNationality] = useState('IND');
  const [destination, setDestination] = useState('FRA');
  const [purpose, setPurpose] = useState('tourism');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    applicationId: string;
    recommendation: VisaRecommendation;
  } | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/application/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationality, destination, purpose }),
      });

      const json = await res.json();
      if (json.error) {
        setError(json.error.message);
        return;
      }

      setResult({
        applicationId: json.data.applicationId,
        recommendation: json.data.recommendation,
      });
    } catch {
      setError('Failed to find visa options. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleStart() {
    if (result) {
      localStorage.setItem('visaagent_application_id', result.applicationId);
      router.push(`/${locale}/application/${result.applicationId}`);
    }
  }

  if (result) {
    return (
      <RecommendationCard
        recommendation={result.recommendation}
        onStart={handleStart}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">I am a citizen of</span>
          <select
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="mt-1 block w-full border border-gray-200 rounded-md py-3 px-4 text-base focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
          >
            {NATIONALITIES.map((n) => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Traveling to</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="mt-1 block w-full border border-gray-200 rounded-md py-3 px-4 text-base focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
          >
            {DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Purpose of visit</span>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="mt-1 block w-full border border-gray-200 rounded-md py-3 px-4 text-base focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
          >
            {PURPOSES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Finding your visa...
          </>
        ) : (
          <>
            Find my visa <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
