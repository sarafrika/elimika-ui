"use client";

import DomainOverviewShell from '@/components/domain-overview-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Shield,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const onboardingSteps = [
  {
    title: 'Profile submitted',
    description: 'Portfolio, certifications, and availability captured.',
  },
  {
    title: 'Credentials under review',
    description: 'Quality and compliance teams are validating your documentation.',
  },
  {
    title: 'Demo lesson scheduled',
    description: 'Showcase your facilitation style to programme leads.',
  },
  {
    title: 'Approved & listed',
    description: 'Your timetable unlocks across eligible organisations.',
  },
] as const;

export default function InstructorOverviewPage() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? 'Instructor';
  const isProfileComplete = false;
  const currentStepIndex = 1;
  const progress = ((currentStepIndex + 1) / onboardingSteps.length) * 100;

  const profileCard = (
    <Card>
      <CardHeader>
        <CardTitle>Instructor profile</CardTitle>
        <CardDescription>
          Keep your headline, credentials, and rate card up to date for faster booking.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between text-sm font-medium'>
          <span>Completion</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className='h-2' />
        <div className='rounded-2xl border border-border/60 bg-muted/40 p-4'>
          <p className='text-sm font-semibold text-foreground'>
            {onboardingSteps[currentStepIndex].title}
          </p>
          <p className='text-muted-foreground text-xs'>
            {onboardingSteps[currentStepIndex].description}
          </p>
        </div>
        <Button asChild className='w-full'>
          <Link prefetch href='/dashboard/profile/general'>
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
        <div className='rounded-2xl border border-dashed border-border/60 p-3'>
          <Detail label='Preferred modality' value='Hybrid: virtual theory, on-site labs' />
          <Detail label='Average satisfaction' value='4.8 / 5.0' />
        </div>
        <Button variant='ghost' size='sm' asChild className='px-0 text-left'>
          <Link prefetch href='/dashboard/profile/expertise'>Edit specialisations</Link>
        </Button>
      </CardContent>
    </Card>
  );

  const approvalPanel = (
    <Card>
      <CardHeader>
        <CardTitle>Approval checklist</CardTitle>
        <CardDescription>
          Complete each requirement to unlock contracts across Elimika organisations.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {onboardingSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <div
              key={step.title}
              className='flex items-start gap-3 rounded-2xl border border-border/70 p-3 text-sm'
            >
              <div
                className={`mt-0.5 flex size-8 items-center justify-center rounded-full border ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle2 className='h-4 w-4' /> : index + 1}
              </div>
              <div>
                <p className='font-semibold'>{step.title}</p>
                <p className='text-muted-foreground text-xs'>{step.description}</p>
              </div>
            </div>
          );
        })}
        <Button size='sm'>Upload credential evidence</Button>
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
          href='/dashboard/profile/compliance'
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
        </>
      }
    />
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <span className='text-muted-foreground text-xs uppercase'>{label}</span>
      <span className='text-sm font-semibold text-foreground'>{value}</span>
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
    <div className='flex flex-col justify-between rounded-2xl border border-border/70 bg-muted/20 p-3'>
      <div className='space-y-1'>
        <div className='flex items-center gap-2 text-sm font-semibold'>
          <span className='rounded-full bg-primary/10 p-1.5 text-primary'>{icon}</span>
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
