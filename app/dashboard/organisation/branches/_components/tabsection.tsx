'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceTypeEnum, type TrainingBranch } from '@/services/client';
import BranchCourses from './branch-courses';
import BranchResources from './branch-resources';

export default function TabSection({ branch }: { branch: TrainingBranch }) {
  const organisationUuid = branch.organisation_uuid ?? '';
  const branchUuid = branch.uuid ?? '';

  return (
    <Tabs defaultValue='venues' className='mb-20 gap-3'>
      <TabsList>
        <TabsTrigger value='venues'>Venues</TabsTrigger>
        <TabsTrigger value='equipment'>Equipment</TabsTrigger>
        <TabsTrigger value='courses'>Courses</TabsTrigger>
      </TabsList>

      <TabsContent value='venues'>
        <BranchResources branch={branch} resourceType={ResourceTypeEnum.VENUE} />
      </TabsContent>

      <TabsContent value='equipment'>
        <BranchResources branch={branch} resourceType={ResourceTypeEnum.EQUIPMENT_POOL} />
      </TabsContent>

      <TabsContent value='courses'>
        <section className='border-border/70 bg-card rounded-md border shadow-sm'>
          <div className='border-border/60 space-y-1 border-b px-5 py-4'>
            <h2 className='text-foreground text-base font-semibold'>Courses</h2>
            <p className='text-muted-foreground text-sm'>
              Courses taught in classes at {branch.branch_name || 'this branch'}.
            </p>
          </div>
          <div className='p-5'>
            <BranchCourses organisationUuid={organisationUuid} branchUuid={branchUuid} />
          </div>
        </section>
      </TabsContent>
    </Tabs>
  );
}
