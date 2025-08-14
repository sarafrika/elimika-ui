import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Users, Building2 } from 'lucide-react';

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
    <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
      {accountTypes.map((type) => {
        const Icon = type.icon;
        
        return (
          <Link
            key={type.id}
            href={type.href}
            className={`
              relative p-8 rounded-3xl border-2 transition-all duration-300 group block
              ${type.borderColor} ${type.bgColor} ${type.hoverBg} 
              hover:shadow-xl hover:scale-[1.01] hover:border-primary/30
              focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary
            `}
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className={`
                p-4 rounded-2xl transition-all duration-300 bg-white shadow-sm
                ${type.iconColor} group-hover:scale-110 group-hover:shadow-md
              `}>
                <Icon className="h-8 w-8" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                {type.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {type.description}
              </p>
            </div>

            {/* Button */}
            <div className="flex justify-center">
              <div className={`
                w-full py-3 px-6 rounded-lg border-2 border-border text-center
                bg-white text-foreground transition-all duration-300 font-medium
                group-hover:border-primary group-hover:bg-primary group-hover:text-white
                flex items-center justify-center gap-3
              `}>
                Choose {type.title}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-primary to-transparent" />
          </Link>
        );
      })}
    </div>
  );
}