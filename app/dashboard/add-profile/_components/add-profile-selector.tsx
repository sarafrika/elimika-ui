'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Users, GraduationCap, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/context/profile-context';
import { useRouter } from 'next/navigation';
import type { UserDomain } from '@/lib/types';
import { cn } from '@/lib/utils';

type ProfileAccent = {
  icon: string;
  iconBg: string;
  titleHover: string;
  cardAccent: string;
  buttonAccent: string;
  glow: string;
};

type ProfileType = {
  id: UserDomain;
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen;
  accent: ProfileAccent;
};

const profileTypes: ProfileType[] = [
  {
    id: 'student',
    title: 'Student',
    description: 'Join courses, access learning materials, and track your progress.',
    href: '/dashboard/add-profile/student',
    icon: BookOpen,
    accent: {
      icon: 'text-primary',
      iconBg: 'bg-primary/10',
      titleHover: 'group-hover:text-primary',
      cardAccent: 'hover:border-primary/40 focus-visible:ring-primary/20',
      buttonAccent:
        'group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground',
      glow: 'from-primary/40',
    },
  },
  {
    id: 'instructor',
    title: 'Instructor',
    description: 'Create courses, manage content, and engage with your students.',
    href: '/dashboard/add-profile/instructor',
    icon: Users,
    accent: {
      icon: 'text-success',
      iconBg: 'bg-success/10',
      titleHover: 'group-hover:text-success',
      cardAccent: 'hover:border-success/40 focus-visible:ring-success/20',
      buttonAccent:
        'group-hover:border-success group-hover:bg-success group-hover:text-success-foreground',
      glow: 'from-success/40',
    },
  },
  {
    id: 'course_creator',
    title: 'Course Creator',
    description:
      'Design and publish courses, build your content library, and share your expertise.',
    href: '/dashboard/add-profile/course-creator',
    icon: GraduationCap,
    accent: {
      icon: 'text-accent',
      iconBg: 'bg-accent/10',
      titleHover: 'group-hover:text-accent',
      cardAccent: 'hover:border-accent/40 focus-visible:ring-accent/20',
      buttonAccent:
        'group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground',
      glow: 'from-accent/40',
    },
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
      <div className='mx-auto max-w-2xl text-center'>
        <div className='border-border bg-card shadow-primary/5 rounded-3xl border p-12 shadow-lg'>
          <h2 className='text-foreground mb-4 text-2xl font-bold'>All Profiles Added!</h2>
          <p className='text-muted-foreground mb-6'>
            You already have all available profile types. You can switch between them using the
            dashboard switcher.
          </p>
          <Button onClick={() => router.push('/dashboard/overview')} variant='default'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {availableProfiles.map(type => {
        const Icon = type.icon;

        return (
          <Link
            key={type.id}
            href={type.href}
            className={cn(
              'group border-border bg-card/90 shadow-primary/5 dark:bg-card/70 relative block rounded-3xl border p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-4 focus-visible:outline-none',
              type.accent.cardAccent
            )}
          >
            {/* Icon */}
            <div className='mb-6 flex justify-center'>
              <div
                className={cn(
                  'rounded-2xl p-4 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md',
                  type.accent.icon,
                  type.accent.iconBg
                )}
              >
                <Icon className='h-8 w-8' />
              </div>
            </div>

            {/* Content */}
            <div className='mb-8 text-center'>
              <h3
                className={cn(
                  'text-foreground mb-3 text-2xl font-bold transition-colors',
                  type.accent.titleHover
                )}
              >
                {type.title}
              </h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{type.description}</p>
            </div>

            {/* Button */}
            <div className='flex justify-center'>
              <div
                className={cn(
                  'border-border text-foreground bg-card flex w-full items-center justify-center gap-3 rounded-lg border px-6 py-3 text-center font-medium transition-all duration-300',
                  type.accent.buttonAccent
                )}
              >
                Add {type.title}
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
              </div>
            </div>

            {/* Decorative gradient overlay */}
            <div
              className={cn(
                'bg-primary/10 pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-20',
                type.accent.glow
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}
