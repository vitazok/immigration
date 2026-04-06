import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { AbstractIntlMessages } from 'next-intl';

// Supported locales — add 'zh-CN' here when ready (and add src/messages/zh-CN/)
export const locales = ['en', 'hi'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  // Merge all namespace files into a single messages object
  const namespaces = ['common', 'intake', 'documents', 'form', 'quality', 'help', 'journey'];
  const messages: AbstractIntlMessages = {};

  for (const ns of namespaces) {
    try {
      const nsMessages = (await import(`./messages/${locale}/${ns}.json`)) as { default: AbstractIntlMessages };
      messages[ns] = nsMessages.default;
    } catch {
      // Namespace file missing — skip (non-fatal during development)
      console.warn(`[i18n] Missing translation file: ${locale}/${ns}.json`);
    }
  }

  return { messages };
});
