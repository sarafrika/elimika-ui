import Link from 'next/link';
import { ArrowRight, BookOpen, Users, Building2, GraduationCap } from 'lucide-react';

const accountTypes = [
  {
    id: 'student',
    title: 'Student',
    description: 'Join courses, access learning materials, and track your progress.',
    href: '/onboarding/student',
    icon: BookOpen,
  },
  {
    id: 'instructor',
    title: 'Instructor',
    description: 'Create courses, manage content, and engage with your students.',
    href: '/onboarding/instructor',
    icon: Users,
  },
  {
    id: 'course_creator',
    title: 'Course Creator',
    description:
      'Design and publish courses, build your content library, and share your expertise.',
    href: '/onboarding/course-creator',
    icon: GraduationCap,
  },
  {
    id: 'organisation',
    title: 'Organisation',
    description: 'Manage your organization, oversee instructors, and track progress.',
    href: '/onboarding/organisation',
    icon: Building2,
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
            className='group relative block rounded-3xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20'
          >
            <div className='mb-6 flex justify-center'>
              <div
                className='flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-all duration-300 group-hover:scale-110 group-hover:ring-primary/25'
              >
                <Icon className='h-7 w-7' />
              </div>
            </div>

            <div className='mb-8 text-center'>
              <h3 className='text-foreground group-hover:text-primary mb-3 text-2xl font-bold transition-colors'>
                {type.title}
              </h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>{type.description}</p>
            </div>

            <div className='flex justify-center'>
              <div
                className='border-border text-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground flex w-full items-center justify-center gap-3 rounded-lg border bg-muted/60 px-6 py-3 text-center text-sm font-medium transition-all duration-300'
              >
                Choose {type.title}
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
              </div>
            </div>

            <div
              className='pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-border/60 transition duration-300 group-hover:ring-primary/40'
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}
