'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Progress } from '@/components/ui/progress';
import { QuestionCard } from './question-card';
import type { IntakeQuestion } from '@/lib/llm/prompts/intake';

interface WizardProps {
  locale: string;
}

export function IntakeWizard({ locale }: WizardProps) {
  const t = useTranslations('intake');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<IntakeQuestion | null>(null);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startSession();
  }, []);

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/intake/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      const data = (await res.json()) as {
        data?: { sessionId: string; firstQuestion: IntakeQuestion; progress: number };
        error?: { message: string };
      };
      if (data.error) throw new Error(data.error.message);
      if (data.data) {
        setSessionId(data.data.sessionId);
        setQuestion(data.data.firstQuestion);
        setProgress(data.data.progress);
        localStorage.setItem('visaagent_session_id', data.data.sessionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(answer: unknown) {
    if (!sessionId || !question) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/intake/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId: question.field, answer }),
      });
      const data = (await res.json()) as {
        data?: { nextQuestion: IntakeQuestion | null; progress: number; isComplete: boolean };
        error?: { message: string };
      };
      if (data.error) throw new Error(data.error.message);
      if (data.data) {
        setQuestion(data.data.nextQuestion);
        setProgress(data.data.progress);
        setIsComplete(data.data.isComplete);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !question) {
    return <div className="space-y-4 animate-pulse"><div className="h-4 bg-gray-100 rounded w-3/4" /><div className="h-12 bg-gray-100 rounded" /></div>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={startSession} className="text-sm underline underline-offset-2">Retry</button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-6">
        <Progress value={100} label={t('progress.label')} />
        <div className="border border-gray-200 rounded-md p-6 space-y-3">
          <h2 className="font-semibold">{t('complete.title')}</h2>
          <p className="text-gray-500 text-sm">{t('complete.subtitle')}</p>
          <a href="./documents" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-900 transition-colors">
            {t('complete.cta')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Progress value={progress} label={t('progress.label')} />
      {question && (
        <QuestionCard
          question={question}
          onAnswer={submitAnswer}
          loading={loading}
        />
      )}
    </div>
  );
}
