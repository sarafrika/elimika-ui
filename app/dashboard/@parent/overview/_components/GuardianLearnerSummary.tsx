'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GuardianShareScope } from '@/services/guardian';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { CalendarDays, FileDown } from 'lucide-react';

interface GuardianLearnerSummaryProps {
  studentName?: string;
  relationship?: string;
  gradeLevel?: string;
  shareScope?: GuardianShareScope;
  lastSyncedAt?: string;
}

const shareScopeDescriptions: Record<GuardianShareScope, string> = {
  FULL: 'Full academic & billing access',
  ACADEMICS: 'Academic progress only',
  ATTENDANCE: 'Attendance & announcements only',
};

export function GuardianLearnerSummary({
  studentName,
  relationship,
  gradeLevel,
  shareScope = 'FULL',
  lastSyncedAt,
}: GuardianLearnerSummaryProps) {
  const lastSyncedLabel =
    lastSyncedAt && !Number.isNaN(Date.parse(lastSyncedAt))
      ? formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })
      : null;

  return (
    <Card className='border-border/70'>
      <CardHeader className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <CardTitle className='text-2xl font-bold'>{studentName ?? 'Learner summary'}</CardTitle>
          <p className='text-muted-foreground text-sm'>
            {relationship ?? 'Parent portal access'}{' '}
            {gradeLevel ? (
              <>
                • <span className='text-foreground font-medium'>{gradeLevel}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <Badge variant='outline'>{shareScopeDescriptions[shareScope]}</Badge>
          {lastSyncedLabel ? (
            <Badge variant='secondary' className='capitalize'>
              Synced {lastSyncedLabel}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className='flex flex-wrap gap-3'>
        <Button asChild variant='outline' className='gap-2'>
          <Link href='/dashboard/attendance'>
            <CalendarDays className='size-4' />
            View attendance
          </Link>
        </Button>
        {shareScope !== 'ATTENDANCE' && (
          <Button asChild variant='ghost' className='gap-2'>
            <Link href='/dashboard/reports'>
              <FileDown className='size-4' />
              Download report card
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
