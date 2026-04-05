import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

// Routes that require authentication (quality check needs complete data)
const isProtectedRoute = createRouteMatcher([
  '/:locale/quality-check(.*)',
  '/:locale/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    await auth().protect();
  }

  // Skip i18n rewriting for API routes — they don't need locale prefixes
  if (req.nextUrl.pathname.startsWith('/api')) {
    return;
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files. API routes excluded — auth handled via getAuth() in route handlers.
    '/((?!_next|api|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
