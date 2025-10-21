'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/context/profile-context';
import { getInstructorAvailabilityOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useBreadcrumb } from '../../../../../../context/breadcrumb-provider';
import { useInstructor } from '../../../../../../context/instructor-context';
import { ClassData } from '../../../trainings/create-new/academic-period-form';
import { AvailabilityData } from '../page';
import { AvailabilityBooking } from './availability-booking';
import { MonthlyAvailabilityGrid } from './monthly-availability-grid';
import { WeeklyAvailabilityGrid } from './weekly-availability-grid';

const availabilitySettings = {
  timezone: 'UTC',
  autoAcceptBookings: false,
  bufferTime: 15,
  workingHours: {
    start: '08:00',
    end: '18:00',
    startDate: Date.now(),
    endDate: '',
  },
};

interface AvailabilityManagerProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  classes: ClassData[];
}

export default function AvailabilityManager({
  availabilityData,
  onAvailabilityUpdate,
  classes,
}: AvailabilityManagerProps) {
  const user = useUserProfile();
  const instructor = useInstructor()
  const qc = useQueryClient();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'availability',
        title: 'Availability',
        url: '/dashboard/profile/availability',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  // data points
  // const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const { data: availabilitySlots, refetch } = useQuery(
    getInstructorAvailabilityOptions({ path: { instructorUuid: user?.instructor?.uuid as string } })
  );

  const [currentTab, setCurrentTab] = useState('weekly');
  const [isEditing, setIsEditing] = useState(false);
  const [quickAvailable, setQuickAvailable] = useState(false);
  const [workingHours, setWorkingHours] = useState(availabilitySettings?.workingHours);

  const getStatusInfo = () => {
    const totalSlots = availabilityData?.slots?.length;
    const availableSlots = availabilityData?.slots?.filter(
      slot => slot.is_available === true
    ).length;
    const blockedSlots = availabilityData?.slots?.filter(
      slot => slot.custom_pattern === 'BLOCKED_TIME_SLOT'
    ).length;
    // update booked slots
    const bookedSlots = availabilityData?.slots?.filter(
      slot => slot.custom_pattern === 'booked'
    ).length;

    if (Number(bookedSlots) > 0) {
      return { status: 'busy', label: 'Busy', color: 'bg-blue-500' };
    } else if (Number(availableSlots) > 0) {
      return { status: 'available', label: 'Available Now', color: 'bg-green-500' };
    } else {
      return { status: 'unavailable', label: 'Unavailable', color: 'bg-red-500' };
    }
  };

  const statusInfo = getStatusInfo();

  const handleQuickToggle = (available: boolean) => setQuickAvailable(available);
  const handleWorkingHoursChange = (
    field: 'start' | 'end' | 'startDate' | 'endDate',
    value: string
  ) => {
    const newHours = { ...workingHours, [field]: value };
    setWorkingHours(newHours);
    onAvailabilityUpdate({
      ...availabilityData,
      settings: {
        ...availabilityData.settings,
        workingHours: newHours,
      },
    });
  };

  // mutations
  // const weeklyAvailabilityMutation = useMutation(setInstructorWeeklyAvailabilityMutation())
  const handleWeeklyAvailability = () => {
    const payload = {
      instructor_uuid: user?.instructor?.uuid as string,
      day_of_week: 1,
      start_time: workingHours?.start,
      end_time: workingHours?.end,
      is_available: quickAvailable,
      recurrence_interval: 1,
      // effective_start_date: workingHours?.startDate, // undefined // new Date("2024-09-01"),
      // effective_end_date: workingHours?.endDate // "2024-12-31",
    };

    // weeklyAvailabilityMutation.mutate(
    //     {
    //         body: payload as any,
    //         path: { instructorUuid: user?.instructor?.uuid as string },
    //     },
    //     {
    //         onSuccess: (data) => {
    //             qc.invalidateQueries({ queryKey: getInstructorAvailabilityQueryKey({ path: { instructorUuid: user?.instructor?.uuid as string } }) })
    //             toast.success(data?.message || "Weekly availability set successfully");
    //             setIsEditing(false);
    //         },
    //     }
    // );
  };

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Avatar className='h-12 w-12'>
                <AvatarImage src={user?.profile_image_url} />
                <AvatarFallback>
                  {user?.instructor?.full_name
                    ?.split(' ')
                    .map(n => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className='text-xl font-medium'>{user?.instructor?.full_name}</h1>
                <div className='mt-1 flex items-center gap-2'>
                  <div className={`h-2 w-2 rounded-full ${statusInfo.color}`} />
                  <span className='text-muted-foreground text-sm'>{statusInfo.label}</span>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                onClick={() => {
                  if (isEditing) {
                    handleWeeklyAvailability();
                  } else {
                    setIsEditing(true);
                  }
                }}
                // disabled={weeklyAvailabilityMutation?.isPending}
                className='gap-2'
              >
                {/* {weeklyAvailabilityMutation?.isPending ? (
                                    <>
                                        <Spinner />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Edit className="w-4 h-4" />
                                        {isEditing ? 'Save Changes' : 'Edit Availability'}
                                    </>
                                )} */}
                Edit Availability
              </Button>

              {/* Settings hidden */}
              <Button variant='outline' className='hidden gap-2'>
                <Settings className='h-4 w-4' />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Availability Controls */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Quick Availability Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8'>
            <div className='space-y-2'>
              <Label>Quick Toggle</Label>
              <div className='flex items-center gap-4'>
                <Button
                  variant={quickAvailable ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handleQuickToggle(true)}
                >
                  <CheckCircle className='mr-2 h-4 w-4' />
                  Available All Day
                </Button>
                <Button
                  variant={!quickAvailable ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handleQuickToggle(false)}
                >
                  <XCircle className='mr-2 h-4 w-4' />
                  Unavailable
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Working Hours</Label>
              <div className='flex items-center gap-2'>
                <Input
                  type='time'
                  value={workingHours.start}
                  onChange={e => handleWorkingHoursChange('start', e.target.value)}
                  className='w-24'
                />
                <span className='text-muted-foreground text-sm'>to</span>
                <Input
                  type='time'
                  value={workingHours.end}
                  onChange={e => handleWorkingHoursChange('end', e.target.value)}
                  className='w-24'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Recurring Settings</Label>
              <div className='flex items-center gap-2'>
                <Switch id='repeat-weekly' />
                <Label htmlFor='repeat-weekly' className='text-sm'>
                  Repeat Weekly
                </Label>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Start Date to End Date</Label>
              <div className='flex items-center gap-2'>
                <Input
                  type='date'
                  value={workingHours.startDate}
                  onChange={e => handleWorkingHoursChange('startDate', e.target.value)}
                  className='w-auto'
                />
                <span className='text-muted-foreground text-sm'>to</span>
                <Input
                  type='date'
                  value={workingHours.endDate}
                  onChange={e => handleWorkingHoursChange('endDate', e.target.value)}
                  className='w-auto'
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Calendar Area */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Availability Calendar
            </CardTitle>
            <div className='flex items-center gap-4'>
              {/* Color Legend */}
              <div className='flex items-center gap-4 text-sm'>
                <div className='flex items-center gap-1'>
                  <div className='h-3 w-3 rounded bg-green-500' />
                  <span>Available</span>
                </div>
                <div className='flex items-center gap-1'>
                  <div className='h-3 w-3 rounded bg-red-500' />
                  <span>Unavailable</span>
                </div>
                <div className='flex items-center gap-1'>
                  <div className='h-3 w-3 rounded bg-yellow-500' />
                  <span>Reserved</span>
                </div>
                <div className='flex items-center gap-1'>
                  <div className='h-3 w-3 rounded bg-blue-500' />
                  <span>Booked</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='weekly'>Weekly View</TabsTrigger>
              <TabsTrigger value='monthly'>Monthly View</TabsTrigger>
              {/* <TabsTrigger value='yearly'>Yearly View</TabsTrigger> */}
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

            {/* <TabsContent value='yearly' className='mt-6'>
              <YearlyAvailabilityGrid
                availabilityData={availabilityData}
                onAvailabilityUpdate={onAvailabilityUpdate}
                isEditing={isEditing}
              />
            </TabsContent> */}
          </Tabs>
        </CardContent>
      </Card>

      {/* Booking Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Available Slots (Learner View)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityBooking
            availabilityData={availabilityData}
            onBookingRequest={slotId => {
              // Handle booking request
              // console.log('Booking requested for slot:', slotId);
            }}
          />
        </CardContent>
      </Card>

      {/* Notifications & Sync Section */}
      <div className='hidden grid-cols-1 gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5' />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label>Email Reminders</Label>
                <p className='text-muted-foreground text-sm'>Get notified before classes</p>
              </div>
              <Switch />
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <Label>Booking Notifications</Label>
                <p className='text-muted-foreground text-sm'>When someone books a slot</p>
              </div>
              <Switch />
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <Label>SMS Alerts</Label>
                <p className='text-muted-foreground text-sm'>Important updates via SMS</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <RefreshCw className='h-5 w-5' />
              Calendar Integration
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label>Google Calendar Sync</Label>
                <p className='text-muted-foreground text-sm'>Sync with your Google Calendar</p>
              </div>
              <Button variant='outline' size='sm'>
                Connect
              </Button>
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <Label>Outlook Integration</Label>
                <p className='text-muted-foreground text-sm'>Sync with Microsoft Outlook</p>
              </div>
              <Button variant='outline' size='sm'>
                Connect
              </Button>
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <Label>Auto-Block Busy Times</Label>
                <p className='text-muted-foreground text-sm'>Prevent double booking</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


