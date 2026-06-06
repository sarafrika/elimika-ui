import { Student } from "../types";
import { Avatar } from "./Avatar";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: any) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar
            initials={student.student?.initials}
            colorClass={student.student?.avatarColor}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {student.student?.full_name}
            </p>
            <p className="text-xs text-muted-foreground">
              ID: {student.student?.uuid}
            </p>
          </div>
        </div>

        <StatusBadge status="Enrolled" />
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Courses</span>
          <p className="text-foreground font-medium">
            {(student.courses ?? [])
              .map((c: any) => c?.name)
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>

        <div>
          <span className="text-muted-foreground">Classes</span>
          <p className="text-foreground font-medium">
            {(student.classes ?? []).length}
          </p>
        </div>

        <div>
          <span className="text-muted-foreground">Progress</span>
          <ProgressBar value={0} />
        </div>
      </div>
    </div>
  );
}
