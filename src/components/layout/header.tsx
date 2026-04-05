'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { LocaleSwitcher } from './locale-switcher';

export function Header() {
  const t = useTranslations('common');
  const locale = useLocale();

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-semibold text-black tracking-tight">
          {t('app.name')}
        </Link>

        <div className="flex items-center gap-4">
          <LocaleSwitcher />

          <SignedIn>
            <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
              <Link href={`/${locale}/dashboard`} className="hover:text-black transition-colors">
                {t('nav.dashboard')}
              </Link>
            </nav>
            <UserButton afterSignOutUrl={`/${locale}`} />
          </SignedIn>

          <SignedOut>
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/sign-in`}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                href={`/${locale}/sign-up`}
                className="text-sm bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-900 transition-colors"
              >
                {t('nav.signUp')}
              </Link>
            </div>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
