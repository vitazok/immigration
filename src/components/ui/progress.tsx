interface ProgressProps {
  value: number; // 0–100
  label?: string;
}

export function Progress({ value, label }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
