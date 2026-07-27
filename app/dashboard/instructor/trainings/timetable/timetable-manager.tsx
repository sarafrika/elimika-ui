'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Info } from 'lucide-react';
import { useState } from 'react';
import { DailyAvailabilityGrid } from '../../availability/components/daily-availability-grid';
import { MonthlyAvailabilityGrid } from '../../availability/components/monthly-availability-grid';
import type { AvailabilityData } from '../../availability/components/types';
import { WeeklyAvailabilityGrid } from '../../availability/components/weekly-availability-grid';

interface AvailabilityManagerProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
}

const LEGEND_ITEMS = [
  {
    id: 'available',
    label: 'Available',
    colorClass: 'bg-success/20 dark:bg-success/30 border-success/40 dark:border-success/50',
  },
  {
    id: 'booked',
    label: 'Booked',
    colorClass: 'bg-info/20 dark:bg-info/30 border-info/40 dark:border-info/50',
  },
  {
    id: 'blocked',
    label: 'Blocked',
    colorClass:
      'bg-destructive/20 dark:bg-destructive/30 border-destructive/40 dark:border-destructive/50',
  },
];

export default function TimetableManager({
  availabilityData,
  onAvailabilityUpdate,
}: AvailabilityManagerProps) {
  const [currentTab, setCurrentTab] = useState('weekly');
  const [isEditing, _setIsEditing] = useState(false);

  return (
    <div className='space-y-6'>
      {/* Main Calendar Area */}
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-foreground flex items-center gap-2'>
              <Calendar className='text-primary h-5 w-5' />
              Timetable Schedule
            </CardTitle>
          </div>
        </CardHeader>

        {/* Legend */}
        <div className='flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-center sm:gap-6'>
          <div className='flex flex-wrap items-center gap-4 sm:gap-6'>
            {LEGEND_ITEMS.map(item => (
              <div key={item.id} className='flex items-center gap-2'>
                <div
                  className={`h-4 w-4 rounded border ${item.colorClass}`}
                  aria-label={`${item.label} indicator`}
                />
                <span className='text-muted-foreground text-sm'>{item.label}</span>
              </div>
            ))}
          </div>

          <div className='text-muted-foreground flex items-center gap-2 sm:ml-auto'>
            <Info className='h-4 w-4 flex-shrink-0' />
            <span className='text-xs'>Click time slots to add or edit events</span>
          </div>
        </div>

        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className='w-full'>
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
