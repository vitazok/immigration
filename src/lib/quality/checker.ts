import { z } from 'zod';
import { MODELS, generateStructured } from '@/lib/llm/client';
import { buildQualityCheckPrompt } from '@/lib/llm/prompts/quality';
import { runRuleBasedChecks } from './rules';
import { getConsulate } from '@/lib/knowledge/queries';
import { prisma } from '@/lib/db/client';
import type { ApplicantProfile } from '@/lib/types/applicant';
import type { TripDetails } from '@/lib/types/trip';
import type { DocumentUpload } from '@/lib/types/documents';
import type { QualityCheckResult, QualityIssue } from '@/lib/types/quality';

const QualityIssueSchema = z.object({
  code: z.string(),
  category: z.enum(['completeness', 'consistency', 'financial', 'travel_logic', 'document_quality']),
  severity: z.enum(['blocker', 'warning', 'recommendation']),
  title: z.object({ en: z.string(), hi: z.string() }),
  description: z.object({ en: z.string(), hi: z.string() }),
  affectedFields: z.array(z.number()),
  suggestedAction: z.object({ en: z.string(), hi: z.string() }),
});

const LLMQualityResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high']),
  blockers: z.array(QualityIssueSchema),
  warnings: z.array(QualityIssueSchema),
  recommendations: z.array(QualityIssueSchema),
});

export async function runQualityCheck(
  applicantId: string,
  applicant: Partial<ApplicantProfile>,
  trip: Partial<TripDetails>,
  documents: DocumentUpload[],
  consulateId: string
): Promise<QualityCheckResult> {
  const consulate = getConsulate(consulateId);

  // Step 1: Fast rule-based checks
  const ruleResults = runRuleBasedChecks(applicant, trip, documents, consulate);

  // Step 2: LLM semantic checks (catches inconsistencies rules can't)
  let llmResults: { blockers: QualityIssue[]; warnings: QualityIssue[]; recommendations: QualityIssue[] } = {
    blockers: [],
    warnings: [],
    recommendations: [],
  };

  try {
    const llmResult = await generateStructured<z.infer<typeof LLMQualityResultSchema>>({
      model: MODELS.sonnet,
      system: 'You are a senior Schengen visa officer reviewing applications. Return only valid JSON.',
      messages: [
        {
          role: 'user',
          content: buildQualityCheckPrompt(applicant, trip, documents, consulate),
        },
      ],
      maxTokens: 2048,
      schema: (raw) => LLMQualityResultSchema.parse(raw),
    });

    llmResults = {
      blockers: llmResult.blockers,
      warnings: llmResult.warnings,
      recommendations: llmResult.recommendations,
    };
  } catch (err) {
    console.error('[quality] LLM check failed, using rule-based results only:', err);
  }

  // Merge: deduplicate by code
  const existingCodes = new Set([
    ...ruleResults.blockers.map((i) => i.code),
    ...ruleResults.warnings.map((i) => i.code),
    ...ruleResults.recommendations.map((i) => i.code),
  ]);

  const mergedBlockers = [
    ...ruleResults.blockers,
    ...llmResults.blockers.filter((i) => !existingCodes.has(i.code)),
  ];
  const mergedWarnings = [
    ...ruleResults.warnings,
    ...llmResults.warnings.filter((i) => !existingCodes.has(i.code)),
  ];
  const mergedRecommendations = [
    ...ruleResults.recommendations,
    ...llmResults.recommendations.filter((i) => !existingCodes.has(i.code)),
  ];

  // Compute overall score
  const blockerPenalty = mergedBlockers.length * 25;
  const warningPenalty = mergedWarnings.length * 5;
  const overallScore = Math.max(0, 100 - blockerPenalty - warningPenalty);

  const riskLevel: 'low' | 'medium' | 'high' =
    mergedBlockers.length > 0 ? 'high' : mergedWarnings.length > 2 ? 'medium' : 'low';

  const result: QualityCheckResult = {
    applicationId: applicantId,
    checkedAt: new Date().toISOString(),
    overallScore,
    riskLevel,
    blockers: mergedBlockers,
    warnings: mergedWarnings,
    recommendations: mergedRecommendations,
  };

  // Persist to database
  await prisma.qualityCheckResult.upsert({
    where: { id: applicantId },
    create: {
      id: applicantId,
      applicantId,
      overallScore,
      riskLevel,
      blockersJson: JSON.stringify(mergedBlockers),
      warningsJson: JSON.stringify(mergedWarnings),
      recommendationsJson: JSON.stringify(mergedRecommendations),
    },
    update: {
      overallScore,
      riskLevel,
      blockersJson: JSON.stringify(mergedBlockers),
      warningsJson: JSON.stringify(mergedWarnings),
      recommendationsJson: JSON.stringify(mergedRecommendations),
      checkedAt: new Date(),
    },
  });

  return result;
}
