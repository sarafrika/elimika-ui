'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import {
  ProfileSummaryMeta,
  ProfileSummarySection,
  ProfileSummaryView,
} from '@/components/profile/profile-summary-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { useUserProfile } from '@/context/profile-context';
import { domainBadgeClass, formatDomainLabel } from '@/lib/domain-utils';
import { format } from 'date-fns';
import {
  Ban,
  BriefcaseBusiness,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Sparkles,
  UserCircle2,
} from 'lucide-react';
import Link from 'next/link';

function toDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function InstructorProfileOverviewPage() {
  const user = useUserProfile();

  if (!user || user.isLoading) {
    return (
      <div className='flex h-full items-center justify-center py-20'>
        <Spinner className='h-6 w-6 text-muted-foreground' />
      </div>
    );
  }

  const {
    first_name,
    middle_name,
    last_name,
    email,
    phone_number,
    username,
    profile_image_url,
    active,
    roles,
    user_domain,
    instructor,
  } = user;

  const initials = [first_name?.[0], last_name?.[0]].filter(Boolean).join('').toUpperCase();
  const fullName =
    instructor?.full_name ||
    [first_name, middle_name, last_name].filter(Boolean).join(' ') ||
    user.displayName ||
    user.fullName ||
    'Instructor';

  const meta: ProfileSummaryMeta[] = [];
  if (email) {
    meta.push({
      icon: <Mail className='h-4 w-4' />,
      label: email,
    });
  }
  if (phone_number) {
    meta.push({
      icon: <Phone className='h-4 w-4' />,
      label: phone_number,
    });
  }
  if (username) {
    meta.push({
      icon: <UserCircle2 className='h-4 w-4' />,
      label: `@${username}`,
    });
  }
  if (instructor?.website) {
    meta.push({
      icon: <Globe className='h-4 w-4' />,
      label: instructor.website,
      href: instructor.website,
    });
  }
  if (instructor?.formatted_location) {
    meta.push({
      icon: <MapPin className='h-4 w-4' />,
      label: instructor.formatted_location,
    });
  }

  const professionalSection: ProfileSummarySection = {
    title: 'Professional Summary',
    description: 'Key highlights learners and organisations see first.',
    content: (
      <div className='space-y-4 text-sm'>
        <div className='space-y-1'>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>Bio</p>
          {instructor?.bio ? (
            <HTMLTextPreview
              htmlContent={instructor.bio}
              className='prose prose-sm max-w-none text-muted-foreground'
            />
          ) : (
            <p className='text-muted-foreground'>Your professional story is not available yet.</p>
          )}
        </div>
      </div>
    ),
    items: [
      {
        label: 'Professional headline',
        value: instructor?.professional_headline || undefined,
        emptyText: 'Add a headline to showcase your expertise.',
      },
      {
        label: 'Website',
        value: instructor?.website ? (
          <a
            href={instructor.website}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:underline'
          >
            {instructor.website}
          </a>
        ) : undefined,
        emptyText: 'No website provided',
      },
      {
        label: 'Profile status',
        value: instructor?.is_profile_complete ? 'Complete' : 'In progress',
      },
    ],
  };

  const accountSection: ProfileSummarySection = {
    title: 'Account',
    description: 'Authentication and platform access.',
    items: [
      {
        label: 'Status',
        value: active ? 'Active' : 'Inactive',
      },
      {
        label: 'Verification',
        value: instructor?.admin_verified ? 'Admin verified' : 'Pending verification',
      },
      {
        label: 'Assigned domains',
        value:
          user_domain && user_domain.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {user_domain.map(domain => (
                <Badge
                  key={domain}
                  variant='outline'
                  className={`${domainBadgeClass(domain)} border`}
                >
                  {formatDomainLabel(domain)}
                </Badge>
              ))}
            </div>
          ) : undefined,
        emptyText: 'No domains assigned',
        valueClassName: 'space-y-2',
      },
      {
        label: 'Roles',
        value:
          roles && roles.length > 0
            ? roles.map(role => role.name).filter(Boolean).join(', ')
            : undefined,
        emptyText: 'No roles granted',
      },
    ],
  };

  const locationSection: ProfileSummarySection = {
    title: 'Location',
    description: 'Where learners can book you from.',
    items: [
      {
        label: 'Primary location',
        value: instructor?.formatted_location || undefined,
        emptyText: 'Location not set',
      },
      {
        label: 'Coordinates provided',
        value: instructor?.has_location_coordinates ? 'Yes' : 'Not yet',
      },
    ],
  };

  const educationSection: ProfileSummarySection =
    instructor?.educations && instructor.educations.length > 0
      ? {
          title: 'Education',
          description: 'Highest qualifications you have added.',
          content: (
            <div className='space-y-3'>
              {instructor.educations.map((education, index) => (
                <div
                  key={education.uuid ?? `${education.school_name}-${index}`}
                  className='rounded-lg border border-border/50 p-3'
                >
                  <p className='font-medium'>{education.qualification}</p>
                  <p className='text-muted-foreground text-sm'>{education.school_name}</p>
                  {education.year_completed ? (
                    <p className='text-muted-foreground text-xs'>
                      Completed in {education.year_completed}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ),
        }
      : {
          title: 'Education',
          description: 'Highest qualifications you have added.',
          emptyText: 'Add your education background to strengthen your profile.',
        };

  const experienceSection: ProfileSummarySection =
    instructor?.experience && instructor.experience.length > 0
      ? {
          title: 'Experience',
          description: 'Roles that demonstrate your expertise.',
          content: (
            <div className='space-y-3'>
              {instructor.experience.map((exp, index) => {
                const start = toDate(exp.start_date);
                const end = toDate(exp.end_date);
                const range =
                  start || end
                    ? `${start ? format(start, 'MMM yyyy') : 'Start?' } – ${
                        exp.is_current_position ? 'Present' : end ? format(end, 'MMM yyyy') : 'End?'
                      }`
                    : null;
                return (
                  <div
                    key={exp.uuid ?? `${exp.organization_name}-${index}`}
                    className='rounded-lg border border-border/50 p-3'
                  >
                    <p className='font-medium'>{exp.position}</p>
                    <p className='text-muted-foreground text-sm'>{exp.organization_name}</p>
                    {range ? <p className='text-muted-foreground text-xs'>{range}</p> : null}
                    {exp.responsibilities ? (
                      <p className='text-muted-foreground mt-2 text-sm'>{exp.responsibilities}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ),
        }
      : {
          title: 'Experience',
          description: 'Roles that demonstrate your expertise.',
          emptyText: 'Add relevant experience from the experience tab.',
        };

  const membershipSection: ProfileSummarySection =
    instructor?.membership && instructor.membership.length > 0
      ? {
          title: 'Professional Memberships',
          description: 'Industry organisations that recognise your work.',
          content: (
            <div className='space-y-3'>
              {instructor.membership.map((membership, index) => {
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
                    className='rounded-lg border border-border/50 p-3'
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
        }
      : {
          title: 'Professional Memberships',
          description: 'Industry organisations that recognise your work.',
          emptyText: 'List your professional memberships for credibility.',
        };

  const skillSection: ProfileSummarySection =
    instructor?.skills && instructor.skills.length > 0
      ? {
          title: 'Skills',
          description: 'Technical and facilitation strengths.',
          content: (
            <div className='flex flex-wrap gap-2'>
              {instructor.skills.map((skill, index) => (
                <Badge key={skill.uuid ?? `${skill.skill_name}-${index}`} variant='outline'>
                  <span className='inline-flex items-center gap-2'>
                    <Sparkles className='h-3.5 w-3.5' />
                    {skill.skill_name}
                    <span className='text-muted-foreground text-xs'>{skill.proficiency_level}</span>
                  </span>
                </Badge>
              ))}
            </div>
          ),
        }
      : {
          title: 'Skills',
          description: 'Technical and facilitation strengths.',
          emptyText: 'Add skills to help learners find you.',
        };

  return (
    <ProfileSummaryView
      eyebrow='Instructor profile'
      title={fullName}
      avatar={{
        src: profile_image_url,
        alt: `${fullName} avatar`,
        fallback: initials || 'IN',
      }}
      badges={[
        {
          label: active ? 'Active' : 'Inactive',
          icon: active ? <CheckCircle2 className='h-3.5 w-3.5' /> : <Ban className='h-3.5 w-3.5' />,
          variant: active ? 'outline' : 'secondary',
        },
        {
          label: instructor ? 'Instructor' : 'No instructor record',
          icon: instructor ? (
            <BriefcaseBusiness className='h-3.5 w-3.5' />
          ) : (
            <ShieldAlert className='h-3.5 w-3.5' />
          ),
          variant: instructor ? 'outline' : 'secondary',
        },
        {
          label: instructor?.admin_verified ? 'Verified' : 'Unverified',
          icon: instructor?.admin_verified ? (
            <CheckCircle2 className='h-3.5 w-3.5' />
          ) : (
            <ShieldAlert className='h-3.5 w-3.5' />
          ),
          variant: instructor?.admin_verified ? 'outline' : 'secondary',
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
      sections={[
        professionalSection,
        accountSection,
        locationSection,
        educationSection,
        experienceSection,
        membershipSection,
        skillSection,
      ]}
    />
  );
}
