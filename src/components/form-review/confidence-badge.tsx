interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
  showDot?: boolean;
}

const LABELS: Record<string, string> = {
  high: 'High confidence',
  medium: 'Please verify',
  low: 'Needs review',
};

const DOT_COLORS: Record<string, string> = {
  high: 'bg-confidence-high',
  medium: 'bg-confidence-medium',
  low: 'bg-confidence-low',
};

const BADGE_STYLES: Record<string, string> = {
  high: 'bg-green-50 text-green-700 border border-green-200',
  medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  low: 'bg-red-50 text-red-700 border border-red-200',
};

export function ConfidenceBadge({ level, showDot = true }: ConfidenceBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${BADGE_STYLES[level]}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[level]}`} />}
      {LABELS[level]}
    </span>
  );
}
