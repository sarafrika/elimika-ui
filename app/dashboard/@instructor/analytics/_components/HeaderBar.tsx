"use client";

import { Calendar, ChevronDown, Download, Filter } from "lucide-react";

export function HeaderBar() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      {/* Title */}
      <div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight">
          Training Delivery Tracker - Report
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Comprehensive overview of training delivery performance and progress
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Picker */}
        <button className="flex items-center gap-1.5 border border-border rounded-lg px-2.5 py-1.5 text-xs sm:text-sm hover:bg-muted transition-colors shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className=" whitespace-nowrap">May 1 - May 31, 2025</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>

        {/* All Programs */}
        <button className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white hover:bg-gray-50 transition-colors shadow-sm">
          <span className="text-gray-700">All Programs</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </button>

        {/* All Locations */}
        <button className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white hover:bg-gray-50 transition-colors shadow-sm">
          <span className="text-gray-700">All Locations</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </button>

        {/* Filters */}
        <button className="flex items-center gap-1.5 border border-blue-500 text-blue-500 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white hover:bg-blue-50 transition-colors shadow-sm">
          <Filter className="w-3.5 h-3.5 shrink-0" />
          <span>Filters</span>
        </button>

        {/* Export */}
        <button className="flex items-center gap-1.5 border border-blue-500 text-blue-500 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white hover:bg-blue-50 transition-colors shadow-sm">
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
