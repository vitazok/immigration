import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import type { QualityCheckResult } from '@/lib/types/quality';

export async function GET(
  _req: NextRequest,
  { params }: { params: { applicantId: string } }
) {
  try {
    const record = await prisma.qualityCheckResult.findFirst({
      where: { applicantId: params.applicantId },
      orderBy: { checkedAt: 'desc' },
    });

    if (!record) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'No quality check found for this applicant' } },
        { status: 404 }
      );
    }

    const result: QualityCheckResult = {
      applicationId: record.applicantId,
      checkedAt: record.checkedAt.toISOString(),
      overallScore: record.overallScore,
      riskLevel: record.riskLevel as QualityCheckResult['riskLevel'],
      blockers: JSON.parse(record.blockersJson),
      warnings: JSON.parse(record.warningsJson),
      recommendations: JSON.parse(record.recommendationsJson),
    };

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('[quality/report]', err);
    return NextResponse.json(
      { error: { code: 'REPORT_FAILED', message: 'Failed to retrieve quality report' } },
      { status: 500 }
    );
  }
}
