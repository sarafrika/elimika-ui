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
    description:
      'Design and publish courses, build your content library, and share your expertise.',
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
      <div className='mx-auto max-w-2xl text-center'>
        <div className='rounded-3xl border-2 border-blue-200 bg-blue-50 p-12'>
          <h2 className='mb-4 text-2xl font-bold text-gray-900'>All Profiles Added!</h2>
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
    <>
      <div className='mb-8 flex justify-center'>
        <Button
          onClick={() => router.push('/dashboard/overview')}
          variant='outline'
          className='gap-2'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Dashboard
        </Button>
      </div>

      <div className='mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {availableProfiles.map(type => {
          const Icon = type.icon;

          return (
            <Link
              key={type.id}
              href={type.href}
              className={`group relative block rounded-3xl border-2 p-8 transition-all duration-300 ${type.borderColor} ${type.bgColor} ${type.hoverBg} hover:scale-[1.01] hover:border-blue-600/30 hover:shadow-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 focus:outline-none`}
            >
              {/* Icon */}
              <div className='mb-6 flex justify-center'>
                <div
                  className={`rounded-2xl bg-white p-4 shadow-sm transition-all duration-300 ${type.iconColor} group-hover:scale-110 group-hover:shadow-md`}
                >
                  <Icon className='h-8 w-8' />
                </div>
              </div>

              {/* Content */}
              <div className='mb-8 text-center'>
                <h3 className='text-foreground mb-3 text-2xl font-bold transition-colors group-hover:text-blue-600'>
                  {type.title}
                </h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{type.description}</p>
              </div>

              {/* Button */}
              <div className='flex justify-center'>
                <div
                  className={`border-border text-foreground flex w-full items-center justify-center gap-3 rounded-lg border-2 bg-white px-6 py-3 text-center font-medium transition-all duration-300 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white`}
                >
                  Add {type.title}
                  <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                </div>
              </div>

              {/* Decorative gradient overlay */}
              <div className='pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-5' />
            </Link>
          );
        })}
      </div>
    </>
  );
}
