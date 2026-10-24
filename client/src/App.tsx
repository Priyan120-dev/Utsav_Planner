import React, { useState } from 'react';
import { useEvent } from './context/EventContext.js';
import { Header } from './components/common/Header.js';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard.js';
import { OverviewTab } from './components/dashboard/OverviewTab.js';
import { BudgetTab } from './components/dashboard/BudgetTab.js';
import { TimelineTab } from './components/dashboard/TimelineTab.js';
import { VendorsTab } from './components/dashboard/VendorsTab.js';
import { ChangesTab } from './components/dashboard/ChangesTab.js';
import { ErrorAlert } from './components/common/ErrorAlert.js';
import { LayoutDashboard, Wallet, CalendarClock, Store, GitCompare, X } from 'lucide-react';

export const App: React.FC = () => {
  const { eventState, error, clearError } = useEvent();
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'timeline' | 'vendors' | 'changes'>('overview');
  const [isSomethingChangedModalOpen, setIsSomethingChangedModalOpen] = useState<boolean>(false);

  const tabs = [
    { id: 'overview', label: 'Overview & Readiness', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget & Trade-offs', icon: Wallet },
    { id: 'timeline', label: 'Timeline & Tasks', icon: CalendarClock },
    { id: 'vendors', label: 'Vendors & Quotes', icon: Store },
    { id: 'changes', label: 'Changes & History', icon: GitCompare }
  ] as const;

  return (
    <div className="min-h-screen bg-utsav-cream-50 flex flex-col font-sans">
      {/* Header */}
      <Header onOpenSomethingChanged={() => setIsSomethingChangedModalOpen(true)} />

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error notification banner */}
        {error && <ErrorAlert message={error} onDismiss={clearError} />}

        {!eventState ? (
          /* Onboarding State */
          <OnboardingWizard />
        ) : (
          /* Dashboard State */
          <div className="space-y-6">
            {/* Navigation Tabs Bar */}
            <div className="bg-white rounded-2xl p-1.5 border border-utsav-cream-200 shadow-xs flex items-center justify-between overflow-x-auto scrollbar-none">
              <nav className="flex items-center gap-1 min-w-max" aria-label="Dashboard navigation tabs">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-utsav-saffron-600 text-white shadow-2xs'
                          : 'text-utsav-cream-800 hover:text-utsav-cream-900 hover:bg-utsav-cream-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-utsav-cream-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Orchestrator</span>
              </div>
            </div>

            {/* Active Tab Panel */}
            <div role="tabpanel" aria-label={activeTab}>
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'budget' && <BudgetTab />}
              {activeTab === 'timeline' && <TimelineTab />}
              {activeTab === 'vendors' && <VendorsTab />}
              {activeTab === 'changes' && <ChangesTab />}
            </div>
          </div>
        )}
      </main>

      {/* "Something Changed" Modal Triggered from Header */}
      {isSomethingChangedModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-change-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-utsav-cream-200 mb-6">
              <h2 id="modal-change-title" className="text-lg font-bold text-utsav-cream-900 font-display">
                Something Changed Mid-Planning
              </h2>
              <button
                type="button"
                onClick={() => setIsSomethingChangedModalOpen(false)}
                className="p-1 rounded-lg text-utsav-cream-800 hover:text-utsav-cream-900 hover:bg-utsav-cream-100 cursor-pointer"
                aria-label="Close change modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ChangesTab
              isOpenModal={true}
              onCloseModal={() => setIsSomethingChangedModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-utsav-cream-200 mt-12 py-6 text-center text-xs text-utsav-cream-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>🪔</span>
            <span className="font-bold text-utsav-cream-900 font-display">Utsav Planner</span>
            <span>&bull;</span>
            <span>GenAI Indian Celebration & Event Planning Assistant</span>
          </div>
          <div>
            Built with pure deterministic domain logic & Gemini API structured output
          </div>
        </div>
      </footer>
    </div>
  );
};
