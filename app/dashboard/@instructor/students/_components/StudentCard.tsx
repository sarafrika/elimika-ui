import { Student } from "../types";
import { Avatar } from "./Avatar";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar initials={student.initials} colorClass={student.avatarColor} />
          <div>
            <p className="text-sm font-semibold text-foreground">{student.name}</p>
            <p className="text-xs text-muted-foreground">ID: {student.id}</p>
          </div>
        </div>
        <StatusBadge status={student.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-muted-foreground">Course</span>
          <p className="text-foreground font-medium">{student.course}</p>
          <p className="text-muted-foreground">{student.schedule}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Wallet</span>
          <p className="text-foreground font-medium">{student.skillsWallet}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Joined</span>
          <p className="text-foreground font-medium">{student.joined}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Progress</p>
        <ProgressBar value={student.progress} />
      </div>
    </div>
  );
}
