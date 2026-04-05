import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/:locale/intake(.*)',
  '/:locale/documents(.*)',
  '/:locale/form-review(.*)',
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
    // Skip Next.js internals, static files, and API routes
    '/((?!_next|api|trpc|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
