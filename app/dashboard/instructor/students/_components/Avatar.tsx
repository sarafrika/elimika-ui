import React from "react";

interface AvatarProps {
  initials: string;
  colorClass: string;
  size?: "sm" | "md";
}

export function Avatar({ initials, colorClass, size = "md" }: AvatarProps) {
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-semibold shrink-0`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
