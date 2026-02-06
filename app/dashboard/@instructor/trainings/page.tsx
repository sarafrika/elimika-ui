'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, LayoutDashboard, Users } from 'lucide-react';
import { useState } from 'react';
import { useInstructor } from '../../../../context/instructor-context';
import useInstructorClassesWithDetails from '../../../../hooks/use-instructor-classes';
import TrainingsPage from './overview/page';
import StudentsPage from './students/page';
import TimeTablePage from './timetable/page';

export default function TrainingManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const instructor = useInstructor();
  const { classes: classesWithCourseAndInstructor, loading } = useInstructorClassesWithDetails(
    instructor?.uuid as string
  );

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-8'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='overview'>
            <LayoutDashboard /> Overview
          </TabsTrigger>
          <TabsTrigger value='timetable'>
            <Calendar /> Timetable
          </TabsTrigger>
          <TabsTrigger value='students'>
            <Users /> Students
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <TrainingsPage
            classesWithCourseAndInstructor={classesWithCourseAndInstructor}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value='timetable' className='space-y-6'>
          <TimeTablePage
            classesWithCourseAndInstructor={classesWithCourseAndInstructor}
            loading={loading}
          />
          {/* <NewTimeTablePage
            classesWithCourseAndInstructor={classesWithCourseAndInstructor}
            loading={loading}
          /> */}
        </TabsContent>

        <TabsContent value='students' className='space-y-6'>
          <StudentsPage
            classesWithCourseAndInstructor={classesWithCourseAndInstructor}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
