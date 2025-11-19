'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GuardianShareScope } from '@/services/guardian';
import Link from 'next/link';
import { BellRing } from 'lucide-react';

interface AttendanceEntry {
  id: string;
  date: string;
  status: string;
  note?: string;
}

interface GuardianAttendancePanelProps {
  shareScope: GuardianShareScope;
  entries?: AttendanceEntry[];
}

export function GuardianAttendancePanel({
  shareScope,
  entries = [],
}: GuardianAttendancePanelProps) {
  const isAttendanceOnly = shareScope === 'ATTENDANCE';

  return (
    <Card className='border-border/70'>
      <CardHeader className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            <BellRing className='size-4' />
            Attendance & communications
          </CardTitle>
          <p className='text-muted-foreground text-sm'>
            Stay on top of check-ins, excuses, and announcements.
          </p>
        </div>
        {isAttendanceOnly && (
          <Badge variant='outline' className='uppercase tracking-wide'>
            Attendance-only scope
          </Badge>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        {entries.length ? (
          entries.slice(0, 5).map(entry => (
            <div key={entry.id} className='rounded-2xl border border-border/60 p-3 text-sm'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span className='font-medium'>{entry.date}</span>
                <Badge variant={entry.status === 'Present' ? 'success' : 'warning'}>
                  {entry.status}
                </Badge>
              </div>
              {entry.note ? (
                <p className='text-muted-foreground mt-2 text-xs'>{entry.note}</p>
              ) : null}
            </div>
          ))
        ) : (
          <div className='rounded-2xl border border-dashed border-border/60 p-4 text-sm'>
            <p className='font-medium'>No attendance activity yet.</p>
            <p className='text-muted-foreground'>
              When the instructor publishes attendance or announcements, they will appear here with
              time stamps.
            </p>
          </div>
        )}
        <Button asChild variant='secondary' className='w-full'>
          <Link href='/dashboard/attendance'>Open attendance center</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
