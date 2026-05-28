'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import { BookingCard } from './BookingCard';
import { LiveClassCard } from './LiveClassCard';
import { TrainingHubHeader } from './TrainingHubHeader';
import { TrainingHubSectionHeader } from './TrainingHubSectionHeader';
import { TrainingHubToolbar } from './TrainingHubToolbar';
import { WaitingListItem } from './WaitingListItem';
import { useInstructorTrainingHubData } from './useInstructorTrainingHubData';

export function InstructorTrainingHubPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'manage-courses' | 'live-classes'>('all');
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'approved' | 'today' | 'tomorrow' | 'upcoming'
  >('all');
  const {
    liveClasses,
    managedCourses,
    upcomingBookings,
    waitingList,
    classes,
    isLoading: isLoadingManagedCourses,
  } = useInstructorTrainingHubData();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'training-hub', title: 'Training Hub', url: '/dashboard/training-hub', isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredManagedCourses = useMemo(
    () =>
      managedCourses.filter(course =>
        selectedType !== 'live-classes' &&
        [course.title, course.provider, course.level].some(value =>
          value.toLowerCase().includes(normalizedSearch)
        ) &&
        (selectedStatus === 'all' || selectedStatus === 'approved')
      ),
    [managedCourses, normalizedSearch, selectedStatus, selectedType]
  );

  const filteredLiveClasses = useMemo(
    () =>
      liveClasses.filter(liveClass =>
        selectedType !== 'manage-courses' &&
        [liveClass.title, liveClass.provider, liveClass.level, liveClass.classes, liveClass.students].some(value =>
          value.toLowerCase().includes(normalizedSearch)
        )
      ),
    [liveClasses, normalizedSearch, selectedType]
  );

  const visibleClasses = searchTerm.trim()
    ? filteredLiveClasses
    : filteredLiveClasses.slice(0, 5);

  const filteredWaitingList = useMemo(
    () =>
      waitingList.filter(student =>
        [student.name, student.email, student.classTitle].some(value =>
          value.toLowerCase().includes(normalizedSearch)
        )
      ),
    [normalizedSearch, waitingList]
  );

  const filteredBookings = useMemo(
    () =>
      upcomingBookings.filter(booking =>
        [booking.title, booking.subtitle, booking.status, booking.meta].some(value =>
          value.toLowerCase().includes(normalizedSearch)
        )
      ),
    [normalizedSearch, upcomingBookings]
  );

  return (
    <main className='mx-auto flex w-full max-w-[1450px] flex-col gap-4 bg-background px-3 py-3 sm:px-4 sm:py-4 lg:px-5'>

      <TrainingHubHeader />
      <TrainingHubToolbar
        onSearchTermChange={setSearchTerm}
        onStatusChange={setSelectedStatus}
        onTypeChange={setSelectedType}
        searchTerm={searchTerm}
        selectedStatus={selectedStatus}
        selectedType={selectedType}
      />


      <section className='grid w-full min-w-0 max-w-full gap-4 overflow-hidden xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]'>

        {/* <div className='min-w-0 space-y-3 overflow-hidden'>
            <div className='flex flex-row items-center gap-1'>
              <TrainingHubSectionHeader title='My Courses' number_of_items={managedCourses.length} />
            </div>

            <div className='space-y-3'>
              {filteredManagedCourses.map(course => (
                <ManageCourseCard key={course.id} course={course} />
              ))}

              {!isLoadingManagedCourses &&
                filteredManagedCourses.length === 0 &&
                selectedType !== 'live-classes' && (
                  <Card className='border-border/60 shadow-sm'>
                    <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                      No approved courses matched your search.
                    </CardContent>
                  </Card>
                )}

              {isLoadingManagedCourses && (
                <Card className='border-border/60 shadow-sm'>
                  <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                    Loading approved courses...
                  </CardContent>
                </Card>
              )}
            </div>
          </div> */}

        <div className='min-w-0 space-y-3 overflow-hidden'>
          <TrainingHubSectionHeader
            actionLabel={`View All (${classes?.length ?? 0})`}
            href='/dashboard/classes'
            title='My Classes'
          />

          <div className='space-y-3'>
            {visibleClasses.map(liveClass => (
              <LiveClassCard key={liveClass.id} liveClass={liveClass} />
            ))}

            {!isLoadingManagedCourses &&
              visibleClasses.length === 0 &&
              selectedType !== 'manage-courses' && (
                <Card className='border-border/60 shadow-sm'>
                  <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                    No created classes matched your search.
                  </CardContent>
                </Card>
              )}

            {isLoadingManagedCourses && selectedType !== 'manage-courses' && (
              <Card className='border-border/60 shadow-sm'>
                <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                  Loading classes...
                </CardContent>
              </Card>
            )}
          </div>

        </div>

        <aside className='min-w-0 space-y-5 overflow-hidden'>
          <section className='space-y-3'>
            <TrainingHubSectionHeader
              actionLabel={`Show All (${waitingList.length})`}
              href='/dashboard/training-hub/waiting-list'
              title='Waiting List'
            />

            {filteredWaitingList.length > 0 ? (
              <div className='space-y-3'>
                {filteredWaitingList.slice(0, 3).map(student => (
                  <WaitingListItem key={student.id} student={student} />
                ))}
              </div>
            ) : (
              <div className='mx-auto flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center'>
                <p className='text-sm font-medium text-foreground'>
                  No students on the waiting list
                </p>

                <p className='mt-1 text-sm text-muted-foreground'>
                  New waiting list requests will appear here.
                </p>
              </div>
            )}
          </section>

          <section className='space-y-3'>
            <TrainingHubSectionHeader
              actionLabel={`Show All (${upcomingBookings.length})`}
              href='/dashboard/training-hub/bookings'
              title='Bookings'
            />

            {filteredBookings.length > 0 ? (
              <div className='space-y-3'>
                {filteredBookings.slice(0, 3).map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <div className='flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center'>
                <p className='text-sm font-medium text-foreground'>
                  No upcoming bookings
                </p>

                <p className='mt-1 text-sm text-muted-foreground'>
                  Upcoming bookings will appear here.
                </p>
              </div>
            )}
          </section>

          <Button
            type='button'
            className='flex w-full items-center justify-center gap-3 rounded-[10px] bg-primary px-4 py-3 text-center text-[0.96rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          >
            <CalendarDays className='size-4 shrink-0' />
            <span className='truncate'>Invite Past Students</span>
            <span aria-hidden='true'>›</span>
          </Button>
        </aside>
      </section>
    </main>
  );
}
