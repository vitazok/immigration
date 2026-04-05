import * as React from 'react';

interface BadgeProps {
  variant?: 'default' | 'high' | 'medium' | 'low';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    high: 'bg-green-50 text-green-700 border border-green-200',
    medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
