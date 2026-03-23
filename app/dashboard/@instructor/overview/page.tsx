'use client';

import { useUserProfile } from '@/context/profile-context';
import {
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import DomainOverviewShell from '@/components/domain-overview-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import PurchasableCatalogue from '../../_components/purchasable-catalogue';

export default function InstructorOverviewPage() {
  const user = useUserProfile();
  const instructor = user?.instructor;
  const instructorUuid = instructor?.uuid;
  const name = instructor?.full_name ?? user?.displayName ?? user?.fullName ?? 'Instructor';

  const { data: educationData, isLoading: isEducationLoading } = useQuery({
    ...getInstructorEducationOptions({
      path: { instructorUuid: instructorUuid ?? '' },
    }),
    enabled: !!instructorUuid,
  });

  const { data: experienceData, isLoading: isExperienceLoading } = useQuery({
    ...getInstructorExperienceOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: { pageable: {} },
    }),
    enabled: !!instructorUuid,
  });

  const educationCount = educationData?.data?.length ?? instructor?.educations?.length ?? 0;
  const careerCount = experienceData?.data?.content?.length ?? instructor?.experience?.length ?? 0;

  const completionItems = useMemo(
    () => [
      {
        label: 'Email address',
        description: 'Add a working email so learners and organisations can reach you.',
        complete: Boolean(user?.email?.trim()),
      },
      {
        label: 'Phone number',
        description: 'Include a valid phone number for bookings and account contact.',
        complete: Boolean(user?.phone_number?.trim()),
      },
      {
        label: 'About',
        description: 'Write your bio so your teaching background is visible on your profile.',
        complete: Boolean(instructor?.bio?.trim()),
      },
      {
        label: 'Education',
        description: 'Add at least one qualification under your education profile section.',
        complete: educationCount > 0,
      },
      {
        label: 'Career pathways',
        description: 'Add career history so your teaching experience is visible to organisations.',
        complete: careerCount > 0,
      },
      {
        label: 'Verification',
        description: 'Your instructor profile must be verified by an administrator.',
        complete: Boolean(instructor?.admin_verified),
      },
    ],
    [
      careerCount,
      educationCount,
      instructor?.admin_verified,
      instructor?.bio,
      user?.email,
      user?.phone_number,
    ]
  );

  const completedSteps = completionItems.filter(item => item.complete).length;
  const totalSteps = completionItems.length;
  const progress = totalSteps === 0 ? 0 : (completedSteps / totalSteps) * 100;
  const isProfileComplete = completedSteps === totalSteps;
  const nextIncompleteItem = completionItems.find(item => !item.complete);
  const isChecklistLoading = user?.isLoading || isEducationLoading || isExperienceLoading;

  const profileCard = (
    <Card>
      <CardHeader>
        <CardTitle>Instructor profile</CardTitle>
        <CardDescription>
          Track the sections required before your instructor profile is fully complete.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between text-sm font-medium'>
          <span>Steps completed</span>
          <span>
            {completedSteps} / {totalSteps}
          </span>
        </div>
        <Progress value={progress} className='h-2' />
        <div className='border-border/60 bg-muted/40 rounded-2xl border p-4'>
          <p className='text-foreground text-sm font-semibold'>
            {isChecklistLoading
              ? 'Checking profile completion'
              : isProfileComplete
                ? 'Profile complete'
                : `Next: ${nextIncompleteItem?.label ?? 'Finish your profile'}`}
          </p>
          <p className='text-muted-foreground text-xs'>
            {isChecklistLoading
              ? 'Refreshing your saved profile sections and verification status.'
              : isProfileComplete
                ? 'Your contact details, profile content, education, career history, and verification are all in place.'
                : nextIncompleteItem?.description}
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

  const expertiseCard = (
    <Card>
      <CardHeader>
        <CardTitle>Teaching focus</CardTitle>
        <CardDescription>
          Share the disciplines and delivery modes you are most comfortable with.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <div className='flex items-center gap-2'>
          <Badge variant='outline'>Design thinking</Badge>
          <Badge variant='outline'>Leadership labs</Badge>
          <Badge variant='outline'>Product strategy</Badge>
        </div>
        <div className='border-border/60 rounded-2xl border border-dashed p-3'>
          <Detail label='Preferred modality' value='Hybrid: virtual theory, on-site labs' />
          <Detail label='Average satisfaction' value='4.8 / 5.0' />
        </div>
        <Button variant='ghost' size='sm' asChild className='px-0 text-left'>
          <Link prefetch href='/dashboard/profile/skills'>
            Edit specialisations
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const approvalPanel = (
    <Card>
      <CardHeader>
        <CardTitle>Profile checklist</CardTitle>
        <CardDescription>
          Completion is based on the same details available across your profile sections.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {completionItems.map(item => {
          const isCompleted = item.complete;
          return (
            <div
              key={item.label}
              className='border-border/70 flex items-start gap-3 rounded-2xl border p-3 text-sm'
            >
              <div
                className={`mt-0.5 flex size-8 items-center justify-center rounded-full border ${
                  isCompleted
                    ? 'border-success bg-success text-success-foreground'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className='h-4 w-4' />
                ) : (
                  <ClipboardList className='h-4 w-4' />
                )}
              </div>
              <div>
                <p className='font-semibold'>{item.label}</p>
                <p className='text-muted-foreground text-xs'>{item.description}</p>
              </div>
            </div>
          );
        })}
        <Button size='sm' asChild>
          <Link prefetch href='/dashboard/profile'>
            Review profile sections
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const quickActions = (
    <Card>
      <CardHeader>
        <CardTitle>Work area</CardTitle>
        <CardDescription>
          Actions and shortcuts tailored to instructors with pending approvals.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3 sm:grid-cols-2'>
        <QuickAction
          icon={<ClipboardList className='h-4 w-4' />}
          title='Submit availability'
          description='Sync your calendar so programme leads can send demo invites.'
          href='/dashboard/trainings'
        />
        <QuickAction
          icon={<CalendarClock className='h-4 w-4' />}
          title='Schedule demo'
          description='Confirm your demo lesson slot to finalise onboarding.'
          href='/dashboard/trainings'
        />
        <QuickAction
          icon={<Shield className='h-4 w-4' />}
          title='Background check'
          description='Upload the latest clearance certificate and references.'
          href='/dashboard/profile/certificates'
        />
        <QuickAction
          icon={<Briefcase className='h-4 w-4' />}
          title='Set rate card'
          description='Publish day rates and blended-delivery pricing.'
          href='/dashboard/rate-card'
        />
      </CardContent>
    </Card>
  );

  return (
    <DomainOverviewShell
      domainLabel='Instructor workspace'
      title={`Welcome, ${name}`}
      subtitle='Curate your profile, share availability, and progress through approvals without leaving this surface.'
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
          {expertiseCard}
        </>
      }
      rightColumn={
        <>
          {approvalPanel}
          {quickActions}
          <PurchasableCatalogue scope='instructor' />
        </>
      }
    />
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <span className='text-muted-foreground text-xs uppercase'>{label}</span>
      <span className='text-foreground text-sm font-semibold'>{value}</span>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className='border-border/70 bg-muted/20 flex flex-col justify-between rounded-2xl border p-3'>
      <div className='space-y-1'>
        <div className='flex items-center gap-2 text-sm font-semibold'>
          <span className='bg-primary/10 text-primary rounded-full p-1.5'>{icon}</span>
          {title}
        </div>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
      <Button asChild variant='ghost' size='sm' className='mt-3 justify-start px-0 text-sm'>
        <Link prefetch href={href}>
          Open
        </Link>
      </Button>
    </div>
  );
}
