'use client';

import { Calendar, LayoutDashboard, Users } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import TrainingsPage from './overview/page';
import StudentsPage from './students/page';
import TimeTablePage from './timetable/page';

export default function TrainingManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-8'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='overview'>
            {' '}
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
          <TrainingsPage />
        </TabsContent>

        <TabsContent value='timetable' className='space-y-6'>
          <TimeTablePage />
        </TabsContent>

        <TabsContent value='students' className='space-y-6'>
          <StudentsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
