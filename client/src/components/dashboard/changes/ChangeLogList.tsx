import React from 'react';
import { ChangeLogEntry } from '@utsav/shared';
import { History, RotateCcw } from 'lucide-react';

interface ChangeLogListProps {
  changeLog: ChangeLogEntry[];
  onUndoLastChange: () => void;
}

export const ChangeLogList: React.FC<ChangeLogListProps> = ({ changeLog, onUndoLastChange }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-utsav-cream-200 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-utsav-cream-900 flex items-center gap-2">
        <History className="w-4 h-4 text-utsav-saffron-600" />
        <span>ChangeLog Audit Trail ({changeLog.length} events)</span>
      </h3>

      <div className="space-y-3">
        {changeLog.map((entry, index) => (
          <div
            key={entry.id}
            className="p-3.5 rounded-xl border border-utsav-cream-200 bg-utsav-cream-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-utsav-cream-900 capitalize">
                  {entry.fieldChanged === 'custom' ? 'Plan Event' : `Changed ${entry.fieldChanged}`}
                </span>
                <span className="text-[10px] text-utsav-cream-800">
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}{' '}
                  &bull; {new Date(entry.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-utsav-cream-800">{entry.impactSummary}</p>
              <span className="text-[11px] text-utsav-cream-800 italic block">
                Reason: {entry.reason}
              </span>
            </div>

            {index === 0 && changeLog.length > 1 && (
              <button
                type="button"
                onClick={onUndoLastChange}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 cursor-pointer flex-shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
