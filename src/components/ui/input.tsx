import * as React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <input
        className={`w-full px-4 py-3 border rounded-md text-sm bg-white placeholder-gray-400 outline-none transition-colors ${
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-gray-200 focus:border-black'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export function TextArea({ error, className = '', ...props }: TextAreaProps) {
  return (
    <div className="space-y-1">
      <textarea
        className={`w-full px-4 py-3 border rounded-md text-sm bg-white placeholder-gray-400 outline-none transition-colors resize-none ${
          error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-black'
        } ${className}`}
        rows={4}
        {...props}
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}
