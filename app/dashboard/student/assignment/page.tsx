'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, FileText, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StudentAssignmentWorkspace } from '../_components/student-assignment-workspace';
import { StudentQuizWorkspace } from '../_components/student-quiz-workspace';

export default function AssignmentsPage() {
  const [tab, setTab] = useState('assignments');

  useEffect(() => {
    const savedTab = localStorage.getItem('student-tab');
    if (savedTab) {
      setTab(savedTab);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setTab(value);
    localStorage.setItem('student-tab', value);
  };

  return (
    <div className='space-y-6 p-4 sm:p-6 lg:p-8'>
      {/* ── Hub header ─────────────────────────────────────────────── */}
      <header className='space-y-3'>
        <span className='inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary'>
          <GraduationCap className='h-3.5 w-3.5' />
          Assessments
        </span>

        <div className='space-y-1.5'>
          <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
            Your coursework
          </h1>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Submit assignments, review instructor feedback, and take scheduled quizzes across your
            enrolled classes — all in one place.
          </p>
        </div>
      </header>

      {/* ── Tabbed workspaces ──────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={handleTabChange} className='w-full gap-6'>
        <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:inline-flex sm:w-auto'>
          <TabsTrigger
            value='assignments'
            className='gap-2 rounded-lg px-5 py-2 text-sm font-medium'
          >
            <FileText className='h-4 w-4' />
            Assignments
          </TabsTrigger>

          <TabsTrigger value='quizzes' className='gap-2 rounded-lg px-5 py-2 text-sm font-medium'>
            <ClipboardList className='h-4 w-4' />
            Quizzes
          </TabsTrigger>
        </TabsList>

        <TabsContent value='assignments' className='focus-visible:outline-none'>
          <StudentAssignmentWorkspace embedded />
        </TabsContent>

        <TabsContent value='quizzes' className='focus-visible:outline-none'>
          <StudentQuizWorkspace embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
