'use client';

interface ProgressBarProps {
  documentsUploaded: number;
  documentsRequired: number;
  formFieldsFilled: number;
  formFieldsTotal: number;
}

export function ProgressBar({
  documentsUploaded,
  documentsRequired,
  formFieldsFilled,
  formFieldsTotal,
}: ProgressBarProps) {
  const total = documentsRequired + formFieldsTotal;
  const completed = documentsUploaded + formFieldsFilled;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Overall progress</span>
        <span className="font-semibold">{percent}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{documentsUploaded} of {documentsRequired} documents</span>
        <span>{formFieldsFilled} of {formFieldsTotal} fields</span>
      </div>
    </div>
  );
}
