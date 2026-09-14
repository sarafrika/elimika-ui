'use client';

import { Check, Clock3, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "EXCUSED"
  | "UNMARKED";

const statusTone: Record<any["status"], string> = {
  PRESENT: "bg-success",
  LATE: "bg-warning",
  ABSENT: "bg-destructive",
  EXCUSED: "bg-info",
  UNMARKED: "bg-muted-foreground/40",
};

export function InstructorAttendanceRail({
  roster,
  canAdmit,
  onAdmit,
  onEvaluate,
  onOpenRegister,
}: {
  roster: any[];
  canAdmit: boolean;
  onAdmit: (studentUuid: string) => void;
  onEvaluate: (studentUuid: string) => void;
  onOpenRegister: () => void;
}) {
  const admitted = roster.filter(
    (student) => student.status === "PRESENT" || student.status === "LATE",
  );
  const awaiting = roster.filter((student) => student.status === "UNMARKED");

  const studentRow = (student: any, showAdmit: boolean) => (
    <div
      key={student.uuid}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
    >
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9 border border-border bg-muted">
          <AvatarFallback className="text-xs font-semibold">
            {student.initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${statusTone[student.status]}`}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{student.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          {student.checked_in_at ? <Clock3 className="h-3 w-3" /> : null}
          {student.status}
        </p>
      </div>
      {showAdmit ? (
        <Button
          type="button"
          size="sm"
          className="h-8 px-3 text-xs"
          disabled={!canAdmit}
          onClick={() => onAdmit(student.uuid)}
          aria-label={`Admit ${student.name}`}
        >
          Admit
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-success" aria-label="Admitted" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs"
            onClick={() => onEvaluate(student.uuid)}
            aria-label={`Evaluate ${student.name}`}
          >
            Evaluate
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-border bg-background">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Class register
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {roster.length} expected · {admitted.length} admitted
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 text-xs" onClick={onOpenRegister}>
            Full register
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <section>
          <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5">
            <h3 className="text-[10px] font-bold uppercase text-muted-foreground">Awaiting admission</h3>
            <span className="text-xs font-semibold text-foreground">{awaiting.length}</span>
          </div>
          {awaiting.length > 0 ? (
            awaiting.map((student) => studentRow(student, true))
          ) : (
            <p className="px-4 py-5 text-xs text-muted-foreground">Everyone has been marked.</p>
          )}
        </section>

        <section className="border-t border-border">
          <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5">
            <h3 className="text-[10px] font-bold uppercase text-muted-foreground">In class</h3>
            <span className="text-xs font-semibold text-foreground">{admitted.length}</span>
          </div>
          {admitted.length > 0 ? (
            admitted.map((student) => studentRow(student, false))
          ) : (
            <p className="px-4 py-5 text-xs text-muted-foreground">No students admitted yet.</p>
          )}
        </section>
      </ScrollArea>
    </aside>
  );
}
