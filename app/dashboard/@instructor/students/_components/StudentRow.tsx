import { MoreVertical } from "lucide-react";

import { Student } from "../types";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

import { Button } from "@/components/ui/button";

interface StudentRowProps {
  student: Student;
}

export function StudentRow({ student }: any) {
  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      {/* Student */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-8 min-h-8 rounded-full bg-primary/50 flex items-center justify-center text-xs font-semibold text-white uppercase">
            {student.student?.full_name?.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {student.student?.full_name}
            </p>
            <p className="text-xs text-muted-foreground">
              ID: {student.student?.uuid.slice(0, 8)}
            </p>
          </div>
        </div>
      </td>

      {/* Courses */}
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="text-sm font-medium text-foreground space-y-0.5 max-w-[180px]">
          {(student.courses ?? [])
            .map((c: any) => c?.name)
            .filter(Boolean)
            .map((name: string, i: number) => (
              <p key={i} className="truncate">
                {name}
              </p>
            ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {(student.classes ?? []).length} classes
        </p>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <StatusBadge status="Enrolled" />
      </td>

      {/* Progress */}
      <td className="py-3 px-4 hidden md:table-cell">
        <ProgressBar value={0} />
      </td>

      {/* Progress */}
      <td className="py-3 px-4 hidden md:table-cell">
        Ksh {0}
      </td>

      {/* Progress */}
      <td className="py-3 px-4 hidden md:table-cell">
        {"01/01/1980"}
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`More options for ${student.student?.full_name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}