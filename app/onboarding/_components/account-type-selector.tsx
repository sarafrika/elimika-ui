import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Users, Building2, GraduationCap } from 'lucide-react';

const accountTypes = [
  {
    id: 'student',
    title: 'Student',
    description: 'Join courses, access learning materials, and track your progress.',
    href: '/onboarding/student',
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
    href: '/onboarding/instructor',
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
    href: '/onboarding/course-creator',
    icon: GraduationCap,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
  },
  {
    id: 'organisation',
    title: 'Organisation',
    description: 'Manage your organization, oversee instructors, and track progress.',
    href: '/onboarding/organisation',
    icon: Building2,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:bg-purple-100',
  },
] as const;

export default function AccountTypeSelector() {
  return (
    <div className='mx-auto grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-4'>
      {accountTypes.map(type => {
        const Icon = type.icon;

        return (
          <Link
            key={type.id}
            href={type.href}
            className={`group relative block rounded-3xl border-2 p-8 transition-all duration-300 ${type.borderColor} ${type.bgColor} ${type.hoverBg} hover:border-primary/30 focus:ring-primary/20 focus:border-primary hover:scale-[1.01] hover:shadow-xl focus:ring-4 focus:outline-none`}
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
              <h3 className='text-foreground group-hover:text-primary mb-3 text-2xl font-bold transition-colors'>
                {type.title}
              </h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{type.description}</p>
            </div>

            {/* Button */}
            <div className='flex justify-center'>
              <div
                className={`border-border text-foreground group-hover:border-primary group-hover:bg-primary flex w-full items-center justify-center gap-3 rounded-lg border-2 bg-white px-6 py-3 text-center font-medium transition-all duration-300 group-hover:text-white`}
              >
                Choose {type.title}
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
              </div>
            </div>

            {/* Decorative gradient overlay */}
            <div className='pointer-events-none absolute inset-0 rounded-3xl bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-20' />
          </Link>
        );
      })}
    </div>
  );
}
