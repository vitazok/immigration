import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // Google Cloud Vision
  GOOGLE_CLOUD_VISION_API_KEY: z.string().min(1, 'GOOGLE_CLOUD_VISION_API_KEY is required'),

  // Cloudflare R2
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_BUCKET_NAME: z.string().min(1, 'R2_BUCKET_NAME is required'),
  R2_ENDPOINT: z.string().url('R2_ENDPOINT must be a valid URL'),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),

  // Stripe (skeleton — allowed to be placeholder at MVP)
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Missing or invalid environment variables:\n${missing}\n\nSee .env.example for reference.`);
  }
  return result.data;
}

// Lazy singleton — parsed on first access so the build doesn't crash when env vars are absent.
let _env: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (!_env) {
    _env = parseEnv();
  }
  return _env;
}

// Re-export as `env` for convenience — a getter-based proxy that defers parsing.
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop: string) {
    return getEnv()[prop as keyof z.infer<typeof envSchema>];
  },
});
