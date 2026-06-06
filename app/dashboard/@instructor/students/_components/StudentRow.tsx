import { MoreVertical } from "lucide-react";

import { Student } from "../types";
import { Avatar } from "./Avatar";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

import { Button } from "@/components/ui/button";

interface StudentRowProps {
  student: Student;
}

export function StudentRow({ student }: StudentRowProps) {
  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      {/* Student */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar
            initials={student.initials}
            colorClass={student.avatarColor}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {student.name}
            </p>
            <p className="text-xs text-muted-foreground">
              ID: {student.id}
            </p>
          </div>
        </div>
      </td>

      {/* Course / Class */}
      <td className="py-3 px-4 hidden sm:table-cell">
        <p className="text-sm font-medium text-foreground">
          {student.course}
        </p>
        <p className="text-xs text-muted-foreground">
          {student.schedule}
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

      {/* Skills Wallet */}
      <td className="py-3 px-4 hidden lg:table-cell">
        <span className="text-sm text-foreground">
          {student.skillsWallet}
        </span>
      </td>

      {/* Joined */}
      <td className="py-3 px-4 hidden xl:table-cell">
        <span className="text-sm text-muted-foreground">
          {student.joined}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`More options for ${student.name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}