'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Bell, PanelLeft, PanelRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { SubmissionInsightsPanel } from './SubmissionInsightsPanel';
import { SubmissionStudentList } from './SubmissionStudentList';
import { SubmissionWorkspace } from './SubmissionWorkspace';
import { submissionStudents } from './assignment-data';
import type { AssignmentCardData } from './assignment-types';

type AssignmentSubmissionOverlayProps = {
  assignment: AssignmentCardData;
};

export function AssignmentSubmissionOverlay({ assignment }: AssignmentSubmissionOverlayProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(submissionStudents[0]?.id ?? '');

  const filteredStudents = useMemo(
    () =>
      submissionStudents.filter(student =>
        student.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [search]
  );

  const selectedStudent =
    filteredStudents.find(student => student.id === selectedStudentId) ??
    submissionStudents.find(student => student.id === selectedStudentId) ??
    filteredStudents[0] ??
    submissionStudents[0];

  const handleClose = () => {
    router.push('/dashboard/assignment');
  };

  return (
    <div className='fixed inset-0 z-[100] bg-[color-mix(in_oklch,var(--el-brand-50)_80%,var(--background))]'>
      <header className='bg-primary text-primary-foreground flex h-16 items-center justify-between gap-3 border-b px-4 shadow-sm'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-semibold'>
            9
          </span>
          <div className='min-w-0'>
            <h1 className='truncate text-lg font-semibold'>
              {assignment.lesson} · {assignment.subtitle}
            </h1>
            <p className='text-primary-foreground/80 truncate text-xs'>
              Full-screen grading workspace · {assignment.dueLabel}
            </p>
          </div>
        </div>

        <div className='hidden min-w-0 flex-1 justify-center lg:flex'>
          <div className='relative w-full max-w-xl'>
            <Search className='text-primary-foreground/70 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search students or comments'
              className='h-11 rounded-full border-white/15 bg-white/10 pl-11 text-primary-foreground placeholder:text-primary-foreground/60'
            />
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='text-primary-foreground gap-2 hover:bg-white/10 xl:hidden'
              >
                <PanelLeft className='h-4 w-4' />
                Students
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-[88vw] max-w-sm p-0'>
              <SheetHeader className='sr-only'>
                <SheetTitle>Student submissions</SheetTitle>
                <SheetDescription>Select a student submission to review.</SheetDescription>
              </SheetHeader>
              <SubmissionStudentList
                onClose={handleClose}
                onSelect={setSelectedStudentId}
                search={search}
                selectedStudentId={selectedStudent?.id ?? ''}
                setSearch={setSearch}
                showCloseAction={false}
                students={filteredStudents}
              />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='text-primary-foreground gap-2 hover:bg-white/10 xl:hidden'
              >
                <PanelRight className='h-4 w-4' />
                Insights
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-[92vw] max-w-sm p-0'>
              <SheetHeader className='sr-only'>
                <SheetTitle>Submission insights</SheetTitle>
                <SheetDescription>Review grading insights and actions for this student.</SheetDescription>
              </SheetHeader>
              <SubmissionInsightsPanel student={selectedStudent} showFooterAction={false} />
            </SheetContent>
          </Sheet>

          <Button variant='ghost' size='icon' className='text-primary-foreground hover:bg-white/10'>
            <Bell className='h-4 w-4' />
          </Button>
          <Button variant='ghost' onClick={handleClose} className='text-primary-foreground hover:bg-white/10'>
            Close
          </Button>
        </div>
      </header>

      <section className="grid h-[calc(100vh-4rem)] min-h-0 xl:grid-cols-[300px_minmax(0,1fr)_340px]">

        {/* LEFT PANEL */}
        <div className="hidden xl:block min-h-0 min-w-0 overflow-hidden">
          <SubmissionStudentList
            onClose={handleClose}
            onSelect={setSelectedStudentId}
            search={search}
            selectedStudentId={selectedStudent?.id ?? ''}
            setSearch={setSearch}
            students={filteredStudents}
          />
        </div>

        {/* MAIN WORKSPACE */}
        <div className="min-h-0 min-w-0 overflow-hidden">
          <SubmissionWorkspace
            assignment={assignment}
            onCloseDetails={handleClose}
            student={selectedStudent}
          />
        </div>

        {/* RIGHT PANEL */}
        <div className="hidden xl:block min-h-0 min-w-0 overflow-hidden">
          <SubmissionInsightsPanel student={selectedStudent} />
        </div>
      </section>
    </div>
  );
}
