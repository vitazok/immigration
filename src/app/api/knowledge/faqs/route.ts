import { NextRequest, NextResponse } from 'next/server';
import { getFaqsForStep } from '@/lib/knowledge/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const step = searchParams.get('step') ?? '';
  const consulate = searchParams.get('consulate') ?? 'FR_NEW_DELHI';
  const locale = searchParams.get('locale') ?? 'en';

  try {
    const faqs = getFaqsForStep(consulate, step, locale);
    return NextResponse.json({ data: faqs });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
