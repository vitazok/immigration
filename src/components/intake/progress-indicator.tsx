interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

export function ProgressIndicator({ currentStep, totalSteps, label }: ProgressIndicatorProps) {
  const clamped = Math.min(totalSteps, Math.max(1, currentStep));

  return (
    <div className="flex items-center justify-between text-sm text-gray-500">
      <span>
        {label ?? `Step ${clamped} of ${totalSteps}`}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 w-6 rounded-full transition-colors ${
              i < clamped ? 'bg-black' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
