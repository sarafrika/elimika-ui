'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { MonthlyAvailabilityGrid } from '../../../@instructor/availability/components/monthly-availability-grid';
import { AvailabilityData } from '../../../@instructor/availability/components/types';
import { WeeklyAvailabilityGrid } from '../../../@instructor/availability/components/weekly-availability-grid';

interface AvailabilityManagerProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
}

export default function TimetableManager({
  availabilityData,
  onAvailabilityUpdate,
}: AvailabilityManagerProps) {
  const [currentTab, setCurrentTab] = useState('weekly');
  const [isEditing, setIsEditing] = useState(false);

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
            <CardDescription className='flex gap-1' >
              Found <p className='font-semibold'>{availabilityData?.events?.length}</p> class schedules
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='weekly'>Weekly View</TabsTrigger>
              <TabsTrigger value='monthly'>Monthly View</TabsTrigger>
              <TabsTrigger value='list'>Card View</TabsTrigger>
            </TabsList>

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

            <TabsContent value="list" className="mt-6">
              {availabilityData?.events?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {availabilityData.events.map((data, idx) => {
                    const date = new Date(data.date);
                    return (
                      <Card
                        key={idx}
                        className="shadow-sm border border-muted-foreground hover:shadow-md transition"
                      >
                        <CardHeader>
                          <div className="text-lg font-semibold">{data.title}</div>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-1">
                          <div className="flex flex-row items-center gap-2">
                            <p>{data.day}</p> {" - "}
                            <p>{date.toDateString()}</p>
                          </div>
                          <p>🕒 {data.startTime} - {data.endTime}</p>
                          <p>📍 {data.location}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-6 text-gray-500">No events available.</p>
              )}
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

