'use client';

import { Separator } from '@/components/ui/separator';

interface SkillsFundLayoutProps {
  children: React.ReactNode;
}

export default function SkillsFundLayout({ children }: SkillsFundLayoutProps) {
  return (
    <div className='space-y-8 p-4 pb-16 md:p-10'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Skills Fund</h2>
        <p className='text-muted-foreground mt-1'>
          Empowering Growth through Skills Funding. Access scholarships, grants, and support for
          your learning journey.
        </p>
      </div>

      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 rounded-md shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="font-medium">🚧 This page is under construction.</p>
          <p className="text-sm text-yellow-900">Mock data is being used as placeholders here.</p>
        </div>
      </div>

      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1 lg:max-w-6xl mx-auto'>{children}</div>
      </div>
    </div>
  );
}
