import { MoreVertical } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

import { Button } from "@/components/ui/button";
import type { StudentRosterEntry } from "../types";

interface StudentRowProps {
  student: StudentRosterEntry;
}

export function StudentRow({ student }: StudentRowProps) {
  const classCount = student.classes.length;
  const courseCount = student.courses.length;
  const joinedDate = student.profile?.created_date;

  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      {/* Student */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`min-w-8 min-h-8 rounded-full flex items-center justify-center text-xs font-semibold uppercase ${student.student.avatarColor}`}
          >
            {student.student.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {student.student.full_name}
            </p>
            <p className="text-xs text-muted-foreground">
              ID: {student.student.uuid.slice(0, 8)}
            </p>
          </div>
        </div>
      </td>

      {/* Courses */}
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="text-sm font-medium text-foreground space-y-0.5 max-w-[180px]">
          {student.courses
            .map((c) => c?.name)
            .filter(Boolean)
            .map((name, i) => (
              <p key={i} className="truncate">
                {name}
              </p>
            ))}
        </div>

        <p className="text-xs text-muted-foreground space-x-1">
          {courseCount} {courseCount === 1 ? "course" : "courses"} •{"  "}
          {classCount} {classCount === 1 ? "class" : "classes"}
        </p>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <StatusBadge status={student.status} />
      </td>

      {/* Progress */}
      <td className="py-3 px-4 hidden md:table-cell">
        <ProgressBar value={student.progress} />
      </td>

      {/* Progress */}
      <td className="py-3 px-4 hidden md:table-cell">
        Ksh {student.walletBalance.toLocaleString()}
      </td>

      {/* Progress */}
      <td className="py-3 px-4 hidden md:table-cell">
        {joinedDate
          ? new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(joinedDate)
          : "—"}
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`More options for ${student.student.full_name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
