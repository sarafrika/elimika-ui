'use client';

import {
  ProfileSummaryMeta,
  ProfileSummarySection,
  ProfileSummaryView,
} from '@/components/profile/profile-summary-view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import { useUserProfile } from '@/context/profile-context';
import { domainBadgeClass, formatDomainLabel } from '@/lib/domain-utils';
import { format } from 'date-fns';
import {
  Ban,
  CheckCircle2,
  Mail,
  Phone,
  ShieldAlert,
  UserCircle2,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';

export default function StudentProfileOverviewPage() {
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
    gender,
    dob,
    profile_image_url,
    active,
    roles,
    user_domain,
    student,
  } = user;

  const initials = [first_name?.[0], last_name?.[0]].filter(Boolean).join('').toUpperCase();
  const fullName =
    [first_name, middle_name, last_name].filter(Boolean).join(' ') ||
    user.displayName ||
    user.fullName ||
    'Student';
  const dobFormatted = dob ? format(new Date(dob), 'dd MMM yyyy') : undefined;

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

  const personalSection: ProfileSummarySection = {
    title: 'Personal Details',
    description: 'Core information linked to your learner identity.',
    items: [
      { label: 'First name', value: first_name || undefined, emptyText: 'Not provided' },
      { label: 'Middle name', value: middle_name || undefined, emptyText: 'Not provided' },
      { label: 'Last name', value: last_name || undefined, emptyText: 'Not provided' },
      { label: 'Gender', value: gender || undefined, emptyText: 'Not specified' },
      { label: 'Date of birth', value: dobFormatted, emptyText: 'Not provided' },
    ],
  };

  const accountSection: ProfileSummarySection = {
    title: 'Account',
    description: 'Credentials and platform access information.',
    items: [
      { label: 'Username', value: username || undefined, emptyText: 'Not set' },
      {
        label: 'Status',
        value: active ? 'Active' : 'Inactive',
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

  const guardianSection: ProfileSummarySection = student
    ? {
        title: 'Guardian Information',
        description: 'Emergency contacts and responsible guardians.',
        items: [
          {
            label: 'Primary guardian name',
            value: student.first_guardian_name || undefined,
            emptyText: 'Not provided',
          },
          {
            label: 'Primary guardian phone',
            value: student.first_guardian_mobile || undefined,
            emptyText: 'Not provided',
          },
          {
            label: 'Secondary guardian name',
            value: student.second_guardian_name || undefined,
            emptyText: 'Not provided',
          },
          {
            label: 'Secondary guardian phone',
            value: student.second_guardian_mobile || undefined,
            emptyText: 'Not provided',
          },
        ],
      }
    : {
        title: 'Guardian Information',
        description: 'Emergency contacts and responsible guardians.',
        emptyText: 'Guardian details have not been added yet.',
      };

  return (
    <ProfileSummaryView
      eyebrow='Student profile'
      title={fullName}
      avatar={{
        src: profile_image_url,
        fallback: initials || 'ST',
        alt: `${fullName} avatar`,
      }}
      headline={user.organisation_uuid ? 'Linked to an organisation account' : undefined}
      badges={[
        {
          label: active ? 'Active' : 'Inactive',
          icon: active ? <CheckCircle2 className='h-3.5 w-3.5' /> : <Ban className='h-3.5 w-3.5' />,
          variant: active ? 'outline' : 'secondary',
        },
        {
          label: student ? 'Learner' : 'No learner record',
          icon: student ? <UsersRound className='h-3.5 w-3.5' /> : <ShieldAlert className='h-3.5 w-3.5' />,
          variant: student ? 'outline' : 'secondary',
        },
      ]}
      meta={meta}
      actions={
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link prefetch href='/dashboard/profile/general'>
              Edit general info
            </Link>
          </Button>
          <Button variant='ghost' asChild>
            <Link prefetch href='/dashboard/profile/guardian-information'>
              Manage guardians
            </Link>
          </Button>
        </div>
      }
      sections={[personalSection, accountSection, guardianSection]}
    />
  );
}
