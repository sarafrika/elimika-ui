"use client";

import { useState } from "react";
import { CompletionByProgram } from "./_components/charts/CompletionByProgram";
import { PerformanceChart } from "./_components/charts/PerformanceChart";
import { StatusBreakdown } from "./_components/charts/StatusBreakdown";
import { DetailedMetrics } from "./_components/DetailedMetrics";
import { HeaderBar } from "./_components/HeaderBar";
import { KPIRow } from "./_components/KPIRow";
import { SatisfactionDistribution } from "./_components/SatisfactionDistribution";
import { SessionTable, SessionTableSummary } from "./_components/SessionTable";
import { TabNav } from "./_components/TabNav";
import { PlaceholderTab } from "./_components/tabs/PlaceholderTab";
import { TopLocations } from "./_components/TopLocations";

const TABS = [
  "Overview",
  "Session Report",
  "Program Report",
  "Instructor Report",
  "Participant Report",
  "Location Report",
  "Trend Report",
  "Custom Report",
];

export default function InstructorAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="min-h-screen font-sans">
      <div className="w-full mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <HeaderBar />

        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "Overview" && (
          <div className="space-y-4 sm:space-y-5">
            <KPIRow />

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[280px]">
                <PerformanceChart />
              </div>
              <div className="flex-1 min-w-[260px]">
                <CompletionByProgram />
              </div>
              <div className="w-full lg:w-auto lg:min-w-[220px] xl:min-w-[240px]">
                <StatusBreakdown />
              </div>
            </div>

            <SessionTableSummary />

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[240px]">
                <TopLocations />
              </div>
              <div className="flex-1 min-w-[240px]">
                <SatisfactionDistribution />
              </div>
            </div>

            <DetailedMetrics />
          </div>
        )}

        {activeTab === "Session Report" && <div>
          <SessionTable />
        </div>}


        {activeTab === "Program Report" && <div>
          <PlaceholderTab tabName={activeTab} />
        </div>}

        {activeTab === "Instructor Report" && <div>
          <PlaceholderTab tabName={activeTab} />
        </div>}

        {activeTab === "Participant Report" && <div>
          <PlaceholderTab tabName={activeTab} />
        </div>}

        {activeTab === "Location Report" && <div>
          <PlaceholderTab tabName={activeTab} />
        </div>}

        {activeTab === "Trend Report" && <div>
          <PlaceholderTab tabName={activeTab} />
        </div>}

        {activeTab === "Custom Report" && <div>
          <PlaceholderTab tabName={activeTab} />
        </div>}

        {/* Footer */}
        <div className="mt-6 flex flex-wrap justify-between items-center text-xs text-muted-foreground gap-2 border-t border-border pt-4">
          <span>All times are in EAT (UTC +3)</span>
          <span>Data last updated: May 20, 2025 10:30 AM</span>
        </div>
      </div>
    </div>
  );
}
