import React from 'react';

interface CourseTagProps {
  code: string;
  label: string;
  color: string;
  bgColor: string;
  active?: boolean;
  onClick?: () => void;
}

export function CourseTag({ code, label, color, bgColor, active, onClick }: CourseTagProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-background text-foreground hover:bg-muted'
      } `}
    >
      {code && (
        <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${bgColor} ${color}`}>
          {code}
        </span>
      )}
      {label}
    </button>
  );
}
