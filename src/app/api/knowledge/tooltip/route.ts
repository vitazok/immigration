import { NextRequest, NextResponse } from 'next/server';
import { getTooltip } from '@/lib/knowledge/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key') ?? '';
  const consulate = searchParams.get('consulate') ?? 'FR_NEW_DELHI';
  const locale = searchParams.get('locale') ?? 'en';

  try {
    const text = getTooltip(consulate, key, locale);
    return NextResponse.json({ data: { text } });
  } catch (err) {
    return NextResponse.json({ data: { text: null } });
  }
}
