'use client';

import DomainOverviewShell from '@/components/domain-overview-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserProfile } from '@/context/profile-context';
import { getStudentScheduleOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  GraduationCap,
  Search,
  ThumbsUp,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

const approvalStages = [
  {
    title: 'Profile submitted',
    description: 'We have received your student profile details.',
    icon: FileText,
  },
  {
    title: 'Under review',
    description: 'Your profile is waiting for admin verification.',
    icon: Search,
  },
  {
    title: 'Approved',
    description: 'Your student profile has been approved for learning access.',
    icon: ThumbsUp,
  },
  {
    title: 'Enrolled',
    description: 'This stays open until you join your first class or course.',
    icon: GraduationCap,
  },
] as const;

function getAge(dateOfBirth?: Date | string | null) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

export default function StudentOverviewPage() {
  const user = useUserProfile();
  const student = user?.student as (typeof user.student & { admin_verified?: boolean }) | undefined;
  const studentUuid = student?.uuid;
  const name = student?.full_name ?? user?.displayName ?? user?.fullName ?? 'Student';

  const { data: enrollmentData, isLoading: isEnrollmentLoading } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: studentUuid ?? '' },
      query: { start: '2024-01-01', end: '2035-12-31' },
    }),
    enabled: !!studentUuid,
  });

  const age = getAge(user?.dob);
  const requiresGuardian = typeof age === 'number' ? age < 18 : false;
  const hasPrimaryGuardian = Boolean(
    student?.first_guardian_name?.trim() && student?.first_guardian_mobile?.trim()
  );
  const isAdminVerified = Boolean(student?.admin_verified);
  const enrollmentCount = enrollmentData?.data?.length ?? 0;
  const hasEnrollment = enrollmentCount > 0;

  const profileChecklist = useMemo(
    () => [
      {
        label: 'Email address',
        description: 'Add a valid email address for course updates and account recovery.',
        complete: Boolean(user?.email?.trim()),
      },
      {
        label: 'Phone number',
        description: 'Include a working phone number so instructors and support can reach you.',
        complete: Boolean(user?.phone_number?.trim()),
      },
      {
        label: 'Date of birth',
        description: 'Your date of birth is used for learner records and guardian checks.',
        complete: Boolean(user?.dob),
      },
      {
        label: 'Guardian contact',
        description: requiresGuardian
          ? 'Add at least one guardian contact because this learner is under 18.'
          : 'Optional for adult learners, but useful for emergency contact records.',
        complete: requiresGuardian ? hasPrimaryGuardian : true,
      },
      {
        label: 'Admin verification',
        description: 'A verified student profile moves both review and approval stages forward.',
        complete: isAdminVerified,
      },
    ],
    [
      hasPrimaryGuardian,
      isAdminVerified,
      requiresGuardian,
      user?.dob,
      user?.email,
      user?.phone_number,
    ]
  );

  const completedProfileSteps = profileChecklist.filter(item => item.complete).length;
  const totalProfileSteps = profileChecklist.length;
  const profileProgress =
    totalProfileSteps === 0 ? 0 : (completedProfileSteps / totalProfileSteps) * 100;
  const isProfileComplete = completedProfileSteps === totalProfileSteps;
  const nextIncompleteProfileStep = profileChecklist.find(item => !item.complete);

  const stageCompletion = [Boolean(studentUuid), isAdminVerified, isAdminVerified, hasEnrollment];

  const completedStageCount = stageCompletion.filter(Boolean).length;
  const currentStageIndex = stageCompletion.findIndex(complete => !complete);
  const resolvedStageIndex =
    currentStageIndex === -1 ? approvalStages.length - 1 : currentStageIndex;
  const currentStage = approvalStages[resolvedStageIndex];
  const approvalProgress = (completedStageCount / approvalStages.length) * 100;

  const profileCard = (
    <Card>
      <CardHeader>
        <CardTitle>Profile completion</CardTitle>
        <CardDescription>
          Track the student profile requirements before learning access is fully unlocked.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between text-sm font-medium'>
          <span>Steps completed</span>
          <span>
            {completedProfileSteps} / {totalProfileSteps}
          </span>
        </div>
        <Progress value={profileProgress} className='h-2' />
        <div className='border-border/60 bg-muted/40 rounded-2xl border p-4'>
          <p className='text-foreground text-sm font-semibold'>
            {user?.isLoading
              ? 'Checking profile completion'
              : isProfileComplete
                ? 'Profile complete'
                : `Next: ${nextIncompleteProfileStep?.label ?? 'Finish your profile'}`}
          </p>
          <p className='text-muted-foreground text-xs'>
            {user?.isLoading
              ? 'Refreshing your saved student profile details.'
              : isProfileComplete
                ? 'Your core learner details are complete. Admin verification and enrollment milestones are tracked separately below.'
                : nextIncompleteProfileStep?.description}
          </p>
        </div>
        <Button asChild className='w-full'>
          <Link prefetch href='/dashboard/profile'>
            {isProfileComplete ? 'View profile' : 'Complete profile'}
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const guardianCard = (
    <Card>
      <CardHeader>
        <CardTitle>Submitted details</CardTitle>
        <CardDescription>
          Review the learner and guardian information currently on file.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <DetailRow label='Student name' value={name} />
        <DetailRow label='Mobile number' value={user?.phone_number || 'Not provided'} />
        <DetailRow label='Email address' value={user?.email || 'Not provided'} />
        <DetailRow
          label='Date of birth'
          value={user?.dob ? new Date(user.dob).toLocaleDateString() : 'Not provided'}
        />
        <div className='border-border/60 rounded-2xl border border-dashed p-3'>
          <DetailRow
            label='Primary guardian'
            value={student?.first_guardian_name || (requiresGuardian ? 'Required' : 'Not provided')}
          />
          <DetailRow
            label='Guardian mobile'
            value={
              student?.first_guardian_mobile || (requiresGuardian ? 'Required' : 'Not provided')
            }
          />
        </div>
        <Button variant='ghost' asChild className='w-full justify-start px-0 text-sm'>
          <Link prefetch href='/dashboard/profile'>
            Edit guardian details
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const approvalTimeline = (
    <Card>
      <CardHeader>
        <CardTitle>Approval timeline</CardTitle>
        <CardDescription>
          Admin verification now clears both the review and approval stages together.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between text-sm font-medium'>
          <span>Milestone progress</span>
          <span>
            {completedStageCount} / {approvalStages.length}
          </span>
        </div>
        <Progress value={approvalProgress} className='h-2' />
        <div className='border-border/60 bg-muted/40 rounded-2xl border p-4'>
          <p className='text-foreground text-sm font-semibold'>
            {isEnrollmentLoading ? 'Checking enrollment milestones' : currentStage.title}
          </p>
          <p className='text-muted-foreground text-xs'>
            {isEnrollmentLoading
              ? 'Refreshing your verification and enrollment progress.'
              : currentStage.description}
          </p>
        </div>
        {approvalStages.map((stage, idx) => {
          const isCompleted = stageCompletion[idx];
          const isCurrent = !isCompleted && idx === resolvedStageIndex;
          const Icon = stage.icon;

          return (
            <div
              key={stage.title}
              className='border-border/60 flex items-start gap-3 rounded-2xl border p-3'
            >
              <div
                className={`mt-1 flex size-9 items-center justify-center rounded-full border ${
                  isCompleted
                    ? 'border-success bg-success text-success-foreground'
                    : isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle2 className='h-4 w-4' /> : <Icon className='h-4 w-4' />}
              </div>
              <div className='space-y-1 text-sm'>
                <p className='text-foreground font-semibold'>{stage.title}</p>
                <p className='text-muted-foreground text-xs'>{stage.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  const enrollmentCard = (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment access</CardTitle>
        <CardDescription>
          The final milestone stays open until your first successful enrollment.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-3 text-sm'>
        <Badge variant='outline' className='w-fit'>
          <BookOpenCheck className='mr-1 h-3.5 w-3.5' />
          {isAdminVerified ? 'Admin verified' : 'Awaiting admin verification'}
        </Badge>
        <p className='text-muted-foreground'>
          {hasEnrollment
            ? `You already have ${enrollmentCount} enrollment${enrollmentCount === 1 ? '' : 's'} on record.`
            : isAdminVerified
              ? 'Your profile is approved. Browse courses to complete the enrollment milestone.'
              : 'Once an administrator verifies your profile, the review and approval stages will both complete automatically.'}
        </p>
        <div className='flex flex-wrap gap-2'>
          <Button size='sm' asChild>
            <Link prefetch href='/dashboard/all-courses'>
              Browse courses
            </Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link prefetch href={hasEnrollment ? '/dashboard/schedule' : '/dashboard/profile'}>
              {hasEnrollment ? 'View schedule' : 'Review profile'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DomainOverviewShell
      domainLabel='Student workspace'
      title={`Welcome, ${name}`}
      subtitle='Track profile completion, admin approval, guardian details, and first enrollment from one place.'
      badge={{
        label: isProfileComplete ? 'Profile complete' : 'Profile incomplete',
        tone: isProfileComplete ? 'success' : 'warning',
      }}
      actions={
        <Button asChild variant='outline'>
          <Link prefetch href='/dashboard/profile'>
            View profile
          </Link>
        </Button>
      }
      leftColumn={
        <>
          {profileCard}
          {guardianCard}
        </>
      }
      rightColumn={
        <>
          {approvalTimeline}
          {enrollmentCard}
        </>
      }
    />
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <span className='text-muted-foreground text-xs uppercase'>{label}</span>
      <span className='text-foreground text-right text-sm font-semibold'>{value}</span>
    </div>
  );
}
