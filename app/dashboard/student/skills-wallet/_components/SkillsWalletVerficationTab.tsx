'use client';

import { BadgeCheck, CheckCircle2, Clock, Mic, ShieldCheck, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { StatCard } from './SkillsWalletShared';

const VERIFICATIONS = [
  { id: 'v1', source: 'assessment', title: 'React Fundamentals Final', skill: 'React', change: 'scored 92% · Passed', date: '2026-07-29', status: 'verified' as const },
  { id: 'v2', source: 'assessment', title: 'Data Analysis Midterm', skill: 'Data Analysis', change: 'scored 74% · Passed', date: '2026-07-10', status: 'verified' as const },
  { id: 'v3', source: 'competition', title: 'Regional Hackathon', skill: 'React', change: 'Placed 2nd of 40 teams', date: '2026-06-20', status: 'verified' as const },
  { id: 'v4', source: 'instructor_evaluation', title: 'Public Speaking Practicum', skill: 'Public Speaking', change: 'Instructor sign-off pending', date: '2026-07-18', status: 'pending' as const },
  { id: 'v5', source: 'assessment', title: 'Cloud Practitioner Practice Exam', skill: 'Cloud Infrastructure', change: 'scored 48% · Not passed', date: '2026-05-02', status: 'failed' as const },
];

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function SkillsWalletVerficationTab() {
  const verified = VERIFICATIONS.filter(item => item.status === 'verified').length;
  const pending = VERIFICATIONS.filter(item => item.status === 'pending').length;
  const failed = VERIFICATIONS.filter(item => item.status === 'failed').length;

  const stats = [
    { icon: ShieldCheck, label: 'Total Proofs', value: VERIFICATIONS.length, tint: 'bg-primary/10 text-primary' },
    { icon: CheckCircle2, label: 'Verified', value: verified, tint: 'bg-success/10 text-success' },
    { icon: Clock, label: 'Pending', value: pending, tint: 'bg-warning/10 text-warning' },
    { icon: XCircle, label: 'Failed', value: failed, tint: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>Verification</h2>
          <p className='text-sm text-muted-foreground'>
            A live audit trail of assessments, competitions and instructor confirmations.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline'>
            <BadgeCheck className='mr-2 h-4 w-4' /> Request Review
          </Button>
          <Button className='bg-primary hover:bg-primary/90'>
            <Mic className='mr-2 h-4 w-4' /> Add Proof
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className='space-y-3'>
        {VERIFICATIONS.map(item => (
          <Card key={item.id}>
            <CardContent className='flex items-start justify-between gap-3 p-4'>
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <p className='font-medium'>{item.title}</p>
                  <Badge variant='outline' className='text-[10px]'>
                    {item.skill}
                  </Badge>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>{item.change}</p>
                <p className='mt-1 text-xs text-muted-foreground'>{fmtDate(item.date)}</p>
              </div>
              <Badge
                className={
                  item.status === 'verified'
                    ? 'border-0 bg-success/10 text-success'
                    : item.status === 'pending'
                      ? 'border-0 bg-warning/10 text-warning'
                      : 'border-0 bg-destructive/10 text-destructive'
                }
              >
                {item.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
