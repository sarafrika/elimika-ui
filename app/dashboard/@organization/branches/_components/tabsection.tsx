'use client';
import { Grid, List } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import { ResourceTypeEnum, type TrainingBranch } from '../../../../../services/client';
import BranchResources from './branch-resources';
import Courses from './courses';

export default function TabSection({ branch }: { branch: TrainingBranch }) {
  const [courseViewType, setCourseViewType] = useState<'list' | 'grid'>('list');
  const organisationUuid = branch.organisation_uuid ?? '';
  const branchUuid = branch.uuid ?? '';

  return (
    <Tabs defaultValue='venues' className='mb-20'>
      <TabsList>
        <TabsTrigger value='venues'>Venues (Classrooms)</TabsTrigger>
        <TabsTrigger value='resources'>Resources</TabsTrigger>
        <TabsTrigger value='courses'>Courses</TabsTrigger>
      </TabsList>

      <TabsContent value='venues'>
        <Card>
          <CardHeader>
            <CardTitle>Venues (Classrooms)</CardTitle>
            <CardDescription>Classrooms and labs available at this branch</CardDescription>
          </CardHeader>
          <CardContent>
            <BranchResources
              organisationUuid={organisationUuid}
              branchUuid={branchUuid}
              resourceType={ResourceTypeEnum.VENUE}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='resources'>
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Shared equipment available at this branch</CardDescription>
          </CardHeader>
          <CardContent>
            <BranchResources
              organisationUuid={organisationUuid}
              branchUuid={branchUuid}
              resourceType={ResourceTypeEnum.EQUIPMENT_POOL}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='courses'>
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>Courses offered in this branch</CardDescription>
            <CardAction>
              {courseViewType === 'grid' ? (
                <Button variant={'ghost'} onClick={() => setCourseViewType('list')}>
                  <List />
                </Button>
              ) : (
                <Button variant={'ghost'} onClick={() => setCourseViewType('grid')}>
                  <Grid />
                </Button>
              )}
            </CardAction>
          </CardHeader>
          <CardContent>
            <Courses viewType={courseViewType} user_uuid={branch.organisation_uuid} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
