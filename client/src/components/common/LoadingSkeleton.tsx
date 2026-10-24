import React from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  label?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className = '',
  label = 'AI is orchestrating your event details...'
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-6 bg-white rounded-2xl border border-utsav-cream-200 shadow-xs space-y-4 animate-pulse ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-utsav-saffron-100 flex items-center justify-center text-sm">
          ✨
        </div>
        <div>
          <div className="h-4 w-48 bg-utsav-cream-200 rounded-md"></div>
          <span className="sr-only">{label}</span>
          <p className="text-xs text-utsav-cream-800 mt-1">{label}</p>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-utsav-cream-100 rounded-md"
            style={{ width: `${100 - (i * 15)}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};
