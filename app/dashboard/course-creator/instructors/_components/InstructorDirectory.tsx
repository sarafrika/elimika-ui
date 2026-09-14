'use client';

import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import ApprovedInstructors from './ApprovedInstructors';
import ApprovedOrganisations from './ApprovedOrganisations';

export default function InstructorDirectory({
  initialType,
}: {
  initialType: 'instructor' | 'organisation';
}) {
  const [type, setType] = useState(initialType);

  return (
    <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
      <PageHeader
        title='Instructors & Organisations'
        description='Instructors and organisations approved to train courses you created.'
        actions={
          <Button variant='outline' asChild>
            <Link href='/dashboard/course-creator/pending-approvals'>Pending approvals</Link>
          </Button>
        }
      />
      <Tabs
        value={type}
        onValueChange={value => {
          if (value !== 'instructor' && value !== 'organisation') return;
          setType(value);
          const url = new URL(window.location.href);
          url.searchParams.set('type', value);
          window.history.replaceState(null, '', url);
        }}
        className='space-y-6'
      >
        <TabsList aria-label='Filter by trainer type' className='h-auto flex-wrap'>
          <TabsTrigger value='instructor'>
            <GraduationCap className='mr-2 size-4' />
            Instructors
          </TabsTrigger>
          <TabsTrigger value='organisation'>
            <Building2 className='mr-2 size-4' />
            Organisations
          </TabsTrigger>
        </TabsList>
        <TabsContent value='instructor'>
          <ApprovedInstructors />
        </TabsContent>
        <TabsContent value='organisation'>
          <ApprovedOrganisations />
        </TabsContent>
      </Tabs>
    </main>
  );
}
