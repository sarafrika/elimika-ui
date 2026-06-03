"use client";

import { BarChart2 } from "lucide-react";

interface PlaceholderTabProps {
  tabName: string;
}

export function PlaceholderTab({ tabName }: PlaceholderTabProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <BarChart2 className="w-6 h-6 text-primary" />
      </div>

      <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">
        {tabName}
      </h2>

      <p className="text-sm text-muted-foreground max-w-xs">
        This report section is under construction. Check back soon for detailed analytics.
      </p>
    </div>
  );
}