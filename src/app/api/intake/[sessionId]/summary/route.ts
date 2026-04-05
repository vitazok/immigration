import { NextRequest, NextResponse } from 'next/server';
import { getIntakeSummary } from '@/lib/intake/session';
import { getDocumentChecklist } from '@/lib/knowledge/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const summary = await getIntakeSummary(sessionId);

    let checklist: ReturnType<typeof getDocumentChecklist> = [];
    if (summary.consulateId) {
      checklist = getDocumentChecklist(summary.consulateId);
    }

    return NextResponse.json({
      data: {
        applicant: summary.applicant,
        trip: summary.trip,
        consulateId: summary.consulateId,
        checklist,
        riskAssessment: summary.riskAssessment,
      },
    });
  } catch (err) {
    console.error('[intake/summary]', err);
    return NextResponse.json(
      { error: { code: 'SUMMARY_FAILED', message: 'Failed to retrieve intake summary' } },
      { status: 500 }
    );
  }
}
