'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PageHeader } from '../../../../../components/page-header';
import AllApprovedPartners from './AllApprovedPartners';
import ApprovedInstructors from './ApprovedInstructors';
import ApprovedOrganisations from './ApprovedOrganisations';

export default function InstructorDirectory({
  initialType,
}: {
  initialType: 'all' | 'instructor' | 'organisation';
}) {
  const [type, setType] = useState(initialType);

  return (
    <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
      <PageHeader
        eyebrow='FREELANCERS AND ORGANISATIONS'
        title='Freelancers & Organisations'
        description='Freelancers and organisations approved to train courses you created.'
        actions={
          <Button variant='outline' asChild>
            <Link href='/dashboard/course-creator/pending-approvals'>Pending approvals</Link>
          </Button>
        }
      />

      <Tabs
        value={type}
        onValueChange={value => {
          if (value !== 'all' && value !== 'instructor' && value !== 'organisation') return;
          setType(value);
          const url = new URL(window.location.href);
          url.searchParams.set('type', value);
          window.history.replaceState(null, '', url);
        }}
        className='space-y-6'
      >
        <TabsList aria-label='Filter by trainer type' className='h-auto flex-wrap'>
          <TabsTrigger value='all'>
            <Users className='mr-2 size-4' />
            All
          </TabsTrigger>
          <TabsTrigger value='instructor'>
            <GraduationCap className='mr-2 size-4' />
            Freelancer
          </TabsTrigger>
          <TabsTrigger value='organisation'>
            <Building2 className='mr-2 size-4' />
            Organisation
          </TabsTrigger>
        </TabsList>
        <TabsContent value='all'>
          <AllApprovedPartners />
        </TabsContent>
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
