import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss, onRetry }) => {
  return (
    <div
      role="alert"
      className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 shadow-xs flex items-start justify-between gap-3 my-4"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-semibold text-red-950">Action could not be completed</h4>
          <p className="text-xs text-red-800 mt-0.5">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-xs font-semibold underline hover:text-red-950 cursor-pointer"
            >
              Try again
            </button>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-700 hover:text-red-900 p-1 rounded-md cursor-pointer"
          aria-label="Dismiss error notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
