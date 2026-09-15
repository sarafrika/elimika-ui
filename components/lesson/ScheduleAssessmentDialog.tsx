'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUserProfile } from '@/context/profile-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';
import { dayjs, normalizeScheduleTimeZone } from '@/lib/date';
import {
  createAssignmentScheduleMutation,
  createQuizScheduleMutation,
  updateAssignmentScheduleMutation,
  updateQuizScheduleMutation,
  getAssignmentSchedulesQueryKey,
  getQuizSchedulesQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  ScheduledInstance,
} from '@/services/client/types.gen';
import { hasApiError } from './workbook-data';
import { assessmentDates, gradingDeadline } from './assessment-scheduling';

export type AssessmentToSchedule = {
  kind: 'assignment' | 'quiz';
  uuid: string;
  title: string;
  schedule?: ClassAssignmentSchedule | ClassQuizSchedule;
};

export function ScheduleAssessmentDialog({
  task,
  session,
  classId,
  lessonId,
  onClose,
}: {
  task: AssessmentToSchedule;
  session: ScheduledInstance;
  classId: string;
  lessonId: string;
  onClose: () => void;
}) {
  const profile = useUserProfile();
  const client = useQueryClient();
  const timezone = normalizeScheduleTimeZone(task.schedule?.timezone ?? session.timezone);
  const local = (date?: Date) => (date ? dayjs(date).tz(timezone).format('YYYY-MM-DDTHH:mm') : '');
  const existingGrading = gradingDeadline(task.schedule);
  const [visibleAt, setVisibleAt] = useState(
    local(task.schedule?.visible_at ?? session.start_time)
  );
  const [dueAt, setDueAt] = useState(local(task.schedule?.due_at ?? session.end_time));
  const [gradingAt, setGradingAt] = useState(
    local(
      existingGrading ??
        dayjs(task.schedule?.due_at ?? session.end_time)
          .add(7, 'day')
          .toDate()
    )
  );
  const [error, setError] = useState('');
  const createAssignment = useMutation(createAssignmentScheduleMutation());
  const createQuiz = useMutation(createQuizScheduleMutation());
  const updateAssignment = useMutation(updateAssignmentScheduleMutation());
  const updateQuiz = useMutation(updateQuizScheduleMutation());
  const pending =
    createAssignment.isPending ||
    createQuiz.isPending ||
    updateAssignment.isPending ||
    updateQuiz.isPending;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (pending) return;
    if (!session.uuid || !profile?.instructor?.uuid || !classId || !lessonId || !task.uuid) {
      setError('Select a class session and wait for your instructor profile to load.');
      return;
    }
    try {
      let dates: ReturnType<typeof assessmentDates>;
      try {
        dates = assessmentDates(visibleAt, dueAt, gradingAt, timezone);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Enter valid scheduling dates.');
        return;
      }
      const { visible, due, grading } = dates;
      // The reference training flow uses this instance field for both schedule endpoints.
      const common = {
        ...task.schedule,
        class_definition_uuid: classId,
        lesson_uuid: lessonId,
        class_lesson_plan_uuid: session.uuid,
        visible_at: visible,
        due_at: due,
        grading_due_at: grading,
        timezone,
        release_strategy: 'CUSTOM' as const,
        instructor_uuid: profile.instructor.uuid,
      };
      const response =
        task.kind === 'assignment'
          ? task.schedule?.uuid
            ? await updateAssignment.mutateAsync({
                path: { classUuid: classId, scheduleUuid: task.schedule.uuid },
                body: { ...common, assignment_uuid: task.uuid },
              })
            : await createAssignment.mutateAsync({
                path: { classUuid: classId },
                body: { ...common, assignment_uuid: task.uuid, max_attempts: 1 },
              })
          : task.schedule?.uuid
            ? await updateQuiz.mutateAsync({
                path: { classUuid: classId, scheduleUuid: task.schedule.uuid },
                body: { ...common, quiz_uuid: task.uuid },
              })
            : await createQuiz.mutateAsync({
                path: { classUuid: classId },
                body: { ...common, quiz_uuid: task.uuid },
              });
      if (hasApiError(response)) {
        setError(response.message || 'Unable to assign this task.');
        return;
      }
      await client.invalidateQueries({
        queryKey:
          task.kind === 'assignment'
            ? getAssignmentSchedulesQueryKey({ path: { classUuid: classId } })
            : getQuizSchedulesQueryKey({ path: { classUuid: classId } }),
      });
      toast.success(
        task.schedule
          ? 'Task schedule updated.'
          : 'Task assigned to the students in this class session.'
      );
      onClose();
    } catch {
      setError('Unable to save the schedule. Check the dates and try again.');
    }
  };
  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {task.schedule ? 'Edit schedule' : 'Schedule and assign'}: {task.title}
          </DialogTitle>
          <DialogDescription>
            Assign to students enrolled in the class session on{' '}
            {local(session.start_time).replace('T', ' ')}. All times are in {timezone}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='task-release'>Release date</Label>
            <Input
              id='task-release'
              type='datetime-local'
              required
              value={visibleAt}
              onChange={event => setVisibleAt(event.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='task-due'>Submission deadline</Label>
            <Input
              id='task-due'
              type='datetime-local'
              required
              min={visibleAt}
              value={dueAt}
              onChange={event => setDueAt(event.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='task-grading'>Grading deadline</Label>
            <Input
              id='task-grading'
              type='datetime-local'
              required
              min={dueAt}
              value={gradingAt}
              onChange={event => setGradingAt(event.target.value)}
            />
          </div>
          {error && (
            <p role='alert' className='text-destructive text-sm'>
              {error}
            </p>
          )}
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={pending || !profile?.instructor?.uuid}>
              {pending && <Spinner />}
              {task.schedule ? 'Save schedule' : 'Assign to students'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
