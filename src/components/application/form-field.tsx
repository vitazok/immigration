'use client';

import { HelpCircle } from 'lucide-react';

interface FormFieldProps {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'select';
  options?: string[];
  source?: 'extraction' | 'manual' | null;
  placeholder?: string;
  helpText?: string;
}

export function FormField({
  fieldKey,
  label,
  value,
  onChange,
  type = 'text',
  options,
  source,
  placeholder,
  helpText,
}: FormFieldProps) {
  const borderClass =
    source === 'extraction'
      ? 'border-l-2 border-l-green-600'
      : source === 'manual' && value
        ? 'border-l-2 border-l-yellow-500'
        : '';

  const inputBase =
    'w-full px-4 py-3 border border-gray-200 rounded-md text-sm bg-white placeholder-gray-400 outline-none transition-colors focus:border-black';

  return (
    <div className={`space-y-1.5 pl-3 ${borderClass}`}>
      <div className="flex items-center gap-1.5">
        <label htmlFor={fieldKey} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {helpText && (
          <span className="group relative">
            <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 rounded-md bg-gray-100 px-3 py-2 text-xs text-gray-700 shadow-sm z-10">
              {helpText}
            </span>
          </span>
        )}
      </div>

      {type === 'select' && options ? (
        <select
          id={fieldKey}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputBase}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldKey}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputBase}
        />
      )}
    </div>
  );
}
