"use client";

import { Calendar, ChevronDown, Filter } from "lucide-react";

export function HeaderBar() {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold leading-tight text-foreground sm:text-xl lg:text-2xl">
          Training Delivery Tracker - Report
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          Comprehensive overview of training delivery performance and progress
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Picker */}
        <button className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs shadow-sm transition-colors hover:bg-muted sm:text-sm">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="whitespace-nowrap text-foreground">
            May 1 - May 31, 2025
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>

        {/* All Programs */}
        <button className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs shadow-sm transition-colors hover:bg-muted sm:text-sm">
          <span className="text-foreground">All Programs</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>

        {/* All Locations */}
        <button className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs shadow-sm transition-colors hover:bg-muted sm:text-sm">
          <span className="text-foreground">All Locations</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>

        {/* Filters */}
        <button className="flex items-center gap-1.5 rounded-sm border border-primary bg-background px-2.5 py-1.5 text-xs text-primary shadow-sm transition-colors hover:bg-primary/10 sm:text-sm">
          <Filter className="h-3.5 w-3.5 shrink-0" />
          <span>Filters</span>
        </button>

        {/* Export */}
        {/* <button className="flex items-center gap-1.5 rounded-sm border border-primary bg-background px-2.5 py-1.5 text-xs text-primary shadow-sm transition-colors hover:bg-primary/10 sm:text-sm">
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span>Export</span>
        </button> */}
      </div>
    </div>
  );
}