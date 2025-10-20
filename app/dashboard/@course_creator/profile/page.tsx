'use client';

import {
  ProfileSummaryMeta,
  ProfileSummarySection,
  ProfileSummaryView,
} from '@/components/profile/profile-summary-view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCourseCreator } from '@/context/course-creator-context';
import { domainBadgeClass, formatDomainLabel } from '@/lib/domain-utils';
import { CheckCircle2, Globe, Mail, MapPin, Pencil, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function CourseCreatorProfilePage() {
  const { profile, data } = useCourseCreator();

  if (!profile) {
    return (
      <div className='mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-20 text-center'>
        <h1 className='text-2xl font-semibold'>No creator profile found</h1>
        <p className='text-muted-foreground text-sm'>
          Create a course creator record during onboarding or contact support to restore access.
        </p>
        <Button asChild>
          <Link prefetch href='/dashboard/overview'>
            Return to overview
          </Link>
        </Button>
      </div>
    );
  }

  const meta: ProfileSummaryMeta[] = [];
  if (profile.website) {
    meta.push({
      icon: <Globe className='h-4 w-4' />,
      label: 'Website',
      href: profile.website,
    });
  }
  if (profile.user_uuid) {
    meta.push({
      icon: <Mail className='h-4 w-4' />,
      label: (
        <span className='inline-flex items-center gap-1'>
          User UUID: {profile.user_uuid.slice(0, 8)}…
        </span>
      ),
    });
  }

  const sections: ProfileSummarySection[] = [
    {
      title: 'About',
      description: 'Ensure potential learners and partners understand your expertise.',
      content: (
        <div className='space-y-4 text-sm'>
          <div className='space-y-1'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>Bio</p>
            <p>{profile.bio || 'A professional summary has not been added yet.'}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Account',
      description: 'Your creator permissions and platform access.',
      items: [
        {
          label: 'Verification status',
          value: profile.admin_verified ? 'Admin verified' : 'Pending verification',
        },
        {
          label: 'Assigned domains',
          value:
            data.assignments.hasGlobalAccess || data.assignments.organisations.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                <Badge variant='outline' className={`${domainBadgeClass('course_creator')} border`}>
                  {formatDomainLabel('course_creator')}
                </Badge>
                {data.assignments.organisations.map((assignment, index) => (
                  <Badge
                    key={`${assignment.organisationUuid ?? index}-domain`}
                    variant='outline'
                    className={`${domainBadgeClass('organisation')} border`}
                  >
                    {assignment.organisationName ?? 'Organisation'}
                  </Badge>
                ))}
              </div>
            ) : undefined,
          emptyText: 'No domain assignments yet',
          valueClassName: 'space-y-2',
        },
      ],
    },
    {
      title: 'Assignments',
      description: 'Track global publishing access and organisation-specific responsibilities.',
      content: (
        <div className='space-y-3 text-sm'>
          <div className='rounded-lg border border-dashed border-blue-200/40 bg-blue-50/60 p-3'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>Marketplace</p>
            <p className='font-semibold'>
              {data.assignments.hasGlobalAccess
                ? 'Global publishing rights granted'
                : 'Marketplace access pending verification'}
            </p>
          </div>
          {data.assignments.organisations.length > 0 ? (
            <div className='space-y-2'>
              {data.assignments.organisations.map((assignment, index) => (
                <div
                  key={`${assignment.organisationUuid ?? index}-${assignment.branchUuid ?? 'branch'}`}
                  className='rounded-lg border border-border/50 p-3'
                >
                  <p className='font-semibold'>
                    {assignment.organisationName ?? 'Unnamed organisation'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {assignment.branchName ? (
                      <span className='inline-flex items-center gap-1'>
                        <MapPin className='h-3.5 w-3.5' />
                        {assignment.branchName}
                      </span>
                    ) : (
                      'No branch assignment'
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>
              You are not currently mapped to any organisations as a content developer.
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <ProfileSummaryView
      eyebrow='Creator profile'
      title={profile.full_name}
      headline={profile.professional_headline}
      badges={[
        {
          label: profile.admin_verified ? 'Verified' : 'Unverified',
          icon: profile.admin_verified ? (
            <CheckCircle2 className='h-3.5 w-3.5' />
          ) : (
            <ShieldAlert className='h-3.5 w-3.5' />
          ),
          variant: profile.admin_verified ? 'outline' : 'secondary',
        },
      ]}
      meta={meta}
      actions={
        <Button variant='outline' asChild>
          <Link prefetch href='/dashboard/profile'>
            <Pencil className='mr-2 h-4 w-4' />
            Edit profile
          </Link>
        </Button>
      }
      sections={sections}
    />
  );
}
