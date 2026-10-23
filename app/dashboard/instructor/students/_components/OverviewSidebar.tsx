'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { InstructorStudentsData } from '../data';
import { CourseList } from './CourseList';
import { RecentActivityList } from './RecentActivityList';

export function OverviewSidebar({ data }: { data: InstructorStudentsData }) {
  const [showAllActivity, setShowAllActivity] = useState(false);
  const { recentActivities, classes, students } = data;

  return (
    <aside className='grid w-full min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-2'>
      <Card className='min-w-0 gap-0 rounded-2xl py-0 shadow-none'>
        <CardHeader className='flex flex-row items-center justify-between gap-3 px-5 pt-4 pb-2'>
          <h3 className='text-sm font-semibold'>Classes you teach</h3>
          <Button asChild variant='link' size='sm' className='h-auto shrink-0 p-0 text-xs'>
            <Link href='/dashboard/instructor/training-hub?tab=classes'>View all</Link>
          </Button>
        </CardHeader>
        <CardContent className='px-5 pb-4'>
          <CourseList classes={classes.slice(0, 5)} />
        </CardContent>
      </Card>
      <Card className='min-w-0 gap-0 rounded-2xl py-0 shadow-none'>
        <CardHeader className='flex flex-row items-center justify-between gap-3 px-5 pt-4 pb-2'>
          <h3 className='text-sm font-semibold'>Recent activity</h3>
          <Button
            variant='link'
            size='sm'
            className='h-auto shrink-0 p-0 text-xs'
            disabled={recentActivities.length <= 2}
            onClick={() => setShowAllActivity(previous => !previous)}
          >
            {showAllActivity ? 'Show less' : 'View all'}
          </Button>
        </CardHeader>
        <CardContent className='px-5 pb-4'>
          <RecentActivityList
            activities={showAllActivity ? recentActivities : recentActivities.slice(0, 2)}
            students={students}
          />
        </CardContent>
      </Card>
    </aside>
  );
}
