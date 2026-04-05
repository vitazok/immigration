'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { IntakeQuestion } from '@/lib/llm/prompts/intake';

interface QuestionCardProps {
  question: IntakeQuestion;
  onAnswer: (answer: unknown) => void;
  loading?: boolean;
}

export function QuestionCard({ question, onAnswer, loading }: QuestionCardProps) {
  const [value, setValue] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [multiValues, setMultiValues] = useState<string[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (question.inputType === 'multiselect') {
      onAnswer(multiValues);
    } else if (question.inputType === 'boolean') {
      onAnswer(value === 'true');
    } else if (question.inputType === 'number') {
      onAnswer(parseFloat(value));
    } else {
      onAnswer(value);
    }
  }

  return (
    <div className="border border-gray-200 rounded-md p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold">{question.text}</p>
          {question.helpText && (
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="flex-shrink-0 text-gray-400 hover:text-black transition-colors"
              aria-label="Help"
            >
              <HelpCircle size={16} />
            </button>
          )}
        </div>

        {showHelp && question.helpText && (
          <div className="text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2">
            {question.helpText}
          </div>
        )}

        {question.validationHint && (
          <p className="text-xs text-gray-400">{question.validationHint}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Text / Date / Number */}
        {(question.inputType === 'text' || question.inputType === 'date' || question.inputType === 'number') && (
          <Input
            type={question.inputType === 'date' ? 'date' : question.inputType === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={question.inputType === 'date' ? 'YYYY-MM-DD' : 'Type your answer…'}
            required={question.required}
            autoFocus
          />
        )}

        {/* Boolean */}
        {question.inputType === 'boolean' && (
          <div className="flex gap-3">
            {['true', 'false'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setValue(opt)}
                className={`flex-1 py-3 rounded-md border text-sm font-medium transition-colors ${
                  value === opt ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {opt === 'true' ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        )}

        {/* Select */}
        {question.inputType === 'select' && question.options && (
          <div className="space-y-2">
            {question.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setValue(opt)}
                className={`w-full text-left px-4 py-3 rounded-md border text-sm transition-colors ${
                  value === opt ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Multiselect */}
        {question.inputType === 'multiselect' && question.options && (
          <div className="space-y-2">
            {question.options.map((opt) => {
              const selected = multiValues.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMultiValues((prev) => selected ? prev.filter((v) => v !== opt) : [...prev, opt])}
                  className={`w-full text-left px-4 py-3 rounded-md border text-sm transition-colors ${
                    selected ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Submit — only show for non-boolean and non-select types that require explicit submission */}
        {(question.inputType === 'text' || question.inputType === 'date' || question.inputType === 'number' || question.inputType === 'multiselect') && (
          <Button
            type="submit"
            loading={loading}
            disabled={question.required && !value && multiValues.length === 0}
            className="w-full"
          >
            Continue
          </Button>
        )}

        {/* Boolean and single-select auto-submit handled by button clicks */}
        {(question.inputType === 'boolean' || question.inputType === 'select') && value && (
          <Button type="submit" loading={loading} className="w-full">
            Continue
          </Button>
        )}

        {!question.required && (
          <button
            type="button"
            onClick={() => onAnswer(null)}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip
          </button>
        )}
      </form>
    </div>
  );
}
