"use client";

import { OverviewSidebar } from "./_components/OverviewSidebar";
import { StudentTable } from "./_components/StudentTable";

export default function StudentsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto p-4 sm:p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Main content */}
          <StudentTable />

          {/* Right sidebar */}
          <OverviewSidebar />
        </div>
      </div>
    </div>
  );
}
