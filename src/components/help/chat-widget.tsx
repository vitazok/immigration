'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  currentStep: string;
}

export function ChatWidget({ currentStep }: ChatWidgetProps) {
  const t = useTranslations('help');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionId = typeof window !== 'undefined'
    ? (localStorage.getItem('visaagent_session_id') ?? `anon_${Date.now()}`)
    : `anon_${Date.now()}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          applicantId: null,
          currentStep,
          message: text,
          locale,
          recentMessages: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          applicationContext: {},
        }),
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      // Stream response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantText += chunk;
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: assistantText },
          ]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('chat.error') },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat toggle button — fixed bottom right */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-30 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-900 transition-colors"
        aria-label={open ? t('chat.close') : t('chat.open')}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 z-30 w-80 bg-white border border-gray-200 rounded-md shadow-lg flex flex-col" style={{ height: '420px' }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{t('chat.title')}</p>
              <p className="text-xs text-gray-400">{t('chat.disclaimer')}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-black transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Ask any question about your Schengen visa application.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                  msg.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-black'
                }`}>
                  {msg.content || (loading && msg.role === 'assistant' ? <span className="animate-pulse">…</span> : null)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={t('chat.placeholder')}
              className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-black transition-colors"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-md flex items-center justify-center disabled:opacity-40 hover:bg-gray-900 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
