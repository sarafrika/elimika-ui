'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { DailyAvailabilityGrid } from '../../availability/components/daily-availability-grid';
import { MonthlyAvailabilityGrid } from '../../availability/components/monthly-availability-grid';
import type { AvailabilityData } from '../../availability/components/types';
import { WeeklyAvailabilityGrid } from '../../availability/components/weekly-availability-grid';

interface AvailabilityManagerProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
}

export default function TimetableManager({
  availabilityData,
  onAvailabilityUpdate,
}: AvailabilityManagerProps) {
  const [currentTab, setCurrentTab] = useState('weekly');
  const [isEditing, _setIsEditing] = useState(false);

  return (
    <div className='space-y-6'>
      {/* Main Calendar Area */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Timetable Schedule
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='daily'>Daily View</TabsTrigger>
              <TabsTrigger value='weekly'>Weekly View</TabsTrigger>
              <TabsTrigger value='monthly'>Monthly View</TabsTrigger>
            </TabsList>

            <TabsContent value='daily' className='mt-6'>
              <DailyAvailabilityGrid
                availabilityData={availabilityData}
                onAvailabilityUpdate={onAvailabilityUpdate}
                isEditing={isEditing}
                classes={[]}
              />
            </TabsContent>

            <TabsContent value='weekly' className='mt-6'>
              <WeeklyAvailabilityGrid
                availabilityData={availabilityData}
                onAvailabilityUpdate={onAvailabilityUpdate}
                isEditing={isEditing}
                classes={[]}
              />
            </TabsContent>

            <TabsContent value='monthly' className='mt-6'>
              <MonthlyAvailabilityGrid
                availabilityData={availabilityData}
                onAvailabilityUpdate={onAvailabilityUpdate}
                isEditing={isEditing}
                classes={[]}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
