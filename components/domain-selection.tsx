'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserDomain } from '@/lib/types';
import { GraduationCap, Users, BookOpen } from 'lucide-react';
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
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  instructor: {
    icon: GraduationCap,
    title: 'Instructor Dashboard',
    description: 'Manage your classes, create content, and track student performance.',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  organisation_user: {
    icon: Users,
    title: 'Organization Dashboard',
    description: 'Oversee institutional operations, users, and system administration.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  organisation: {
    icon: Users,
    title: 'Organization Dashboard',
    description: 'Oversee institutional operations, users, and system administration.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  admin: {
    icon: Users,
    title: 'Admin Dashboard',
    description: 'System administration and platform management.',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
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
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800'>
      <div className='w-full max-w-4xl'>
        <div className='mb-8 text-center'>
          <h1 className='mb-2 text-3xl font-bold text-slate-900 dark:text-slate-100'>
            Welcome back{userName ? `, ${userName}` : ''}!
          </h1>
          <p className='text-lg text-slate-600 dark:text-slate-400'>
            You have access to multiple dashboards. Choose which one you&apos;d like to enter.
          </p>
        </div>

        <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
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
                    : 'hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                onClick={() => handleDomainSelect(domain)}
              >
                <CardHeader className='pb-4 text-center'>
                  <div className={`mx-auto mb-4 rounded-full p-3 ${config.bgColor}`}>
                    <Icon className={`h-8 w-8 ${config.color}`} />
                  </div>
                  <CardTitle className='text-xl font-semibold text-slate-900 dark:text-slate-100'>
                    {config.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className='text-center leading-relaxed text-slate-600 dark:text-slate-400'>
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
          <p className='text-sm text-slate-500 dark:text-slate-500'>
            You can switch between dashboards anytime from your profile menu.
          </p>
        </div>
      </div>
    </div>
  );
}
