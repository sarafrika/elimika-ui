'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCourseCreator } from '@/context/course-creator-context';
import { format } from 'date-fns';
import { CheckCircle2, FileText, HelpCircle, Upload, Verified } from 'lucide-react';

const STEPS = [
  {
    title: 'Submit credentials',
    detail: 'Upload certifications, portfolio links, and proof of curriculum ownership.',
    icon: Upload,
  },
  {
    title: 'Admin review',
    detail: 'Elimika reviewers score content quality, compliance, and monetization settings.',
    icon: FileText,
  },
  {
    title: 'Verification decision',
    detail: 'Receive approval, revision requests, or rejection within three business days.',
    icon: CheckCircle2,
  },
];

const CRITERIA = [
  'Professional credentials and subject expertise are verifiable.',
  'Course portfolio meets quality and accessibility standards.',
  'Revenue share and minimum training fee align with marketplace expectations.',
  'Legal agreements about intellectual property are signed and up to date.',
  'Ongoing maintenance plan exists for updating course materials.',
];

export default function CourseCreatorVerificationPage() {
  const { data } = useCourseCreator();
  const { verification } = data;

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 px-4 py-10'>
      <header className='space-y-2'>
        <div className='flex items-center gap-2'>
          {verification.adminVerified ? (
            <Badge className='flex items-center gap-1 bg-emerald-500 text-white'>
              <Verified className='h-3.5 w-3.5' /> Verified
            </Badge>
          ) : (
            <Badge variant='secondary' className='flex items-center gap-1'>
              <HelpCircle className='h-3.5 w-3.5' /> Action required
            </Badge>
          )}
          <span className='text-muted-foreground text-xs'>
            Updated{' '}
            {verification.lastUpdated
              ? format(verification.lastUpdated, 'dd MMM yyyy')
              : 'Not recorded'}
          </span>
        </div>
        <h1 className='text-3xl font-semibold tracking-tight'>Verification checklist</h1>
        <p className='text-muted-foreground text-sm'>
          Market-facing publishing requires an approved course creator profile, up-to-date evidence
          of expertise, and alignment with Elimika&apos;s quality standards.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Workflow</CardTitle>
          <CardDescription>
            Work through each step and respond quickly to reviewer feedback so your courses can go
            live without delay.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className='flex gap-4'>
                <div className='flex flex-col items-center'>
                  <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full'>
                    <Icon className='h-5 w-5' />
                  </div>
                  {index < STEPS.length - 1 && (
                    <Separator orientation='vertical' className='bg-border my-1 flex-1' />
                  )}
                </div>
                <div>
                  <p className='font-semibold'>{step.title}</p>
                  <p className='text-muted-foreground text-sm'>{step.detail}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Approval criteria</CardTitle>
          <CardDescription>
            Reviewers confirm creators meet all criteria before granting marketplace privileges.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {CRITERIA.map(item => (
            <div key={item} className='flex items-start gap-2'>
              <CheckCircle2 className='mt-0.5 h-4 w-4 text-purple-500' />
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Status recap</CardTitle>
          <CardDescription>
            Current verification metadata pulled from your profile and the domain assignment
            service.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 text-sm sm:grid-cols-2'>
          <StatusPill
            heading='Profile completeness'
            value={verification.profileComplete ? 'Complete' : 'Needs updates'}
          />
          <StatusPill
            heading='Marketplace access'
            value={verification.adminVerified ? 'Enabled' : 'Disabled until verification'}
          />
          <StatusPill
            heading='Created on'
            value={
              verification.createdDate
                ? format(verification.createdDate, 'dd MMM yyyy')
                : 'Not recorded'
            }
          />
          <StatusPill
            heading='Last reviewed'
            value={
              verification.lastUpdated
                ? format(verification.lastUpdated, 'dd MMM yyyy')
                : 'Not recorded'
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatusPill({ heading, value }: { heading: string; value: string }) {
  return (
    <div className='rounded-lg border border-dashed border-blue-200/40 bg-blue-50/60 p-4'>
      <p className='text-muted-foreground text-xs tracking-wide uppercase'>{heading}</p>
      <p className='text-sm font-semibold'>{value}</p>
    </div>
  );
}
