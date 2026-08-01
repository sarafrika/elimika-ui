'use client';

import { ArrowRight, CheckCircle, GraduationCap, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useInstructorStudentsData } from '../data';
import { CourseList } from './CourseList';
import { OverviewStats } from './OverviewStats';
import { RecentActivityList } from './RecentActivityList';

export function OverviewSidebar() {
  const router = useRouter();

  const [showAllCourses, setShowAllCourses] = useState(false);

  const { recentActivities, classes, students } = useInstructorStudentsData();

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const enrolledStudents = students.filter(student => student.status === 'Enrolled').length;
    const graduatedStudents = students.filter(student => student.status === 'Graduated').length;

    return [
      {
        value: totalStudents,
        label: 'Total Students',
        icon: <Users className='h-5 w-5' />,
      },
      {
        value: enrolledStudents,
        label: 'Enrolled',
        icon: <GraduationCap className='h-5 w-5' />,
        highlight: true,
      },
      {
        value: graduatedStudents,
        label: 'Graduated',
        icon: <CheckCircle className='h-5 w-5' />,
      },
    ];
  }, [students]);

  const visibleClasses = showAllCourses ? classes : classes.slice(0, 5);

  return (
    <aside className='w-full shrink-0 space-y-5 xl:w-90'>
      <section className='bg-card border-border space-y-3 rounded-xl border p-4'>
        <h2 className='text-foreground text-base font-semibold'>Overview</h2>

        <OverviewStats stats={stats} />
      </section>

      <section className='bg-card border-border space-y-3 rounded-xl border p-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-foreground text-base font-semibold'>Courses You Teach</h2>

          <button
            onClick={() => setShowAllCourses(prev => !prev)}
            className='text-primary hover:bg-primary/5 cursor-pointer rounded-sm p-2 text-xs font-medium'
          >
            {showAllCourses ? 'Show less' : 'View all'}
          </button>
        </div>

        <CourseList classes={visibleClasses} />

        <button
          onClick={() => router.push('/dashboard/instructor/training-hub')}
          className='text-primary hover:bg-primary/5 flex w-full cursor-pointer items-center justify-between rounded-sm p-2 text-sm font-medium'
        >
          View all courses
          <ArrowRight className='h-4 w-4' />
        </button>
      </section>

      <section className='bg-card border-border space-y-3 rounded-xl border p-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-foreground text-base font-semibold'>Recent Activity</h2>

          <button className='text-primary hover:bg-primary/5 cursor-pointer rounded-sm p-2 text-xs font-medium'>
            View all
          </button>
        </div>

        <RecentActivityList activities={recentActivities} />
      </section>
    </aside>
  );
}
