'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Users, GraduationCap, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/context/profile-context';
import { useRouter } from 'next/navigation';
import { UserDomain } from '@/lib/types';

type ProfileType = {
  id: UserDomain;
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
};

const profileTypes: ProfileType[] = [
  {
    id: 'student',
    title: 'Student',
    description: 'Join courses, access learning materials, and track your progress.',
    href: '/dashboard/add-profile/student',
    icon: BookOpen,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
  },
  {
    id: 'instructor',
    title: 'Instructor',
    description: 'Create courses, manage content, and engage with your students.',
    href: '/dashboard/add-profile/instructor',
    icon: Users,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverBg: 'hover:bg-green-100',
  },
  {
    id: 'course_creator',
    title: 'Course Creator',
    description: 'Design and publish courses, build your content library, and share your expertise.',
    href: '/dashboard/add-profile/course-creator',
    icon: GraduationCap,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
  },
];

export default function AddProfileSelector() {
  const profile = useUserProfile();
  const router = useRouter();

  // Filter out profile types that the user already has
  const existingDomains = (profile?.user_domain as UserDomain[]) || [];
  const availableProfiles = profileTypes.filter(
    profileType => !existingDomains.includes(profileType.id)
  );

  // If user already has all profile types, show a message
  if (availableProfiles.length === 0) {
    return (
      <div className='space-y-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6 text-sm leading-relaxed text-muted-foreground'>
        <div className='space-y-1'>
          <h2 className='text-lg font-semibold text-foreground'>All profiles added</h2>
          <p>
            You already have every available role. Use the dashboard switcher in the top bar to move
            between them whenever you need.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/overview')} variant='secondary' size='sm'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground'>
            Available roles
          </p>
          <p className='text-sm text-muted-foreground'>
            Choose the profile you want to add. We will guide you through a quick setup.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/overview')} variant='outline' size='sm'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to dashboard
        </Button>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {availableProfiles.map(type => {
          const Icon = type.icon;

          return (
            <Link
              key={type.id}
              href={type.href}
              className={`group relative block rounded-2xl border border-border/50 bg-background/90 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 ${type.hoverBg}`}
            >
              {/* Icon */}
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted'>
                <Icon className={`h-6 w-6 ${type.iconColor}`} />
              </div>

              {/* Content */}
              <div className='mb-6 space-y-2'>
                <h3 className='text-lg font-semibold text-foreground transition-colors group-hover:text-primary'>
                  {type.title}
                </h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{type.description}</p>
              </div>

              {/* Button */}
              <div className='flex justify-between text-sm font-medium text-primary group-hover:text-primary/90'>
                <span className='flex items-center gap-2'>
                  Add {type.title}
                </span>
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
              </div>

              {/* Decorative overlay */}
              <div className='pointer-events-none absolute inset-0 rounded-2xl border border-transparent transition-colors duration-200 group-hover:border-primary/30' />
            </Link>
          );
        })}
      </div>
    </>
  );
}
