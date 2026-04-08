'use client';

import { useState } from 'react';
import OverviewTab from '@/components/dashboard/OverviewTab';
import FlagshipTab from '@/components/dashboard/FlagshipTab';
import QueueView from '@/components/dashboard/QueueView';
import PerformanceTab from '@/components/dashboard/PerformanceTab';
import CoverageView from '@/components/dashboard/CoverageView';
import HealthReportTab from '@/components/dashboard/HealthReportTab';

const TABS = [
  { id: 'health-report', label: 'Health Report' },
  { id: 'overview', label: 'Overview' },
  { id: 'flagships', label: 'Flagship Topics' },
  { id: 'queue', label: 'Queue' },
  { id: 'performance', label: 'Performance' },
  { id: 'coverage', label: 'Coverage' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<TabId>('health-report');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          LoreAI Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Flagship-topic engine &middot; pipeline health &middot; content performance
        </p>
      </header>

      {/* Tab navigation */}
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border pb-px">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === tab.id
                ? 'bg-surface text-foreground border-b-2 border-accent'
                : 'text-muted hover:text-foreground hover:bg-surface/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className="min-h-[50vh]">
        {activeTab === 'health-report' && <HealthReportTab />}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'flagships' && <FlagshipTab />}
        {activeTab === 'queue' && <QueueView />}
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'coverage' && <CoverageView />}
      </div>
    </div>
  );
}
