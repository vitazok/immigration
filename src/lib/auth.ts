import { NextRequest } from 'next/server';
import { verifyToken } from '@clerk/nextjs/server';
import { env } from '@/lib/env';

/**
 * Extract Clerk userId from request without requiring clerkMiddleware.
 * API routes are excluded from the middleware matcher (to avoid i18n rewriting),
 * so we verify the session token directly from cookies/headers.
 * Returns null if not authenticated (anonymous access allowed for some routes).
 */
export async function getClerkUserId(req: NextRequest): Promise<string | null> {
  try {
    // Clerk stores session token in __session cookie
    const token = req.cookies.get('__session')?.value;
    if (!token) return null;

    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    return payload.sub ?? null;
  } catch {
    return null;
  }
}
