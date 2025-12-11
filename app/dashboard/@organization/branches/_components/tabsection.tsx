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
import { type TrainingBranch } from '../../../../../services/client';
import Classroms from './classrooms';
import Courses from './courses';

export default function TabSection({ branch }: { branch: TrainingBranch }) {
  const [courseViewType, setCourseViewType] = useState<'list' | 'grid'>('list');
  return (
    <Tabs defaultValue='courses' className='mb-20'>
      <TabsList>
        <TabsTrigger value='courses'>Courses</TabsTrigger>
        <TabsTrigger value='classrooms'>Classrooms</TabsTrigger>
      </TabsList>
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

      <TabsContent value='classrooms'>
        <Card>
          <CardHeader>
            <CardTitle>Classrooms</CardTitle>
          </CardHeader>
          <CardContent>
            <Classroms />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
