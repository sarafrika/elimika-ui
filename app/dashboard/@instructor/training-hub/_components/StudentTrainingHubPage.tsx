'use client';

import Link from 'next/link';
import { BookingCard } from './BookingCard';
import { LiveClassCard } from './LiveClassCard';
import { ManageCourseCard } from './ManageCourseCard';
import { TrainingHubHeader } from './TrainingHubHeader';
import { TrainingHubSectionHeader } from './TrainingHubSectionHeader';
import { TrainingHubToolbar } from './TrainingHubToolbar';
import { WaitingListItem } from './WaitingListItem';
import { bookings, liveClasses, managedCourses, waitingList } from './training-hub-data';

export function StudentTrainingHubPage() {
  return (
    <main className='mx-auto flex w-full max-w-[1450px] flex-col gap-4 bg-white px-3 py-3 sm:px-4 sm:py-4 lg:px-5'>
      <TrainingHubHeader />
      <TrainingHubToolbar />

      <section className='grid gap-4 min-[1380px]:grid-cols-[minmax(0,1fr)_300px]'>
        <div className='grid gap-4 lg:grid-cols-[minmax(280px,0.92fr)_minmax(340px,1.18fr)] min-[1450px]:grid-cols-[minmax(300px,0.94fr)_minmax(420px,1.2fr)]'>
          <div className='space-y-3'>
            <TrainingHubSectionHeader title='Manage Courses' />
            <div className='space-y-3'>
              {managedCourses.map(course => (
                <ManageCourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <TrainingHubSectionHeader
              actionLabel='View Classes'
              href='/dashboard/all-courses'
              title='Live Classes'
            />
            <div className='space-y-3'>
              {liveClasses.map(liveClass => (
                <LiveClassCard key={liveClass.id} liveClass={liveClass} />
              ))}
            </div>

            <div className='flex justify-center pt-1'>
              <Link
                href='/dashboard/all-courses'
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
              actionLabel='Show All (12)'
              href='/dashboard/invites'
              title='Waiting List'
            />

            <div className='space-y-3'>
              {waitingList.map(student => (
                <WaitingListItem key={student.id} student={student} />
              ))}
            </div>

            <div className='flex justify-end'>
              <Link
                href='/dashboard/invites'
                className='inline-flex items-center gap-1 text-[0.94rem] font-medium text-primary transition hover:text-primary/80'
              >
                View All Classes
              </Link>
            </div>
          </section>

          <section className='space-y-3'>
            <TrainingHubSectionHeader title='Bookings' />

            <div className='space-y-3'>
              {bookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
