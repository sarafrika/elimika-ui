'use client';

import { BookOpen, CheckCircle, Clock, PlusCircle, Star, TrendingUp, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../../../components/ui/button';

const elimikaDesignSystem = {
  components: {
    pageContainer: 'container mx-auto px-4 py-6 max-w-7xl',
  },
};

const MySkillsPage = () => {
  const router = useRouter();
  // Mock data - replace with actual data from your backend
  const [overallProgress] = useState(65);
  const [topSkills] = useState([
    { name: 'Web Development', level: 'Advanced', icon: '💻', color: 'bg-blue-500' },
    { name: 'Data Analysis', level: 'Intermediate', icon: '📊', color: 'bg-green-500' },
    { name: 'UI/UX Design', level: 'Intermediate', icon: '🎨', color: 'bg-purple-500' },
  ]);

  const [courses] = useState([
    {
      id: 1,
      title: 'Full Stack Web Development',
      status: 'complete',
      progress: 100,
      grade: 'A',
      completedDate: '2024-01-15',
      category: 'Development',
    },
    {
      id: 2,
      title: 'Advanced React & Next.js',
      status: 'incomplete',
      progress: 68,
      grade: null,
      completedDate: null,
      category: 'Development',
    },
    {
      id: 3,
      title: 'Python for Data Science',
      status: 'passed',
      progress: 100,
      grade: 'B+',
      completedDate: '2024-02-20',
      category: 'Data Science',
    },
    {
      id: 4,
      title: 'Introduction to Machine Learning',
      status: 'incomplete',
      progress: 45,
      grade: null,
      completedDate: null,
      category: 'Data Science',
    },
    {
      id: 5,
      title: 'Digital Marketing Fundamentals',
      status: 'failed',
      progress: 100,
      grade: 'F',
      completedDate: '2024-03-10',
      category: 'Marketing',
    },
    {
      id: 6,
      title: 'UI/UX Design Principles',
      status: 'incomplete',
      progress: 30,
      grade: null,
      completedDate: null,
      category: 'Design',
    },
  ]);

  const getStatusBadge = (status: any) => {
    const badges = {
      complete: {
        text: 'Completed',
        bg: 'bg-blue-100',
        text_color: 'text-blue-800',
        icon: CheckCircle,
      },
      passed: {
        text: 'Passed',
        bg: 'bg-green-100',
        text_color: 'text-green-800',
        icon: CheckCircle,
      },
      failed: { text: 'Failed', bg: 'bg-red-100', text_color: 'text-destructive', icon: XCircle },
      incomplete: {
        text: 'In Progress',
        bg: 'bg-yellow-100',
        text_color: 'text-yellow-800',
        icon: Clock,
      },
    };
    // @ts-ignore
    return badges[status] || badges.incomplete;
  };

  const getGradeColor = (grade: any) => {
    if (!grade) return 'text-muted-foreground';
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-destructive';
  };

  const stats = {
    total: courses.length,
    completed: courses.filter(c => c.status === 'complete' || c.status === 'passed').length,
    inProgress: courses.filter(c => c.status === 'incomplete').length,
    failed: courses.filter(c => c.status === 'failed').length,
  };

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>My Skills</h1>
            <p className='text-muted-foreground text-sm'>
              Review, track, and develop your skills. Add new competencies, monitor your progress,
              and showcase your expertise.
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/browse-courses')}
            size={'default'}
            className='bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 font-medium shadow-sm transition-colors'
          >
            <PlusCircle className='h-5 w-5' />
            Add New Skill
          </Button>
        </div>
      </section>

      <div className='my-6 flex flex-col gap-2 rounded-md border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-800 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <p className='font-medium'>🚧 This page is under construction.</p>
          <p className='text-sm text-yellow-900'>Mock data is being used for this template</p>
        </div>
      </div>

      {/* Hero Section - Skills Snapshot */}
      <section className='mb-8'>
        <div className='bg-muted border-input rounded-xl border p-6 shadow-sm'>
          <div className='mb-4 flex items-center gap-2'>
            <TrendingUp className='text-primary h-6 w-6' />
            <h2 className='text-foreground text-xl font-bold'>My Skills Snapshot</h2>
          </div>

          {/* Overall Progress */}
          <div className='mb-6'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-foreground text-sm font-medium'>Overall Skills Progress</span>
              <span className='text-primary text-2xl font-bold'>{overallProgress}%</span>
            </div>
            <div className='bg-background border-input h-3 w-full overflow-hidden rounded-full border'>
              <div
                className='bg-primary h-3 rounded-full transition-all duration-500'
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>Skills Verified</p>
          </div>

          {/* Top 3 Skills Badges */}
          <div>
            <h3 className='text-foreground mb-3 flex items-center gap-2 text-sm font-semibold'>
              <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
              Top Skills
            </h3>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              {topSkills.map((skill, index) => (
                <div
                  key={index}
                  className='bg-card border-input rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md'
                >
                  <div className='mb-2 flex items-start justify-between'>
                    <div
                      className={`${skill.color} flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-sm`}
                    >
                      {skill.icon}
                    </div>
                    <span className='bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs font-medium'>
                      #{index + 1}
                    </span>
                  </div>
                  <h4 className='text-foreground mb-1 text-sm font-semibold'>{skill.name}</h4>
                  <p className='text-muted-foreground text-xs'>{skill.level}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className='mb-6'>
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <BookOpen className='text-muted-foreground h-4 w-4' />
              <p className='text-muted-foreground text-xs'>Total Courses</p>
            </div>
            <p className='text-foreground text-2xl font-bold'>{stats.total}</p>
          </div>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              <p className='text-muted-foreground text-xs'>Completed</p>
            </div>
            <p className='text-2xl font-bold text-green-600'>{stats.completed}</p>
          </div>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <Clock className='h-4 w-4 text-yellow-500' />
              <p className='text-muted-foreground text-xs'>In Progress</p>
            </div>
            <p className='text-2xl font-bold text-yellow-600'>{stats.inProgress}</p>
          </div>
          <div className='bg-card border-input rounded-lg border p-4 shadow-sm'>
            <div className='mb-1 flex items-center gap-2'>
              <XCircle className='text-destructive h-4 w-4' />
              <p className='text-muted-foreground text-xs'>Failed</p>
            </div>
            <p className='text-destructive text-2xl font-bold'>{stats.failed}</p>
          </div>
        </div>
      </section>

      {/* Enrolled Courses List */}
      <section>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-foreground flex items-center gap-2 text-xl font-bold'>
            <BookOpen className='h-5 w-5' />
            Enrolled Courses
          </h2>
        </div>

        <div className='space-y-4'>
          {courses.map(course => {
            const statusInfo = getStatusBadge(course.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={course.id}
                className='bg-card border-input rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md'
              >
                <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                  <div className='flex-1'>
                    <div className='mb-2 flex items-start gap-3'>
                      <div className='mt-1'>
                        <StatusIcon className={`h-5 w-5 ${statusInfo.text_color}`} />
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-foreground mb-1 font-semibold'>{course.title}</h3>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${statusInfo.bg} ${statusInfo.text_color} font-medium`}
                          >
                            {statusInfo.text}
                          </span>
                          <span className='bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs'>
                            {course.category}
                          </span>
                          {course.grade && (
                            <span
                              className={`bg-muted rounded-full px-2 py-1 text-xs font-semibold ${getGradeColor(course.grade)}`}
                            >
                              Grade: {course.grade}
                            </span>
                          )}
                          {course.completedDate && (
                            <span className='text-muted-foreground text-xs'>
                              Completed: {new Date(course.completedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className='mt-3'>
                      <div className='mb-1 flex items-center justify-between'>
                        <span className='text-muted-foreground text-xs'>Progress</span>
                        <span className='text-foreground text-xs font-semibold'>
                          {course.progress}%
                        </span>
                      </div>
                      <div className='bg-background border-input h-2 w-full overflow-hidden rounded-full border'>
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            course.status === 'complete' || course.status === 'passed'
                              ? 'bg-success'
                              : course.status === 'failed'
                                ? 'bg-destructive'
                                : 'bg-yellow-500'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className='sm:ml-4'>
                    <button className='bg-muted text-foreground hover:bg-muted/80 border-input w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors sm:w-auto'>
                      View Course
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {courses.length === 0 && (
          <div className='bg-muted border-input rounded-lg border p-8 text-center'>
            <BookOpen className='text-muted-foreground mx-auto mb-3 h-12 w-12' />
            <h3 className='text-foreground mb-2 text-lg font-semibold'>No courses enrolled yet</h3>
            <p className='text-muted-foreground mb-4'>
              Start your learning journey by enrolling in a course
            </p>
            <button className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2 font-medium transition-colors'>
              Browse Courses
            </button>
          </div>
        )}
      </section>

      <section className='mb-20' />
    </div>
  );
};

export default MySkillsPage;
