import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

import { useRouter } from "next/navigation";
import type { StudentRosterEntry } from "../types";

interface StudentRowProps {
  student: StudentRosterEntry;
}

export function StudentRow({ student }: StudentRowProps) {
  const router = useRouter()
  const classCount = student.classes.length;
  const courseCount = student.courses.length;
  const joinedDate = student.profile?.created_date
    ? new Date(student.profile.created_date)
    : null;

  return (
    <tr
      onClick={() =>
        router.push(
          `/dashboard/students/${student?.student?.user_uuid}?sId=${student?.student?.uuid}`
        )
      }
      className="cursor-pointer border-b border-border hover:bg-muted/40 transition-colors"
    >
      {/* Student */}
      <td className="py-3 px-2">
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
      <td className="py-3 px-2 hidden sm:table-cell">
        <div className="text-sm font-medium text-foreground space-y-0.5 ">
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
      <td className="py-3 items-center">
        <StatusBadge status={student.status} />
      </td>

      {/* Progress */}
      <td className="py-3 px-2 hidden md:table-cell">
        <ProgressBar value={student.progress} />
      </td>


      {/* Joined date */}
      <td className="py-3 px-4 hidden md:table-cell">
        {joinedDate && !isNaN(joinedDate.getTime())
          ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(joinedDate)
          : "—"}
      </td>

    </tr>
  );
}
