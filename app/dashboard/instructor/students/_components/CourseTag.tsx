import React from "react";

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
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap
        ${
          active
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background text-foreground hover:bg-muted"
        }
      `}
    >
      {code && (
        <span
          className={`text-xs font-bold px-1.5 py-0.5 rounded ${bgColor} ${color}`}
        >
          {code}
        </span>
      )}
      {label}
    </button>
  );
}
