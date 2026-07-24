import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const FilterChipRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex gap-2 overflow-x-auto pb-2 scrollbar-hide",
      className,
    )}
    {...props}
  />
));
FilterChipRow.displayName = "FilterChipRow";

export interface FilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ className, active = false, type = "button", children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      data-active={active ? "true" : "false"}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary font-semibold text-primary-foreground shadow-sm ring-2 ring-primary ring-offset-2"
          : "border-border bg-card font-medium text-foreground hover:bg-muted",
        className,
      )}
      {...props}
    >
      {active && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  ),
);
FilterChip.displayName = "FilterChip";
