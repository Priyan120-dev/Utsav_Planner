import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DisclaimerBadgeProps {
  className?: string;
  customText?: string;
}

export const DisclaimerBadge: React.FC<DisclaimerBadgeProps> = ({
  className = '',
  customText = 'Estimate, not a verified vendor price'
}) => {
  return (
    <div
      role="note"
      aria-label="Planning disclaimer"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80 shadow-sm ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" aria-hidden="true" />
      <span>{customText}</span>
    </div>
  );
};
