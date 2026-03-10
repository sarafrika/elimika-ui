'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Star, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useInstructor } from '../../../../context/instructor-context';
import { getCoursesByInstructorOptions } from '../../../../services/client/@tanstack/react-query.gen';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30');
  const instructor = useInstructor();

  const statsCards = [
    { title: 'Total Students', value: '1,234', change: '+12%', icon: Users },
    { title: 'Active Courses', value: '24', change: '+3', icon: BookOpen },
    { title: 'Completion Rate', value: '87%', change: '+5%', icon: Trophy },
    { title: 'Avg. Rating', value: '4.8', change: '+0.2', icon: Star },
  ];

  const enrollmentData = [
    { month: 'Jan', students: 45 },
    { month: 'Feb', students: 52 },
    { month: 'Mar', students: 78 },
    { month: 'Apr', students: 95 },
    { month: 'May', students: 112 },
    { month: 'Jun', students: 134 },
  ];

  const coursePerformanceData = [
    { course: 'Web Development', enrolled: 234, completed: 198, rating: 4.9 },
    { course: 'Data Science', enrolled: 189, completed: 145, rating: 4.7 },
    { course: 'Mobile Apps', enrolled: 156, completed: 132, rating: 4.8 },
    { course: 'UI/UX Design', enrolled: 142, completed: 128, rating: 4.6 },
    { course: 'Cloud Computing', enrolled: 98, completed: 76, rating: 4.5 },
  ];

  const engagementData = [
    { day: 'Mon', hours: 3.2 },
    { day: 'Tue', hours: 4.1 },
    { day: 'Wed', hours: 3.8 },
    { day: 'Thu', hours: 4.5 },
    { day: 'Fri', hours: 3.9 },
    { day: 'Sat', hours: 2.4 },
    { day: 'Sun', hours: 1.8 },
  ];

  const completionDistribution = [
    { name: 'Completed', value: 68, color: 'hsl(var(--primary))' },
    { name: 'In Progress', value: 22, color: 'hsl(var(--accent))' },
    { name: 'Not Started', value: 10, color: 'hsl(var(--destructive))' },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 12400 },
    { month: 'Feb', revenue: 14200 },
    { month: 'Mar', revenue: 18900 },
    { month: 'Apr', revenue: 21500 },
    { month: 'May', revenue: 24800 },
    { month: 'Jun', revenue: 28300 },
  ];

  const topStudents = [
    { name: 'Alice Johnson', courses: 8, completion: 100, hours: 124 },
    { name: 'Bob Smith', courses: 6, completion: 98, hours: 98 },
    { name: 'Carol Williams', courses: 7, completion: 95, hours: 112 },
    { name: 'David Brown', courses: 5, completion: 92, hours: 87 },
    { name: 'Emma Davis', courses: 6, completion: 90, hours: 95 },
  ];

  const { data: courses } = useQuery({
    ...getCoursesByInstructorOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!instructor?.uuid,
  });
  const iCourses = [
    {
      uuid: 'c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl',
      name: 'Advanced Java Programming',
      course_creator_uuid: 'c1r2e3a4-5t6o-7r89-0abc-defghijklmno',
      category_uuids: [
        'c1a2t3e4-5g6o-7r8y-9a10-abcdefghijkl',
        'p1r2o3g4-5r6a-7m8m-9i10-abcdefghijkl',
      ],
      difficulty_uuid: 'd1i2f3f4-5i6c-7u8l-9t10-abcdefghijkl',
      description:
        'Comprehensive course covering advanced Java concepts and enterprise development',
      objectives: 'Master advanced Java features, design patterns, and enterprise frameworks',
      prerequisites: 'Basic Java knowledge and OOP concepts',
      duration_hours: 40,
      duration_minutes: 30,
      class_limit: 25,
      minimum_training_fee: 180,
      creator_share_percentage: 60,
      instructor_share_percentage: 40,
      revenue_share_notes: 'Creator retains 60% to cover tooling; instructors earn 40% net.',
      age_lower_limit: 18,
      age_upper_limit: 65,
      thumbnail_url: 'https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg',
      intro_video_url: 'https://cdn.sarafrika.com/courses/java-advanced-intro.mp4',
      banner_url: 'https://cdn.sarafrika.com/courses/java-advanced-banner.jpg',
      status: 'PUBLISHED',
      active: true,
      admin_approved: true,
      training_requirements: [
        {
          uuid: '5a8074cc-8893-497b-8d58-4b151c994a80',
          requirement_type: 'equipment',
          name: 'Dual-screen instructor workstation',
          quantity: 1,
          unit: 'workstation',
          is_mandatory: true,
        },
      ],
      created_date: '2024-04-01T12:00:00',
      created_by: 'instructor@sarafrika.com',
      updated_date: '2024-04-15T15:30:00',
      updated_by: 'instructor@sarafrika.com',
      category_names: ['Programming', 'Advanced Java'],
      total_duration_display: '40 hours 30 minutes',
      is_free: false,
      is_published: true,
      is_draft: false,
    },
  ];

  return (
    <div className='min-h-screen p-6'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <div className='flex justify-end'>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>Last 7 days</SelectItem>
              <SelectItem value='30'>Last 30 days</SelectItem>
              <SelectItem value='90'>Last 90 days</SelectItem>
              <SelectItem value='365'>Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className='flex items-center justify-between p-6'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>{stat.title}</p>
                  <h3 className='mt-2 text-2xl font-bold'>{stat.value}</h3>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {stat.change} from last period
                  </p>
                </div>
                <stat.icon className='text-muted-foreground h-12 w-12' />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue='overview' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='courses'>Courses</TabsTrigger>
            <TabsTrigger value='students'>Students</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Student Enrollment Trend</CardTitle>
                  <CardDescription>New students over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={300}>
                    <AreaChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='month' />
                      <YAxis />
                      <Tooltip />
                      <Area
                        dataKey='students'
                        stroke='hsl(var(--primary))'
                        fill='hsl(var(--primary))'
                        fillOpacity={0.25}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Engagement</CardTitle>
                  <CardDescription>Average hours per student</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='day' />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey='hours' fill='hsl(var(--accent))' />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
              <Card>
                <CardHeader>
                  <CardTitle>Course Status</CardTitle>
                  <CardDescription>Student progress distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={250}>
                    <PieChart>
                      <Pie data={completionDistribution} dataKey='value'>
                        {completionDistribution.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className='lg:col-span-2'>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with highest engagement</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {topStudents.map((student, i) => (
                    <div
                      key={i}
                      className='bg-muted flex items-center justify-between rounded-lg p-3'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full font-semibold'>
                          {student.name[0]}
                        </div>
                        <div>
                          <p className='font-medium'>{student.name}</p>
                          <p className='text-muted-foreground text-sm'>
                            {student.courses} courses • {student.hours}h
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-foreground text-lg font-bold'>{student.completion}%</p>
                        <p className='text-muted-foreground text-xs'>completion</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
