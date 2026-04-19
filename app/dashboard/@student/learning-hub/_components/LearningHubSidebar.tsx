'use client';

import { Card } from '@/components/ui/card';
import { BookOpen, Plus, UserSquare2 } from 'lucide-react';
import Link from 'next/link';

type LearningHubSidebarProps = {
  studentName: string;
};

export function LearningHubSidebar({ studentName }: LearningHubSidebarProps) {
  return (
    <aside className='space-y-3'>
      <Card className='rounded-[18px] border border-border/70 bg-background p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <nav className='space-y-2'>
          <div className='flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[0.88rem] text-muted-foreground'>
            <UserSquare2 className='size-4' />
            My Skills
          </div>
          <div className='flex items-center gap-2 rounded-[10px] bg-[color-mix(in_srgb,var(--primary)_8%,white)] px-2.5 py-2 text-[0.88rem] font-medium text-primary'>
            <BookOpen className='size-4' />
            Courses
          </div>
        </nav>
      </Card>

      <Card className='rounded-[18px] border border-border/70 bg-background p-3 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.18)]'>
        <div className='overflow-hidden rounded-[12px] border border-border/50 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,white),white)] p-3'>
          <div className='mb-3 h-[84px] rounded-[10px] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_38%,white),color-mix(in_srgb,var(--primary)_12%,white))]' />
          <h3 className='text-[1.05rem] leading-tight font-semibold text-foreground'>
            Welcome back,
            <br />
            {studentName}!
          </h3>
          <p className='mt-2 text-[0.86rem] leading-6 text-muted-foreground'>
            Keep learning and track your progress here in your Learning Hub.
          </p>
        </div>

        <div className='mt-3 space-y-2'>
          <Link
            prefetch
            href='/dashboard/workspace/student/courses'
            className='inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--success)_80%,black_6%),color-mix(in_srgb,var(--success)_70%,black_18%))] px-3 py-2.5 text-[0.84rem] font-medium text-white transition hover:opacity-95'
          >
            <Plus className='size-4' />
            Go to My Courses
          </Link>
          <Link
            prefetch
            href="/dashboard/workspace/student/courses"
            className='inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-border/70 bg-background px-3 py-2.5 text-[0.84rem] font-medium text-muted-foreground transition hover:text-primary'
          >
            <Plus className='size-4' />
            Enroll in New Course
          </Link>
        </div>
      </Card>
    </aside>
  );
}
