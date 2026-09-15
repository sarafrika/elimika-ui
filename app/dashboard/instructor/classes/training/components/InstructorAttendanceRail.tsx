'use client';

import { Check, Clock3, Users } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import Spinner from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

export type AttendanceStudent = {
  uuid: string;
  name: string;
  initials: string;
  imageUrl?: string;
  status: AttendanceStatus;
  checked_in_at?: Date | null;
};

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'UNMARKED';

const statusTone: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-success',
  LATE: 'bg-warning',
  ABSENT: 'bg-destructive',
  EXCUSED: 'bg-info',
  UNMARKED: 'bg-muted-foreground/40',
};

export function InstructorAttendanceRail({
  roster,
  canAdmit,
  onAdmit,
  onEvaluate,
  onOpenRegister,
  pendingStudentId,
  isPending,
}: {
  roster: AttendanceStudent[];
  pendingStudentId?: string;
  isPending?: boolean;
  canAdmit: boolean;
  onAdmit: (studentUuid: string) => void;
  onEvaluate: (studentUuid: string) => void;
  onOpenRegister: () => void;
}) {
  const admitted = roster.filter(
    student => student.status === 'PRESENT' || student.status === 'LATE'
  );
  const awaiting = roster.filter(student => student.status === 'UNMARKED');

  const studentRow = (student: AttendanceStudent, showAdmit: boolean) => (
    <div
      key={student.uuid}
      className='border-border/60 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 last:border-b-0'
    >
      <div className='relative shrink-0'>
        <Avatar className='border-border bg-muted h-9 w-9 border'>
          {student.imageUrl && <AvatarImage src={student.imageUrl} alt={student.name} />}
          <AvatarFallback className='text-xs font-semibold'>{student.initials}</AvatarFallback>
        </Avatar>
        <span
          className={`border-background absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 ${statusTone[student.status]}`}
          aria-hidden='true'
        />
      </div>
      <div className='min-w-0'>
        <p className='text-foreground truncate text-sm font-semibold'>{student.name}</p>
        <p className='text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]'>
          {student.checked_in_at ? <Clock3 className='h-3 w-3' /> : null}
          {student.status}
        </p>
      </div>
      {showAdmit ? (
        <Button
          type='button'
          size='sm'
          className='h-8 px-3 text-xs'
          disabled={!canAdmit}
          onClick={() => onAdmit(student.uuid)}
          aria-label={`Admit ${student.name}`}
        >
          {isPending && pendingStudentId === student.uuid && <Spinner />}
          Admit
        </Button>
      ) : (
        <div className='flex items-center gap-2'>
          <Check className='text-success h-4 w-4 shrink-0' aria-label='Admitted' />
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='h-8 px-3 text-xs'
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
    <aside className='border-border bg-background flex min-h-0 w-full flex-col border-l'>
      <div className='border-border border-b px-4 py-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <h2 className='text-foreground flex items-center gap-2 text-sm font-bold'>
              <Users className='text-primary h-4 w-4' />
              Class register
            </h2>
            <p className='text-muted-foreground mt-1 text-xs'>
              {roster.length} expected · {admitted.length} admitted
            </p>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-8 shrink-0 text-xs'
            onClick={onOpenRegister}
          >
            Full register
          </Button>
        </div>
      </div>

      <ScrollArea className='max-h-[36rem] min-h-0 flex-1'>
        {!roster.length && <EmptyState title='No students enrolled in this session' />}
        <section>
          <div className='bg-muted/50 flex items-center justify-between px-4 py-2.5'>
            <h3 className='text-muted-foreground text-[10px] font-bold uppercase'>
              Awaiting admission
            </h3>
            <span className='text-foreground text-xs font-semibold'>{awaiting.length}</span>
          </div>
          {awaiting.length > 0 ? (
            awaiting.map(student => studentRow(student, true))
          ) : (
            <p className='text-muted-foreground px-4 py-5 text-xs'>Everyone has been marked.</p>
          )}
        </section>

        <section className='border-border border-t'>
          <div className='bg-muted/50 flex items-center justify-between px-4 py-2.5'>
            <h3 className='text-muted-foreground text-[10px] font-bold uppercase'>In class</h3>
            <span className='text-foreground text-xs font-semibold'>{admitted.length}</span>
          </div>
          {admitted.length > 0 ? (
            admitted.map(student => studentRow(student, false))
          ) : (
            <p className='text-muted-foreground px-4 py-5 text-xs'>No students admitted yet.</p>
          )}
        </section>
        {roster.some(student => student.status === 'ABSENT' || student.status === 'EXCUSED') && (
          <section className='border-border border-t'>
            <h3 className='bg-muted/50 text-muted-foreground px-4 py-2.5 text-[10px] font-bold uppercase'>
              Absent / excused
            </h3>
            {roster
              .filter(student => student.status === 'ABSENT' || student.status === 'EXCUSED')
              .map(student => studentRow(student, true))}
          </section>
        )}
      </ScrollArea>
    </aside>
  );
}
