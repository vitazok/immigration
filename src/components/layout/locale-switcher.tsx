'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n';

const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  hi: 'हि',
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    // Replace the current locale prefix in the pathname
    const segments = pathname.split('/');
    segments[1] = newLocale; // segments[0] is '' (before the first /)
    router.push(segments.join('/'));
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            l === locale
              ? 'text-black font-semibold'
              : 'text-gray-400 hover:text-black'
          }`}
        >
          {LOCALE_LABELS[l] ?? l}
        </button>
      ))}
    </div>
  );
}
