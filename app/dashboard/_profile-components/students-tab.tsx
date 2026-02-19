'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { FileText, Mail, Phone, Shield, Tag, User, Users, VenusIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { searchEnrollmentsOptions } from '../../../services/client/@tanstack/react-query.gen';
import type { DomainTabProps, TabDefinition } from './types';

function TabShell({ children }: { children: React.ReactNode }) {
  return <div className='space-y-4 pt-5'>{children}</div>;
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className='border-border flex items-center gap-3 border-b py-2 last:border-0'>
      <span className='w-5 text-center text-base'>{icon}</span>
      <span className='text-muted-foreground w-28 shrink-0 text-xs'>{label}</span>
      <span className='text-foreground text-sm font-medium'>{value}</span>
    </div>
  );
}

function StudentAboutTab({ sharedProfile, userUuid }: DomainTabProps) {
  const student = sharedProfile;

  return (
    <TabShell>
      <div className='space-y-6'>
        {/* Top Section */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Student Information */}
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>Student Information</CardTitle>
            </CardHeader>

            <CardContent className='space-y-4'>
              <InfoRow
                icon={<User className='text-muted-foreground h-4 w-4' />}
                label='Full Name'
                value={sharedProfile?.full_name || 'Not provided'}
              />

              <InfoRow
                icon={<Phone className='text-muted-foreground h-4 w-4' />}
                label='Phone'
                value={sharedProfile?.phone || 'Not provided'}
              />

              <InfoRow
                icon={<Mail className='text-muted-foreground h-4 w-4' />}
                label='Email'
                value={sharedProfile?.email || 'Not provided'}
              />

              <InfoRow
                icon={<VenusIcon className='text-muted-foreground h-4 w-4' />}
                label='Gender'
                value={sharedProfile?.gender || 'Not provided'}
              />

              {student?.address && (
                <InfoRow
                  icon={<Tag className='text-muted-foreground h-4 w-4' />}
                  label='Age Group'
                  value={student.demographic_tag || 'Not provided'}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>Profile Summary</CardTitle>
            </CardHeader>

            <CardContent className='flex items-center gap-4'>
              <div className='bg-muted flex h-12 w-12 items-center justify-center rounded-full'>
                <User className='text-muted-foreground h-5 w-5' />
              </div>

              <div className='space-y-1'>
                <p className='text-sm font-medium'>
                  {sharedProfile?.full_name || 'Unnamed Student'}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {student?.demographic_tag || 'No demographic info'}
                </p>
              </div>
            </CardContent>

            <CardContent>
              <p
                className='text-muted-foreground text-sm leading-relaxed'
                dangerouslySetInnerHTML={{
                  __html: sharedProfile?.student_profile?.bio || 'No bio info',
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Guardian Section */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <Shield className='text-muted-foreground h-4 w-4' />
              Guardian Contacts
            </CardTitle>
          </CardHeader>

          <CardContent>
            {student ? (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <InfoRow
                  icon={<Users className='text-muted-foreground h-4 w-4' />}
                  label='Primary Guardian'
                  value={sharedProfile?.student_profile?.primaryGuardianContact || 'Not provided'}
                />

                <InfoRow
                  icon={<Users className='text-muted-foreground h-4 w-4' />}
                  label='Secondary Guardian'
                  value={sharedProfile?.student_profile?.secondaryGuardianContact || 'Not provided'}
                />
              </div>
            ) : (
              <div className='text-muted-foreground text-sm'>
                No guardian information available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TabShell>
  );
}

// ─── Enrolled Courses Tab ─────────────────────────────────────────────────────
interface EnrolledCourse {
  uuid: string;
  title: string;
  instructor: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  thumbnail_color: string;
}

const STATUS_VARIANT: Record<EnrolledCourse['status'], 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  paused: 'outline',
};

function StudentCoursesTab({ userUuid, sharedProfile }: DomainTabProps) {
  const { data, isLoading } = useQuery({
    ...searchEnrollmentsOptions({
      query: {
        pageable: {},
        searchParams: {
          student_uuid_eq: sharedProfile?.uuid,
        },
      },
    }),
    enabled: !!sharedProfile?.uuid,
  });

  const enrollments = data?.data?.content || [];
  const getUniqueBy = (array, key) => {
    const seen = new Set();
    return array.filter(item => {
      if (!item[key] || seen.has(item[key])) return false;
      seen.add(item[key]);
      return true;
    });
  };

  const uniqueScheduledInstances = getUniqueBy(enrollments, 'scheduled_instance_uuid');
  const uniqueCourses = getUniqueBy(enrollments, 'course_uuid');
  const uniquePrograms = getUniqueBy(enrollments, 'program_uuid');

  // useEffect(() => {
  //     // Replace with: fetch(`/api/students/${userUuid}/enrollments`)
  //     setTimeout(() => {
  //         setCourses([
  //             { uuid: '1', title: 'Intro to Music Theory', instructor: 'Ayomhi Ayo', progress: 72, status: 'active', thumbnail_color: 'bg-success/50' },
  //             { uuid: '2', title: 'Guitar Fundamentals', instructor: 'Jane Doe', progress: 100, status: 'completed', thumbnail_color: 'bg-success/50' },
  //             { uuid: '3', title: 'Digital Audio Production', instructor: 'Mark Bell', progress: 30, status: 'paused', thumbnail_color: 'bg-success/50' },
  //         ]);
  //         setIsLoading(false);
  //     }, 600);
  // }, [userUuid]);

  if (isLoading)
    return (
      <TabShell>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className='flex gap-4 pt-4'>
              <Skeleton className='h-14 w-14 shrink-0 rounded-lg' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
                <Skeleton className='h-2 w-full rounded-full' />
              </div>
            </CardContent>
          </Card>
        ))}
      </TabShell>
    );

  return (
    <TabShell>
      {uniqueCourses.length === 0 && (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
            <FileText className='text-muted-foreground mb-3 h-10 w-10' />
            <p className='text-muted-foreground text-sm'>No courses registered yet.</p>

            <Link
              href='/dashboard/browse-courses'
              className='bg-primary hover:bg-primary/70 mt-1 mt-2 inline-block rounded-md px-4 py-2 text-xs font-medium text-white transition active:scale-95'
            >
              Take a new course
            </Link>
          </CardContent>
        </Card>
      )}

      {uniqueCourses?.map(course => (
        <Card key={course.uuid}>
          <CardContent className='flex items-center gap-4 pt-4'>
            <div
              className='flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white'
              style={{ background: course.thumbnail_color }}
            >
              🎵
            </div>
            <div className='min-w-0 flex-1'>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-foreground truncate text-sm font-semibold'>{course.title}</p>
                <Badge
                  variant={STATUS_VARIANT[course.status]}
                  className='ml-2 shrink-0 text-xs capitalize'
                >
                  {course.status}
                </Badge>
              </div>
              <p className='text-muted-foreground mb-2 text-xs'>{course.instructor}</p>
              <div className='flex items-center gap-2'>
                <Progress value={course.progress} className='h-1.5 flex-1' />
                <span className='text-muted-foreground w-8 text-right text-xs font-medium'>
                  {course.progress}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </TabShell>
  );
}

// ─── Achievements Tab ─────────────────────────────────────────────────────────

interface Achievement {
  uuid: string;
  title: string;
  description: string;
  badge_emoji: string;
  earned_date: string;
}

function StudentAchievementsTab({ userUuid }: DomainTabProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    // Replace with: fetch(`/api/students/${userUuid}/achievements`)
    setAchievements([
      {
        uuid: '1',
        title: 'First Course Complete',
        description: 'Completed your first course',
        badge_emoji: '🎓',
        earned_date: 'Jan 2026',
      },
      {
        uuid: '2',
        title: '7-Day Streak',
        description: 'Logged in 7 days in a row',
        badge_emoji: '🔥',
        earned_date: 'Feb 2026',
      },
      {
        uuid: '3',
        title: 'Top Performer',
        description: 'Scored 95%+ on an assessment',
        badge_emoji: '⭐',
        earned_date: 'Feb 2026',
      },
    ]);
  }, [userUuid]);

  return (
    <TabShell>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {achievements.map(a => (
          <Card key={a.uuid} className='text-center'>
            <CardContent className='pt-6 pb-5'>
              <div className='mb-3 text-5xl'>{a.badge_emoji}</div>
              <p className='text-foreground text-sm font-bold'>{a.title}</p>
              <p className='text-muted-foreground mt-1 text-xs'>{a.description}</p>
              <p className='text-muted-foreground/60 mt-2 text-xs'>{a.earned_date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabShell>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

interface ScheduleItem {
  uuid: string;
  title: string;
  time: string;
  instructor: string;
  color: string;
}

function StudentScheduleTab({ userUuid }: DomainTabProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    // Replace with: fetch(`/api/students/${userUuid}/schedule`)
    setSchedule([
      {
        uuid: '1',
        title: 'Music Theory — Module 3',
        time: 'Mon, 10:00 AM',
        instructor: 'Ayomhi Ayo',
        color: '#',
      },
      {
        uuid: '2',
        title: 'Guitar Practice Session',
        time: 'Wed, 2:00 PM',
        instructor: 'Jane Doe',
        color: '#',
      },
      {
        uuid: '3',
        title: 'Audio Production Lab',
        time: 'Fri, 4:00 PM',
        instructor: 'Mark Bell',
        color: '#',
      },
    ]);
  }, [userUuid]);

  return (
    <TabShell>
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-semibold'>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 pt-0'>
          {schedule.map(item => (
            <div key={item.uuid} className='flex items-center gap-3'>
              <div
                className='w-1 shrink-0 self-stretch rounded-full'
                style={{ background: item.color }}
              />
              <div className='flex-1'>
                <p className='text-foreground text-sm font-semibold'>{item.title}</p>
                <p className='text-muted-foreground text-xs'>
                  {item.instructor} · {item.time}
                </p>
              </div>
              <Badge variant='outline' className='shrink-0 text-xs'>
                Upcoming
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </TabShell>
  );
}

// ─── Tab Registry Export ──────────────────────────────────────────────────────

export const studentTabs: TabDefinition[] = [
  { id: 'about', label: 'About', component: StudentAboutTab },
  { id: 'courses', label: 'My Courses', component: StudentCoursesTab },
  // { id: 'achievements', label: 'Achievements', component: StudentAchievementsTab },
  // { id: 'schedule', label: 'Schedule', component: StudentScheduleTab },
];
