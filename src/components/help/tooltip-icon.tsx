'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface TooltipIconProps {
  tooltipKey: string;
  consulateId: string;
}

export function TooltipIcon({ tooltipKey, consulateId }: TooltipIconProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchTooltip() {
    if (text !== null) {
      setOpen(!open);
      return;
    }
    setLoading(true);
    try {
      // Tooltip text is served from static consulate data — no API call needed
      // In production this would call /api/knowledge/tooltip?key=...&consulate=...
      const res = await fetch(
        `/api/knowledge/tooltip?key=${encodeURIComponent(tooltipKey)}&consulate=${consulateId}&locale=en`
      );
      const data = (await res.json()) as { data?: { text: string } };
      setText(data.data?.text ?? 'No tooltip available.');
    } catch {
      setText('Help text unavailable.');
    } finally {
      setLoading(false);
      setOpen(true);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={fetchTooltip}
        className="text-gray-300 hover:text-gray-500 transition-colors"
        aria-label="Help"
      >
        <HelpCircle size={13} />
      </button>

      {open && (
        <div className="absolute z-10 left-0 top-5 w-64 bg-gray-50 border border-gray-200 rounded-md p-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-gray-700 leading-relaxed">
              {loading ? 'Loading…' : text}
            </p>
            <button onClick={() => setOpen(false)} className="flex-shrink-0 text-gray-400 hover:text-black">
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
