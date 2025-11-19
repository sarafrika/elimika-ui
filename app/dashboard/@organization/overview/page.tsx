"use client";

import DomainOverviewShell from '@/components/domain-overview-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  Building,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flag,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const moderationStages = [
  {
    title: 'Organisation submitted',
    description: 'Training centre documentation uploaded.',
  },
  {
    title: 'Compliance review',
    description: 'We are validating certifications and governance data.',
  },
  {
    title: 'Sandbox onboarding',
    description: 'Provisioning test branches and access for your admins.',
  },
  {
    title: 'Production ready',
    description: 'Your learners and instructors can now join programmes.',
  },
] as const;

export default function OrganisationOverviewPage() {
  const { data: session } = useSession();
  const organisationName = session?.user?.name ?? 'Organisation Admin';
  const isProfileComplete = false;
  const currentStageIndex = 1;
  const progress = ((currentStageIndex + 1) / moderationStages.length) * 100;

  const profileCard = (
    <Card>
      <CardHeader>
        <CardTitle>Organisation profile</CardTitle>
        <CardDescription>
          Keep your training centre details up to date so we can list you faster.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between text-sm font-medium'>
          <span>Completion</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className='h-2' />
        <div className='rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm'>
          <p className='font-semibold text-foreground'>
            {moderationStages[currentStageIndex].title}
          </p>
          <p className='text-muted-foreground text-xs'>
            {moderationStages[currentStageIndex].description}
          </p>
        </div>
        <Button asChild className='w-full'>
          <Link prefetch href='/dashboard/account/training-center'>
            {isProfileComplete ? 'View training centre' : 'Complete profile'}
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const trainingCenterCard = (
    <Card>
      <CardHeader>
        <CardTitle>Training centre details</CardTitle>
        <CardDescription>Editable information visible to prospective learners.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <Detail label='Legal name' value='Elimika Innovation Hub' />
        <Detail label='Country' value='Kenya' />
        <Detail label='Primary campus' value='Karen, Nairobi' />
        <Detail label='Default timezone' value='EAT (UTC +03:00)' />
        <Button variant='ghost' size='sm' asChild className='px-0 text-left'>
          <Link prefetch href='/dashboard/account/training-center'>Update training centre</Link>
        </Button>
      </CardContent>
    </Card>
  );

  const approvalsCard = (
    <Card>
      <CardHeader>
        <CardTitle>Moderation pipeline</CardTitle>
        <CardDescription>
          Keep track of what the Elimika team needs from your organisation.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {moderationStages.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          return (
            <div
              key={stage.title}
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
                <p className='font-semibold'>{stage.title}</p>
                <p className='text-muted-foreground text-xs'>{stage.description}</p>
              </div>
            </div>
          );
        })}
        <Button size='sm'>Upload compliance documents</Button>
      </CardContent>
    </Card>
  );

  const actionGrid = (
    <Card>
      <CardHeader>
        <CardTitle>Work area</CardTitle>
        <CardDescription>High impact actions for organisation owners.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3 sm:grid-cols-2'>
        <WorkTile
          icon={<FileText className='h-4 w-4' />}
          title='Provision branches'
          description='Share branch contacts and assign local admins.'
          href='/dashboard/branches'
        />
        <WorkTile
          icon={<Users className='h-4 w-4' />}
          title='Invite staff'
          description='Invite instructors, mentors, and coordinators.'
          href='/dashboard/users'
        />
        <WorkTile
          icon={<ClipboardList className='h-4 w-4' />}
          title='Submit programmes'
          description='Send your flagship courses for moderation.'
          href='/dashboard/course-management'
        />
        <WorkTile
          icon={<Flag className='h-4 w-4' />}
          title='Escalate support'
          description='Raise blockers directly with Elimika ops.'
          href='/dashboard/support'
        />
      </CardContent>
    </Card>
  );

  return (
    <DomainOverviewShell
      domainLabel='Organisation workspace'
      title={`Welcome, ${organisationName}`}
      subtitle='Track moderation progress, rollout branches, and onboard your teams from one workspace.'
      badge={{
        label: isProfileComplete ? 'Profile complete' : 'Profile incomplete',
        tone: isProfileComplete ? 'success' : 'warning',
      }}
      actions={
        <Button asChild variant='outline'>
          <Link prefetch href='/dashboard/account/training-center'>
            View organisation profile
          </Link>
        </Button>
      }
      leftColumn={
        <>
          {profileCard}
          {trainingCenterCard}
        </>
      }
      rightColumn={
        <>
          {approvalsCard}
          {actionGrid}
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

function WorkTile({
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
    <div className='flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm'>
      <div className='space-y-1'>
        <div className='flex items-center gap-2 font-semibold'>
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
