'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserDomain } from '@/lib/types';
import { BookOpen, GraduationCap, Sparkles, Users } from 'lucide-react';
import { BrandPill } from '@/components/ui/brand-pill';
import { useState } from 'react';

interface DomainSelectionProps {
  domains: UserDomain[];
  onDomainSelect: (domain: UserDomain) => void;
  userName?: string;
}

const domainConfig = {
  student: {
    icon: BookOpen,
    title: 'Student Dashboard',
    description: 'Access your courses, assignments, and academic progress.',
    color: 'text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/15',
    borderColor: 'border-primary/30 dark:border-primary/30',
  },
  instructor: {
    icon: GraduationCap,
    title: 'Instructor Dashboard',
    description: 'Manage your classes, create content, and track student performance.',
    color: 'text-success',
    bgColor: 'bg-success/10 dark:bg-success/20',
    borderColor: 'border-success/30 dark:border-success/30',
  },
  course_creator: {
    icon: Sparkles,
    title: 'Course Creator Dashboard',
    description: 'Design, publish, and monetise your courses across Elimika.',
    color: 'text-accent',
    bgColor: 'bg-accent/10 dark:bg-accent/20',
    borderColor: 'border-accent/30 dark:border-accent/30',
  },
  parent: {
    icon: Users,
    title: 'Parent Dashboard',
    description: 'Manage learner approvals, monitor progress, and stay on top of updates.',
    color: 'text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/15',
    borderColor: 'border-primary/30 dark:border-primary/30',
  },
  organisation_user: {
    icon: Users,
    title: 'Organization Dashboard',
    description: 'Oversee institutional operations, users, and system administration.',
    color: 'text-accent',
    bgColor: 'bg-accent/10 dark:bg-accent/20',
    borderColor: 'border-accent/30 dark:border-accent/30',
  },
  organisation: {
    icon: Users,
    title: 'Organization Dashboard',
    description: 'Oversee institutional operations, users, and system administration.',
    color: 'text-accent',
    bgColor: 'bg-accent/10 dark:bg-accent/20',
    borderColor: 'border-accent/30 dark:border-accent/30',
  },
  admin: {
    icon: Users,
    title: 'Admin Dashboard',
    description: 'System administration and platform management.',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 dark:bg-destructive/20',
    borderColor: 'border-destructive/30 dark:border-destructive/30',
  },
} as const;

export function DomainSelection({ domains, onDomainSelect, userName }: DomainSelectionProps) {
  const [selectedDomain, setSelectedDomain] = useState<UserDomain | null>(null);

  const handleDomainSelect = (domain: UserDomain) => {
    setSelectedDomain(domain);
  };

  const handleContinue = () => {
    if (selectedDomain) {
      onDomainSelect(selectedDomain);
    }
  };

  return (
    <div className='bg-background dark:bg-background flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-4xl'>
        <div className='mb-8 text-center'>
          <BrandPill className='mx-auto mb-4 text-xs tracking-[0.3em] normal-case'>
            Dashboard selection
          </BrandPill>
          <h1 className='text-foreground mb-2 text-3xl font-bold'>
            Welcome back{userName ? `, ${userName}` : ''}!
          </h1>
          <p className='text-muted-foreground text-lg'>
            You have access to multiple dashboards. Choose which one you&apos;d like to enter.
          </p>
        </div>

        <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3'>
          {domains.map(domain => {
            const config = domainConfig[domain];
            if (!config) return null;

            const Icon = config.icon;
            const isSelected = selectedDomain === domain;

            return (
              <Card
                key={domain}
                className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                  isSelected
                    ? `ring-offset-background ring-2 ring-offset-2 ${config.borderColor} ${config.bgColor}`
                    : 'hover:border-border'
                }`}
                onClick={() => handleDomainSelect(domain)}
              >
                <CardHeader className='pb-4 text-center'>
                  <div className={`mx-auto mb-4 rounded-full p-3 ${config.bgColor}`}>
                    <Icon className={`h-8 w-8 ${config.color}`} />
                  </div>
                  <CardTitle className='text-foreground text-xl font-semibold'>
                    {config.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className='text-muted-foreground text-center leading-relaxed'>
                    {config.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className='flex justify-center'>
          <Button
            size='lg'
            onClick={handleContinue}
            disabled={!selectedDomain}
            className='px-8 py-3 text-lg font-medium disabled:cursor-not-allowed disabled:opacity-50'
          >
            Continue to Dashboard
          </Button>
        </div>

        <div className='mt-6 text-center'>
          <p className='text-muted-foreground text-sm'>
            You can switch between dashboards anytime from your profile menu.
          </p>
        </div>
      </div>
    </div>
  );
}
