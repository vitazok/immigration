import { z } from 'zod';
import type { IntakeQuestion } from '@/lib/llm/prompts/intake';

// Zod schema for validating LLM-returned questions
export const IntakeQuestionSchema = z.object({
  id: z.string(),
  field: z.string(),
  text: z.string(),
  helpText: z.string(),
  inputType: z.enum(['text', 'date', 'select', 'multiselect', 'boolean', 'number']),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  validationHint: z.string().optional(),
});

export const NextQuestionResponseSchema = z.object({
  nextQuestion: IntakeQuestionSchema.nullable(),
  isComplete: z.boolean(),
  progressPercent: z.number().min(0).max(100),
  consulateId: z.string().nullable(),
  riskFlags: z.array(z.string()),
});

export type NextQuestionResponse = z.infer<typeof NextQuestionResponseSchema>;

// Static question bank for fields that don't need LLM reasoning
// Used as fallback and for fast initial questions
export const STATIC_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'trip_main_destination',
    field: 'trip.mainDestination',
    text: 'Which country are you primarily visiting?',
    helpText: 'Select the Schengen country where you will spend the most time.',
    inputType: 'select',
    options: ['France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Other Schengen country'],
    required: true,
  },
  {
    id: 'trip_arrival_date',
    field: 'trip.arrivalDate',
    text: 'What is your intended arrival date in France?',
    helpText: 'This must match your flight reservation exactly.',
    inputType: 'date',
    required: true,
    validationHint: 'Format: YYYY-MM-DD. You can apply up to 6 months before this date.',
  },
  {
    id: 'trip_departure_date',
    field: 'trip.departureDate',
    text: 'What is your intended departure date from France?',
    helpText: 'This must match your return flight reservation exactly.',
    inputType: 'date',
    required: true,
  },
  {
    id: 'trip_purpose',
    field: 'trip.purpose',
    text: 'What is the main purpose of your visit?',
    helpText: 'Select the option that best describes why you are travelling.',
    inputType: 'select',
    options: ['Tourism / Leisure', 'Visiting family or friends', 'Business', 'Cultural / Sports event', 'Medical treatment', 'Study', 'Transit', 'Other'],
    required: true,
  },
  {
    id: 'trip_entries_requested',
    field: 'trip.entriesRequested',
    text: 'How many entries do you need?',
    helpText: 'Single entry is sufficient for most tourist trips. Choose multiple only if you plan to enter/exit France more than once.',
    inputType: 'select',
    options: ['Single entry', 'Double entry', 'Multiple entries'],
    required: true,
  },
];

export function parseAnswer(answer: unknown, question: IntakeQuestion): unknown {
  switch (question.inputType) {
    case 'boolean':
      return answer === 'true' || answer === true;
    case 'number':
      return typeof answer === 'string' ? parseFloat(answer) : answer;
    case 'date':
      // Normalize to YYYY-MM-DD
      if (typeof answer === 'string') {
        const d = new Date(answer);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      }
      return answer;
    default:
      return answer;
  }
}
