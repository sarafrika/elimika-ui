'use client';

import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  GraduationCap,
  Mic,
  ShieldCheck,
  Trophy,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VerificationEventRecord } from './SkillsWalletShared';

type VerificationSource = 'assessment' | 'competition' | 'instructor_evaluation';
type VerificationStatus = 'verified' | 'pending' | 'failed';

const SOURCE_META: Record<VerificationSource, { title: string; desc: string; icon: LucideIcon; tint: string }> = {
  assessment: {
    title: 'Assessments',
    desc: 'Course exams and graded assignments',
    icon: FileCheck,
    tint: 'bg-primary/10 text-primary',
  },
  competition: {
    title: 'Competitions',
    desc: 'Hackathons, contests and rankings',
    icon: Trophy,
    tint: 'bg-success/10 text-success',
  },
  instructor_evaluation: {
    title: 'Instructor Evaluation',
    desc: 'Sign-off from your class instructor',
    icon: GraduationCap,
    tint: 'bg-warning/10 text-warning',
  },
};

const SOURCE_LABEL: Record<VerificationSource, string> = {
  assessment: 'Assessment',
  competition: 'Competition',
  instructor_evaluation: 'Instructor',
};

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function StatusBadge({ status }: { status: VerificationStatus }) {
  if (status === 'verified')
    return (
      <Badge className='border-0 bg-success/10 text-success'>
        <CheckCircle2 className='mr-1 h-3 w-3' /> Verified
      </Badge>
    );
  if (status === 'pending')
    return (
      <Badge className='border-0 bg-warning/10 text-warning'>
        <Clock className='mr-1 h-3 w-3' /> Pending
      </Badge>
    );
  return (
    <Badge className='border-0 bg-destructive/10 text-destructive'>
      <XCircle className='mr-1 h-3 w-3' /> Failed
    </Badge>
  );
}

type SkillsWalletVerificationTabProps = {
  events?: VerificationEventRecord[];
  title?: string;
  description?: string;
  autoUpdatedLabel?: string;
  onAddProof?: () => void;
};

export function SkillsWalletVerficationTab({
  events = [],
  title = 'Verification',
  description = 'Your Skills Wallet is automatically updated after course completion from three trusted sources.',
  autoUpdatedLabel = 'Auto-updated',
  onAddProof,
}: SkillsWalletVerificationTabProps) {
  const [filter, setFilter] = useState<'all' | VerificationSource>('all');
  const filteredEvents = filter === 'all' ? events : events.filter(e => e.source === filter);

  const sources = (Object.keys(SOURCE_META) as VerificationSource[]).map(key => {
    const meta = SOURCE_META[key];
    const items = events.filter(e => e.source === key);
    const verified = items.filter(e => e.status === 'verified').length;
    const latest = items[0];
    return {
      key,
      ...meta,
      count: verified,
      total: items.length,
      last: latest ? `${latest.title}${latest.change ? ' · ' + latest.change : ''} · ${fmtDate(latest.date)}` : 'No activity yet',
    };
  });

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <h2 className='text-xl font-semibold'>{title}</h2>
            <Badge className='border-0 bg-success/10 text-success'>
              <ShieldCheck className='mr-1 h-3 w-3' /> {autoUpdatedLabel}
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline'>
            <BadgeCheck className='mr-2 h-4 w-4' /> Request Review
          </Button>
          <Button className='bg-primary hover:bg-primary/90' onClick={onAddProof}>
            <Mic className='mr-2 h-4 w-4' /> Add Proof
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        {sources.map(s => (
          <Card key={s.key}>
            <CardContent className='p-5'>
              <div className='flex items-start justify-between'>
                <div className={`h-12 w-12 rounded-xl grid place-items-center ${s.tint}`}>
                  <s.icon className='h-6 w-6' />
                </div>
                <Badge variant='outline'>
                  {s.count}/{s.total} verified
                </Badge>
              </div>
              <p className='font-semibold mt-3'>{s.title}</p>
              <p className='text-xs text-muted-foreground mt-1'>{s.desc}</p>
              <div className='mt-3 rounded-md bg-muted p-3 text-xs'>
                <p className='text-muted-foreground uppercase tracking-wider text-[10px]'>Latest</p>
                <p className='text-foreground mt-0.5'>{s.last}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle className='text-base'>Verification Activity</CardTitle>
              <CardDescription>Every automatic update to your Skills Wallet, with source and evidence.</CardDescription>
            </div>
            <div className='flex flex-wrap items-center gap-1'>
                {([
                  ['all', 'All'],
                  ['assessment', 'Assessments'],
                  ['competition', 'Competitions'],
                  ['instructor_evaluation', 'Instructor'],
              ] as const).map(([key, label]) => (
                <Button
                  key={key}
                  size='sm'
                  variant={filter === key ? 'default' : 'outline'}
                  className={filter === key ? 'bg-primary hover:bg-primary/90' : ''}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm'>
              <thead className='bg-muted text-muted-foreground'>
                <tr>
                  <th className='text-left px-4 py-3 font-medium'>Source</th>
                  <th className='text-left px-4 py-3 font-medium'>Event</th>
                  <th className='text-left px-4 py-3 font-medium'>Skill</th>
                  <th className='text-left px-4 py-3 font-medium'>Change</th>
                  <th className='text-left px-4 py-3 font-medium'>Date</th>
                  <th className='text-left px-4 py-3 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className='px-4 py-6 text-center text-muted-foreground'>
                      No verification events yet.
                    </td>
                  </tr>
                )}
                {filteredEvents.map(e => (
                  <tr key={e.id} className='border-t hover:bg-muted'>
                    <td className='px-4 py-3'>
                      <Badge variant='outline'>{SOURCE_LABEL[e.source]}</Badge>
                    </td>
                    <td className='px-4 py-3 font-medium'>{e.title}</td>
                    <td className='px-4 py-3 text-muted-foreground'>{e.skill}</td>
                    <td className='px-4 py-3 text-muted-foreground'>{e.change}</td>
                    <td className='px-4 py-3 text-muted-foreground'>{fmtDate(e.date)}</td>
                    <td className='px-4 py-3'>
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>How verification works</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3 text-sm'>
          <div className='flex gap-3'>
            <div className='h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold'>
              1
            </div>
            <div>
              <p className='font-medium'>Complete a course activity</p>
              <p className='text-muted-foreground'>
                Submit an assessment, finish a competition, or wrap an instructor-led class.
              </p>
            </div>
          </div>
          <div className='flex gap-3'>
            <div className='h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold'>
              2
            </div>
            <div>
              <p className='font-medium'>Elimika verifies the outcome</p>
              <p className='text-muted-foreground'>
                Grades, rankings and instructor sign-off are cross-checked against your enrolment.
              </p>
            </div>
          </div>
          <div className='flex gap-3'>
            <div className='h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold'>
              3
            </div>
            <div>
              <p className='font-medium'>Wallet updates automatically</p>
              <p className='text-muted-foreground'>
                Skill levels, competencies and achievements are updated with a verifiable record.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
