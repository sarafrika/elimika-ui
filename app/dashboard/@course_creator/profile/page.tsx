'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import {
  type ProfileSummaryMeta,
  type ProfileSummarySection,
  ProfileSummaryView,
} from '@/components/profile/profile-summary-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { useCourseCreator } from '@/context/course-creator-context';
import { domainBadgeClass, formatDomainLabel } from '@/lib/domain-utils';
import type {
  CourseCreatorCertification,
  CourseCreatorProfessionalMembership,
} from '@/services/client';
import {
  getCourseCreatorCertificationsOptions,
  getCourseCreatorEducationOptions,
  getCourseCreatorExperienceOptions,
  getCourseCreatorMembershipsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle2, Globe, Mail, MapPin, Pencil, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';

function toDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function CourseCreatorProfilePage() {
  const { profile, data } = useCourseCreator();

  const { data: educationData } = useQuery({
    ...getCourseCreatorEducationOptions({
      path: { courseCreatorUuid: profile?.uuid as string },
    }),
    enabled: !!profile?.uuid,
  });

  const { data: experienceData } = useQuery({
    ...getCourseCreatorExperienceOptions({
      path: { courseCreatorUuid: profile?.uuid as string },
    }),
    enabled: !!profile?.uuid,
  });

  const { data: certificationsData } = useQuery({
    ...getCourseCreatorCertificationsOptions({
      path: { courseCreatorUuid: profile?.uuid as string },
    }),
    enabled: !!profile?.uuid,
  });

  const { data: membershipsData } = useQuery({
    ...getCourseCreatorMembershipsOptions({
      path: { courseCreatorUuid: profile?.uuid as string },
    }),
    enabled: !!profile?.uuid,
  });

  if (!profile) {
    return (
      <div className='mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-20 text-center'>
        <Spinner className='h-6 w-6 text-muted-foreground' />
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

  const educations = educationData?.data?.content || [];
  const experiences = experienceData?.data?.content || [];
  const certifications: CourseCreatorCertification[] = certificationsData?.data?.content || [];
  const memberships: CourseCreatorProfessionalMembership[] = membershipsData?.data?.content || [];

  const sections: ProfileSummarySection[] = [
    {
      title: 'About',
      description: 'Ensure potential learners and partners understand your expertise.',
      content: (
        <div className='space-y-4 text-sm'>
          <div className='space-y-1'>
            <p className='text-muted-foreground text-xs tracking-wide uppercase'>Bio</p>
            {profile.bio ? (
              <HTMLTextPreview
                htmlContent={profile.bio}
                className='prose prose-sm text-muted-foreground max-w-none'
              />
            ) : (
              <p className='text-muted-foreground'>
                A professional summary has not been added yet.
              </p>
            )}
          </div>
        </div>
      ),
      items: [
        {
          label: 'Professional headline',
          value: profile.professional_headline || undefined,
          emptyText: 'Add a headline to showcase your expertise.',
        },
        {
          label: 'Website',
          value: profile.website ? (
            <a
              href={profile.website}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:underline'
            >
              {profile.website}
            </a>
          ) : undefined,
          emptyText: 'No website provided',
        },
      ],
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
          <div className='rounded-lg border border-dashed border-border/60 bg-muted/40 p-3'>
            <p className='text-muted-foreground text-xs tracking-wide uppercase'>Marketplace</p>
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
                  className='border-border/50 rounded-lg border p-3'
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

  // Add Education section
  if (educations.length > 0) {
    sections.push({
      title: 'Education',
      description: 'Highest qualifications you have added.',
      content: (
        <div className='space-y-3'>
          {educations.map((education: any, index) => (
            <div
              key={education.uuid ?? `${education.institution}-${index}`}
              className='border-border/50 rounded-lg border p-3'
            >
              <p className='font-medium'>{education.degree}</p>
              <p className='text-muted-foreground text-sm'>{education.institution}</p>
              {education.graduation_date ? (
                <p className='text-muted-foreground text-xs'>
                  Graduated: {format(new Date(education.graduation_date), 'MMM yyyy')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ),
    });
  } else {
    sections.push({
      title: 'Education',
      description: 'Highest qualifications you have added.',
      emptyText: 'Add your education background to strengthen your profile.',
    });
  }

  // Add Experience section
  if (experiences.length > 0) {
    sections.push({
      title: 'Experience',
      description: 'Roles that demonstrate your expertise.',
      content: (
        <div className='space-y-3'>
          {experiences.map((exp: any, index) => {
            const start = toDate(exp.start_date);
            const end = toDate(exp.end_date);
            const range =
              start || end
                ? `${start ? format(start, 'MMM yyyy') : 'Start?'} – ${
                    exp.currently_working ? 'Present' : end ? format(end, 'MMM yyyy') : 'End?'
                  }`
                : null;
            return (
              <div
                key={exp.uuid ?? `${exp.company_name}-${index}`}
                className='border-border/50 rounded-lg border p-3'
              >
                <p className='font-medium'>{exp.job_title}</p>
                <p className='text-muted-foreground text-sm'>{exp.company_name}</p>
                {range ? <p className='text-muted-foreground text-xs'>{range}</p> : null}
                {exp.description ? (
                  <p className='text-muted-foreground mt-2 text-sm'>{exp.description}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ),
    });
  } else {
    sections.push({
      title: 'Experience',
      description: 'Roles that demonstrate your expertise.',
      emptyText: 'Add relevant experience from the experience tab.',
    });
  }

  // Add Certificates section
  if (certifications.length > 0) {
    sections.push({
      title: 'Certificates',
      description: 'Professional certifications and credentials.',
      content: (
        <div className='space-y-3'>
          {certifications.map((cert, index) => {
            const issued = toDate(cert.issued_date);
            const expires = toDate(cert.expiry_date);
            return (
              <div
                key={cert.uuid ?? `${cert.certification_name}-${index}`}
                className='border-border/50 rounded-lg border p-3'
              >
                <p className='font-medium'>{cert.certification_name || 'Certification'}</p>
                <p className='text-muted-foreground text-sm'>{cert.issuing_organization}</p>
                {issued ? (
                  <p className='text-muted-foreground text-xs'>
                    Issued: {format(issued, 'MMM yyyy')}
                    {expires ? ` • Expires: ${format(expires, 'MMM yyyy')}` : ''}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ),
    });
  } else {
    sections.push({
      title: 'Certificates',
      description: 'Professional certifications and credentials.',
      emptyText: 'Add certificates to build credibility.',
    });
  }

  // Add Professional Memberships section
  if (memberships.length > 0) {
    sections.push({
      title: 'Professional Memberships',
      description: 'Industry organisations that recognise your work.',
      content: (
        <div className='space-y-3'>
          {memberships.map((membership, index) => {
            const start = toDate(membership.start_date);
            const end = toDate(membership.end_date);
            const range =
              start || end
                ? `${start ? format(start, 'MMM yyyy') : 'Start?'} – ${
                    membership.is_active || !end ? 'Present' : format(end, 'MMM yyyy')
                  }`
                : null;
            return (
              <div
                key={membership.uuid ?? `${membership.organization_name}-${index}`}
                className='border-border/50 rounded-lg border p-3'
              >
                <p className='font-medium'>{membership.organization_name}</p>
                {membership.membership_number ? (
                  <p className='text-muted-foreground text-xs'>
                    Membership #{membership.membership_number}
                  </p>
                ) : null}
                {range ? (
                  <p className='text-muted-foreground text-xs'>Duration: {range}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ),
    });
  } else {
    sections.push({
      title: 'Professional Memberships',
      description: 'Industry organisations that recognise your work.',
      emptyText: 'List your professional memberships for credibility.',
    });
  }

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
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' asChild>
            <Link prefetch href='/dashboard/profile/general'>
              Edit general info
            </Link>
          </Button>
          <Button variant='ghost' asChild>
            <Link prefetch href='/dashboard/profile/education'>
              Manage qualifications
            </Link>
          </Button>
          <Button variant='ghost' asChild>
            <Link prefetch href='/dashboard/profile/experience'>
              Manage experience
            </Link>
          </Button>
        </div>
      }
      sections={sections}
    />
  );
}
