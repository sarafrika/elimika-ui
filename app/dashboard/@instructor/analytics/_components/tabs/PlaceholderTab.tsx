"use client";

import { BarChart2 } from "lucide-react";

interface PlaceholderTabProps {
  tabName: string;
}

export function PlaceholderTab({ tabName }: PlaceholderTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <BarChart2 className="w-6 h-6 text-blue-400" />
      </div>
      <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">{tabName}</h2>
      <p className="text-sm text-gray-400 max-w-xs">
        This report section is under construction. Check back soon for detailed analytics.
      </p>
    </div>
  );
}
