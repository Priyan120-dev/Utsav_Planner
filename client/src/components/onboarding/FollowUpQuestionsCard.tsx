import React from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';

interface FollowUpQuestionsCardProps {
  followUpQuestions: string[];
  followUpAnswers: Record<number, string>;
  onAnswerChange: (index: number, answer: string) => void;
  onReparse: () => void;
  isParsingAi: boolean;
}

export const FollowUpQuestionsCard: React.FC<FollowUpQuestionsCardProps> = ({
  followUpQuestions,
  followUpAnswers,
  onAnswerChange,
  onReparse,
  isParsingAi
}) => {
  if (followUpQuestions.length === 0) return null;

  const hasAnyAnswer = Object.values(followUpAnswers).some((a) => a && a.trim());

  return (
    <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
      <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-amber-900">
        <HelpCircle className="w-4 h-4 text-amber-600" />
        <span>AI Orchestrator Clarification Questions (Optional):</span>
      </div>
      <div className="space-y-3">
        {followUpQuestions.map((q, idx) => (
          <div key={idx} className="text-xs">
            <p className="font-medium text-amber-900 mb-1">{q}</p>
            <input
              type="text"
              placeholder="Your answer (optional)..."
              value={followUpAnswers[idx] || ''}
              onChange={(e) => onAnswerChange(idx, e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-amber-300 focus:ring-1 focus:ring-utsav-saffron-500"
            />
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex justify-end">
        <button
          type="button"
          onClick={onReparse}
          disabled={isParsingAi || !hasAnyAnswer}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-utsav-saffron-600 text-white hover:bg-utsav-saffron-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isParsingAi ? 'Re-parsing with AI...' : 'Re-parse with Clarifications'}</span>
        </button>
      </div>
    </div>
  );
};
