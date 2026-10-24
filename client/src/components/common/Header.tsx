import React from 'react';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { useEvent } from '../../context/EventContext.js';

interface HeaderProps {
  onOpenSomethingChanged: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSomethingChanged }) => {
  const { eventState, loadDemoEvent, resetEvent, isLoading } = useEvent();

  return (
    <header className="bg-white border-b border-utsav-cream-200 sticky top-0 z-40 shadow-xs">
      {/* WCAG 2.1 AA Skip to Content Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-utsav-saffron-500 to-utsav-marigold-500 flex items-center justify-center text-xl shadow-md text-white select-none">
            🪔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-utsav-cream-900 font-display">
                Utsav Planner
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-utsav-saffron-100 text-utsav-saffron-800 tracking-wide uppercase">
                AI Orchestrator
              </span>
            </div>
            <p className="text-xs text-utsav-cream-800">
              GenAI celebration & event planning assistant for Indian celebrations
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          {eventState ? (
            <>
              <button
                type="button"
                onClick={onOpenSomethingChanged}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-utsav-saffron-50 text-utsav-saffron-800 hover:bg-utsav-saffron-100 border border-utsav-saffron-200 transition-colors focus-visible:ring-2 focus-visible:ring-utsav-saffron-600 cursor-pointer"
                title="Update budget, date or guests mid-flight without restarting"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-utsav-saffron-600" aria-hidden="true" />
                <span>Something Changed</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset your celebration plan and start fresh?')) {
                    resetEvent();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-utsav-cream-800 hover:text-red-700 hover:bg-red-50 border border-utsav-cream-200 transition-colors cursor-pointer"
                title="Clear current plan and start over"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={loadDemoEvent}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-utsav-saffron-600 to-utsav-marigold-600 text-white shadow-xs hover:from-utsav-saffron-700 hover:to-utsav-marigold-700 transition-all focus-visible:ring-2 focus-visible:ring-utsav-saffron-600 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isLoading ? 'Generating Live Demo...' : 'Load Demo Event'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
