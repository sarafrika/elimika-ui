'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookingCard } from './BookingCard';
import { LiveClassCard } from './LiveClassCard';
import { ManageCourseCard } from './ManageCourseCard';
import { TrainingHubHeader } from './TrainingHubHeader';
import { TrainingHubSectionHeader } from './TrainingHubSectionHeader';
import { TrainingHubToolbar } from './TrainingHubToolbar';
import { WaitingListItem } from './WaitingListItem';
import { bookingPreviews, waitingList } from './training-hub-data';
import { useInstructorTrainingHubData } from './useInstructorTrainingHubData';

export function InstructorTrainingHubPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'manage-courses' | 'live-classes'>('all');
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'approved' | 'today' | 'tomorrow' | 'upcoming'
  >('all');
  const { liveClasses, managedCourses, isLoading: isLoadingManagedCourses } =
    useInstructorTrainingHubData();

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
        [liveClass.title, liveClass.provider, liveClass.day, liveClass.time].some(value =>
          value.toLowerCase().includes(normalizedSearch)
        ) &&
        (selectedStatus === 'all' || liveClass.status === selectedStatus)
      ),
    [liveClasses, normalizedSearch, selectedStatus, selectedType]
  );

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
      bookingPreviews.filter(booking =>
        [booking.title, booking.subtitle, booking.status].some(value =>
          value.toLowerCase().includes(normalizedSearch)
        )
      ),
    [bookingPreviews, normalizedSearch]
  );

  return (
    <main className='mx-auto flex w-full max-w-[1450px] flex-col gap-4 bg-white px-3 py-3 sm:px-4 sm:py-4 lg:px-5'>
      <TrainingHubHeader />
      <TrainingHubToolbar
        onSearchTermChange={setSearchTerm}
        onStatusChange={setSelectedStatus}
        onTypeChange={setSelectedType}
        searchTerm={searchTerm}
        selectedStatus={selectedStatus}
        selectedType={selectedType}
      />

      <section className='grid gap-4 min-[1380px]:grid-cols-[minmax(0,1fr)_300px]'>
        <div className='grid gap-4 lg:grid-cols-[minmax(280px,0.92fr)_minmax(340px,1.18fr)] min-[1450px]:grid-cols-[minmax(300px,0.94fr)_minmax(420px,1.2fr)]'>
          <div className='space-y-3'>
            <TrainingHubSectionHeader title='Manage Courses' />
            <div className='space-y-3'>
              <p className='text-sm text-muted-foreground'>
                List of courses approved to train.
              </p>

              {filteredManagedCourses.map(course => (
                <ManageCourseCard key={course.id} course={course} />
              ))}
              {!isLoadingManagedCourses &&
                filteredManagedCourses.length === 0 &&
                selectedType !== 'live-classes' ? (
                <Card className='border-border/60 bg-white shadow-[0_10px_24px_rgba(31,79,183,0.05)]'>
                  <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                    No approved courses matched your search.
                  </CardContent>
                </Card>
              ) : null}
              {isLoadingManagedCourses ? (
                <Card className='border-border/60 bg-white shadow-[0_10px_24px_rgba(31,79,183,0.05)]'>
                  <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                    Loading approved courses...
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          <div className='space-y-3'>
            <TrainingHubSectionHeader
              actionLabel='View Classes'
              href='/dashboard/classes'
              title='Live Classes'
            />
            <div className='space-y-3'>
              {filteredLiveClasses.map(liveClass => (
                <LiveClassCard key={liveClass.id} liveClass={liveClass} />
              ))}
              {filteredLiveClasses.length === 0 && selectedType !== 'manage-courses' ? (
                <Card className='border-border/60 bg-white shadow-[0_10px_24px_rgba(31,79,183,0.05)]'>
                  <CardContent className='py-10 text-center text-sm text-muted-foreground'>
                    No upcoming class instances matched your search.
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className='flex justify-center pt-1'>
              <Link
                href='/dashboard/classes'
                className='inline-flex items-center gap-1 text-[1rem] font-medium text-primary transition hover:text-primary/80'
              >
                View All Classes
              </Link>
            </div>
          </div>
        </div>

        <aside className='space-y-5'>
          <section className='space-y-3'>
            <TrainingHubSectionHeader
              actionLabel={`Show All (${waitingList.length})`}
              href='/dashboard/training-hub/waiting-list'
              title='Waiting List'
            />

            <div className='space-y-3'>
              {filteredWaitingList.slice(0, 3).map(student => (
                <WaitingListItem key={student.id} student={student} />
              ))}
              {filteredWaitingList.length === 0 ? (
                <Card className='border-border/60 bg-white shadow-[0_10px_24px_rgba(31,79,183,0.05)]'>
                  <CardContent className='py-8 text-center text-sm text-muted-foreground'>
                    No waitlisted students to show right now.
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className='flex justify-end'>
              <Link
                href='/dashboard/training-hub/waiting-list'
                className='inline-flex items-center gap-1 text-[0.94rem] font-medium text-primary transition hover:text-primary/80'
              >
                View Waiting List
              </Link>
            </div>
          </section>

          <section className='space-y-3'>
            <TrainingHubSectionHeader
              actionLabel={`Show All (${bookingPreviews.length})`}
              href='/dashboard/training-hub/bookings'
              title='Bookings'
            />

            <div className='space-y-3'>
              {filteredBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
              {filteredBookings.length === 0 ? (
                <Card className='border-border/60 bg-white shadow-[0_10px_24px_rgba(31,79,183,0.05)]'>
                  <CardContent className='py-8 text-center text-sm text-muted-foreground'>
                    No booking sessions matched your search.
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className='flex justify-end'>
              <Link
                href='/dashboard/training-hub/bookings'
                className='inline-flex items-center gap-1 text-[0.94rem] font-medium text-primary transition hover:text-primary/80'
              >
                View Bookings
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
