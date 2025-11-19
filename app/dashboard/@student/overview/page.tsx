"use client";

import DomainOverviewShell from '@/components/domain-overview-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BookOpenCheck, CheckCircle2, FileText, GraduationCap, Search, ThumbsUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const approvalStages = [
  {
    title: 'Profile submitted',
    description: 'We have received your registration details.',
    icon: FileText,
  },
  {
    title: 'Under review',
    description: 'Our team is validating guardian contacts and date of birth.',
    icon: Search,
  },
  {
    title: 'Approved',
    description: 'You can now access classes and required documents.',
    icon: ThumbsUp,
  },
  {
    title: 'Enrolled',
    description: 'Your timetable and learning resources unlock automatically.',
    icon: GraduationCap,
  },
] as const;

const submittedDetails = {
  name: 'John Doe',
  phone: '0712345678',
  email: 'john.doe@example.com',
  guardianName: 'Jane Doe',
  guardianPhone: '+254 700 000 001',
  hasGuardian: true,
};

export default function StudentOverviewPage() {
  const { data: session } = useSession();
  const isProfileComplete = false;
  const currentStageIndex = 1;
  const currentStage = approvalStages[currentStageIndex];
  const progressPercent = ((currentStageIndex + 1) / approvalStages.length) * 100;

  const profileCard = (
    <Card>
      <CardHeader>
        <CardTitle>Profile completion</CardTitle>
        <CardDescription>
          {isProfileComplete
            ? 'Your application is complete while we finish verification.'
            : 'Finish your profile so we can review and enrol you.'}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between text-sm font-medium'>
          <span>Steps completed</span>
          <span>{currentStageIndex + 1} / {approvalStages.length}</span>
        </div>
        <Progress value={progressPercent} className='h-2' />
        <div className='rounded-2xl border border-border/60 bg-muted/40 p-4'>
          <p className='text-sm font-semibold text-foreground'>{currentStage.title}</p>
          <p className='text-muted-foreground text-sm'>{currentStage.description}</p>
        </div>
        <Button asChild className='w-full'>
          <Link prefetch href='/dashboard/profile/general'>
            {isProfileComplete ? 'View student profile' : 'Complete my profile'}
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
        <CardDescription>Review the contact information you supplied.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <DetailRow label='Student name' value={submittedDetails.name} />
        <DetailRow label='Mobile number' value={submittedDetails.phone} />
        <DetailRow label='Email address' value={submittedDetails.email} />
        {submittedDetails.hasGuardian ? (
          <div className='rounded-2xl border border-dashed border-border/60 p-3'>
            <DetailRow label='Guardian name' value={submittedDetails.guardianName} />
            <DetailRow label='Guardian mobile' value={submittedDetails.guardianPhone} />
          </div>
        ) : null}
        <Button variant='ghost' asChild className='w-full justify-start px-0 text-sm'>
          <Link prefetch href='/dashboard/profile/guardian'>Edit guardian details</Link>
        </Button>
      </CardContent>
    </Card>
  );

  const approvalTimeline = (
    <Card>
      <CardHeader>
        <CardTitle>Approval timeline</CardTitle>
        <CardDescription>Monitor each stage of your onboarding journey.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {approvalStages.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.title} className='flex items-start gap-3 rounded-2xl border border-border/60 p-3'>
              <div
                className={`mt-1 flex size-9 items-center justify-center rounded-full border ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle2 className='h-4 w-4' /> : <Icon className='h-4 w-4' />}
              </div>
              <div className='space-y-1 text-sm'>
                <p className='font-semibold text-foreground'>{stage.title}</p>
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
        <CardTitle>Ready for enrolment?</CardTitle>
        <CardDescription>Upload proof-of-age documents or request assistance.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-3 text-sm'>
        <Badge variant='outline' className='w-fit'>
          <BookOpenCheck className='mr-1 h-3.5 w-3.5' />
          Required: national ID or birth certificate
        </Badge>
        <p className='text-muted-foreground'>
          Uploading a valid document unlocks seats in classes that enforce age restrictions.
        </p>
        <div className='flex flex-wrap gap-2'>
          <Button size='sm'>Upload documents</Button>
          <Button variant='outline' size='sm'>
            Talk to support
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DomainOverviewShell
      domainLabel='Student workspace'
      title={`Welcome, ${session?.user?.name ?? 'Student'}`}
      subtitle='Track your approvals, manage guardian contacts, and unlock enrolment in one place.'
      badge={{
        label: isProfileComplete ? 'Profile complete' : 'Profile incomplete',
        tone: isProfileComplete ? 'success' : 'warning',
      }}
      actions={
        <Button asChild variant='outline'>
          <Link prefetch href='/dashboard/profile/general'>
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
      <span className='text-foreground text-sm font-semibold'>{value}</span>
    </div>
  );
}
