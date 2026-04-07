'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cx, getCardClasses, getEmptyStateClasses, getStatCardClasses } from '@/lib/design-system';
import { format, isAfter } from 'date-fns';
import { CalendarDays, DoorOpen, ExternalLink, MapPin, Navigation, Video } from 'lucide-react';
import { CustomLoadingState } from '../../../@course_creator/_components/loading-state';
import {
  formatClassroomLabel,
  getClassData,
  humanizeEnum,
  type StudentClassRecord,
  type StudentScheduleInstance,
} from './schedule-data';

type Props = {
  classDefinitions: StudentClassRecord[];
  scheduleInstances: StudentScheduleInstance[];
  loading?: boolean;
};

function openMeetingLink(url?: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function ClassroomPage({ classDefinitions, loading, scheduleInstances }: Props) {
  if (loading) {
    return <CustomLoadingState subHeading='Preparing classrooms...' />;
  }

  const classroomRecords = classDefinitions.map(classRecord => {
    const classData = getClassData(classRecord);
    const nextSession = scheduleInstances.find(
      schedule =>
        schedule.classDefinitionUuid === classRecord.uuid &&
        isAfter(new Date(schedule.endTime), new Date())
    );

    const baseLocation = formatClassroomLabel({
      locationName: classData?.location_name,
      classroom: classData?.classroom,
      locationType: classData?.location_type,
    });

    return {
      uuid: classRecord.uuid,
      classTitle: classData?.title || classRecord.course?.name || 'Untitled class',
      courseName: classRecord.course?.name,
      locationType: classData?.location_type,
      locationName: classData?.location_name,
      classroom: classData?.classroom,
      baseLocation,
      nextSession,
      schedules: (classRecord.schedules ?? []).map(schedule => ({
        uuid: schedule.uuid,
        title: schedule.title || classData?.title || 'Scheduled session',
        startTime: schedule.start_time,
        locationLabel: formatClassroomLabel({
          locationName: schedule.location_name ?? classData?.location_name,
          classroom: schedule.room ?? classData?.classroom,
          locationType: schedule.location_type ?? classData?.location_type,
        }),
        meetingUrl: schedule.meeting_url ?? classData?.meeting_link,
      })),
    };
  });

  const roomsWithLocation = classroomRecords.filter(
    record =>
      record.locationName ||
      record.classroom ||
      record.nextSession?.locationLabel ||
      record.schedules.some(schedule => schedule.locationLabel !== 'Location pending')
  );

  const onlineReadyCount = classroomRecords.filter(
    record =>
      record.nextSession?.meetingUrl || record.schedules.some(schedule => schedule.meetingUrl)
  ).length;

  if (!roomsWithLocation.length) {
    return (
      <section className={getEmptyStateClasses()}>
        <DoorOpen className='text-primary/70 mb-2 h-12 w-12' />
        <h3 className='text-foreground text-lg font-semibold'>No classroom details yet</h3>
        <p className='text-muted-foreground max-w-md text-sm'>
          As rooms, venues, or meeting links are added to your classes and schedule instances, they
          will appear here automatically.
        </p>
      </section>
    );
  }

  return (
    <div className='space-y-6'>
      <section className='grid gap-4 lg:grid-cols-[0.9fr_1.1fr]'>
        <Card className={cx(getCardClasses(), 'p-5 sm:p-6')}>
          <CardContent className='space-y-4 p-0'>
            <div>
              <h2 className='text-foreground text-2xl font-semibold'>Classroom directory</h2>
              <p className='text-muted-foreground mt-1 text-sm'>
                Physical rooms and online meeting destinations are grouped here per enrolled class.
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <Card className={getStatCardClasses()}>
                <CardContent className='p-0'>
                  <div className='flex items-start gap-4'>
                    <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                      <MapPin className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-sm'>Classes with locations</p>
                      <p className='text-foreground text-2xl font-semibold'>
                        {roomsWithLocation.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={getStatCardClasses()}>
                <CardContent className='p-0'>
                  <div className='flex items-start gap-4'>
                    <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                      <Video className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-sm'>Launch-ready classes</p>
                      <p className='text-foreground text-2xl font-semibold'>{onlineReadyCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className={cx(getCardClasses(), 'p-5 sm:p-6')}>
          <CardContent className='space-y-3 p-0'>
            <div>
              <h3 className='text-foreground text-lg font-semibold'>What you can check here</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                The classroom label uses the most specific location available: schedule-instance
                room/location first, then the class-level classroom or venue.
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              {[
                {
                  icon: DoorOpen,
                  label: 'Classroom',
                  copy: 'Class-level room or venue',
                },
                {
                  icon: CalendarDays,
                  label: 'Session location',
                  copy: 'Overrides from a scheduled instance',
                },
                {
                  icon: Navigation,
                  label: 'Meeting launch',
                  copy: 'Open meeting links when present',
                },
              ].map(item => (
                <div
                  key={item.label}
                  className='border-border/60 bg-muted/30 rounded-2xl border p-4 text-sm'
                >
                  <item.icon className='text-primary mb-3 h-5 w-5' />
                  <p className='text-foreground font-medium'>{item.label}</p>
                  <p className='text-muted-foreground mt-1'>{item.copy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className='grid gap-6 xl:grid-cols-2'>
        {roomsWithLocation.map(record => (
          <Card key={record.uuid} className={cx(getCardClasses(), 'p-5 sm:p-6')}>
            <CardContent className='space-y-5 p-0'>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                <div className='space-y-2'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h3 className='text-foreground text-xl font-semibold'>{record.classTitle}</h3>
                    <Badge variant='outline'>
                      {humanizeEnum(record.locationType) || 'Classroom'}
                    </Badge>
                  </div>
                  {record.courseName && (
                    <p className='text-muted-foreground text-sm'>{record.courseName}</p>
                  )}
                </div>

                {record.nextSession?.meetingUrl && (
                  <Button onClick={() => openMeetingLink(record.nextSession?.meetingUrl)}>
                    Launch next class
                    <ExternalLink className='ml-2 h-4 w-4' />
                  </Button>
                )}
              </div>

              <div className='grid gap-3 md:grid-cols-2'>
                <div className='border-border/60 bg-muted/30 rounded-2xl border p-4'>
                  <p className='text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase'>
                    Classroom
                  </p>
                  <p className='text-foreground mt-2 text-sm font-medium'>{record.baseLocation}</p>
                </div>

                <div className='border-border/60 bg-muted/30 rounded-2xl border p-4'>
                  <p className='text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase'>
                    Next session
                  </p>
                  <p className='text-foreground mt-2 text-sm font-medium'>
                    {record.nextSession
                      ? `${format(new Date(record.nextSession.startTime), 'EEE, MMM d')} · ${record.nextSession.locationLabel}`
                      : 'No upcoming session'}
                  </p>
                </div>
              </div>

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-foreground text-sm font-semibold'>Scheduled instances</h4>
                  <Badge variant='secondary'>{record.schedules.length}</Badge>
                </div>

                <ScrollArea className='border-border/60 h-[260px] rounded-2xl border'>
                  <div className='space-y-3 p-3'>
                    {record.schedules.length > 0 ? (
                      record.schedules.map(schedule => (
                        <div
                          key={schedule.uuid}
                          className='border-border/60 bg-background rounded-2xl border p-4'
                        >
                          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                            <div className='space-y-1'>
                              <p className='text-foreground font-medium'>{schedule.title}</p>
                              <p className='text-muted-foreground text-sm'>
                                {format(new Date(schedule.startTime), 'EEEE, MMM d · h:mm a')}
                              </p>
                              <p className='text-muted-foreground text-sm'>
                                <span className='text-foreground font-medium'>Classroom:</span>{' '}
                                {schedule.locationLabel}
                              </p>
                            </div>

                            {schedule.meetingUrl && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => openMeetingLink(schedule.meetingUrl)}
                              >
                                Open link
                                <ExternalLink className='ml-2 h-3.5 w-3.5' />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className='border-border/60 text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm'>
                        No schedule instances added yet for this class.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
