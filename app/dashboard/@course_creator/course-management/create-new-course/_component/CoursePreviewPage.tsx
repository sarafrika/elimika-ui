'use client';

import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { getCourseByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Award, BookOpen, Clock, Play, Target, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function CustomCoursePreview() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  const { difficultyMap } = useDifficultyLevels();

  const { data } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
    enabled: !!courseId,
  });
  const [activeTab, setActiveTab] = useState('overview');

  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className='bg-background mx-auto min-h-screen max-w-7xl'>
      {/* Status Banner */}
      {data?.data?.status === 'draft' && (
        <div className='bg-warning text-warning-foreground mb-2 rounded-md px-4 py-2 text-center font-medium'>
          <AlertCircle className='mr-2 inline-block h-4 w-4' />
          This course is currently in draft mode. Publish your course to enable other users to
          access this course.
        </div>
      )}

      {/* Hero Section with Banner */}
      <div className='relative mt-4 h-96 overflow-hidden rounded-lg'>
        <img
          src={data?.data?.banner_url}
          alt='Course Banner'
          className='h-full w-full object-cover opacity-40'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />

        <div className='absolute right-0 bottom-0 left-0 p-8'>
          <div className='mx-auto max-w-6xl'>
            <div className='mb-4 flex items-center gap-2'>
              <span className='bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-semibold'>
                {difficultyMap[data?.data?.difficulty_uuid as string]}
              </span>
              {!data?.data?.is_free && (
                <span className='bg-success text-success-foreground rounded-full px-3 py-1 text-sm font-semibold'>
                  Premium
                </span>
              )}
            </div>
            <h1 className='mb-4 text-5xl font-bold text-white'>{data?.data?.name}</h1>
            <div className='flex items-center gap-6 text-white/90'>
              <div className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                <span>{data?.data?.class_limit} seats available</span>
              </div>
              <div className='flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                <span>Self-paced</span>
              </div>
              <div className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                <span>
                  Ages {data?.data?.age_lower_limit}-{data?.data?.age_upper_limit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='mx-auto max-w-7xl px-4 py-8'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* Left Column - Main Content */}
          <div className='space-y-6 lg:col-span-2'>
            {/* Video Preview */}
            <div className='border-border bg-card overflow-hidden rounded-2xl border shadow-lg'>
              <div className='relative aspect-video bg-black'>
                {!isPlaying ? (
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <img
                      src={data?.data?.thumbnail_url}
                      alt='Course Thumbnail'
                      className='h-full w-full object-cover opacity-60'
                    />
                    <button
                      onClick={() => setIsPlaying(true)}
                      className='bg-primary hover:bg-primary/90 absolute z-10 flex h-20 w-20 transform items-center justify-center rounded-full shadow-2xl transition-all hover:scale-110'
                    >
                      <Play
                        className='fill-primary-foreground text-primary-foreground ml-1 h-10 w-10'
                        fill='currentColor'
                      />
                    </button>
                  </div>
                ) : (
                  <video
                    src={data?.data?.intro_video_url}
                    controls
                    autoPlay
                    className='h-full w-full'
                  />
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className='border-border bg-card overflow-hidden rounded-2xl border shadow-lg'>
              <div className='border-border border-b'>
                <nav className='flex'>
                  {['overview', 'objectives', 'prerequisites', 'details'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'border-primary text-primary border-b-2'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              <div className='p-6'>
                {activeTab === 'overview' && (
                  <div className='space-y-4'>
                    <h2 className='text-foreground text-2xl font-bold'>Course Description</h2>
                    <div
                      className='prose prose-sm text-foreground dark:prose-invert max-w-none'
                      dangerouslySetInnerHTML={{
                        __html: data?.data?.description,
                      }}
                    />
                  </div>
                )}

                {activeTab === 'objectives' && (
                  <div className='space-y-4'>
                    <h2 className='text-foreground text-2xl font-bold'>Learning Objectives</h2>
                    <div
                      className='prose prose-sm text-foreground dark:prose-invert max-w-none'
                      dangerouslySetInnerHTML={{
                        __html: data?.data?.objectives,
                      }}
                    />
                  </div>
                )}

                {activeTab === 'prerequisites' && (
                  <div className='space-y-4'>
                    <h2 className='text-foreground text-2xl font-bold'>Prerequisites</h2>
                    <div
                      className='prose prose-sm text-foreground dark:prose-invert max-w-none'
                      dangerouslySetInnerHTML={{
                        __html: data?.data?.prerequisites,
                      }}
                    />
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className='space-y-6'>
                    <h2 className='text-foreground text-2xl font-bold'>Course Details</h2>

                    <div className='grid grid-cols-2 gap-4'>
                      <div className='bg-muted/50 rounded-lg p-4'>
                        <p className='text-muted-foreground text-sm'>Difficulty Level</p>
                        <p className='text-foreground text-lg font-semibold'>
                          {difficultyMap[data?.data?.difficulty_uuid as string]}
                        </p>
                      </div>
                      <div className='bg-muted/50 rounded-lg p-4'>
                        <p className='text-muted-foreground text-sm'>Price</p>
                        <p className='text-foreground text-lg font-semibold'>
                          {data?.data?.is_free ? 'Free' : `${data?.data?.minimum_training_fee}`}
                        </p>
                      </div>
                      <div className='bg-muted/50 rounded-lg p-4'>
                        <p className='text-muted-foreground text-sm'>Class Size</p>
                        <p className='text-foreground text-lg font-semibold'>
                          Max {data?.data?.class_limit} students
                        </p>
                      </div>
                      <div className='bg-muted/50 rounded-lg p-4'>
                        <p className='text-muted-foreground text-sm'>Age Range</p>
                        <p className='text-foreground text-lg font-semibold'>
                          {data?.data?.age_lower_limit}-{data?.data?.age_upper_limit} years
                        </p>
                      </div>
                    </div>

                    <div className='border-border border-t pt-6'>
                      <h3 className='text-foreground mb-4 text-lg font-semibold'>
                        Learning Features
                      </h3>
                      {/* <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {data?.data?.learning_rules?.completion_rules_enabled ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                          )}
                          <span className="text-foreground">Completion rules enabled</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {data?.data?.learning_rules?.drip_schedule_enabled ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                          )}
                          <span className="text-foreground">Drip schedule content</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {data?.data?.compliance?.certificate_enabled ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                          )}
                          <span className="text-foreground">Certificate upon completion</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {data?.data?.compliance?.accessibility_captions ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                          )}
                          <span className="text-foreground">Accessibility captions</span>
                        </div>
                      </div> */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className='space-y-6'>
            {/* Enrollment Card */}
            <div className='border-border bg-card sticky top-6 space-y-4 rounded-2xl border p-6 shadow-lg'>
              <div className='space-y-4'>
                <div className='text-center'>
                  {data?.data?.is_free ? (
                    <p className='text-success text-4xl font-bold'>FREE</p>
                  ) : (
                    <div>
                      <p className='text-foreground text-4xl font-bold'>
                        {data?.data?.minimum_training_fee}
                      </p>
                      <p className='text-muted-foreground text-sm'>one-time payment</p>
                    </div>
                  )}
                </div>

                <button className='bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl px-6 py-4 font-semibold shadow-md transition-colors hover:shadow-lg'>
                  Enroll Now
                </button>

                <div className='border-border text-muted-foreground space-y-3 border-t pt-4 text-sm'>
                  <div className='flex items-center gap-3'>
                    <BookOpen className='text-primary h-5 w-5' />
                    <span>Full lifetime access</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Users className='text-primary h-5 w-5' />
                    <span>{data?.data?.class_limit} spots remaining</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Award className='text-primary h-5 w-5' />
                    <span>Certificate included</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Share Info (if applicable) */}
            {data?.data?.creator_share_percentage && (
              <div className='border-border bg-card space-y-3 rounded-2xl border p-6 shadow-lg'>
                <h3 className='text-foreground mb-4 text-lg font-semibold'>Revenue Share</h3>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Creator Share</span>
                    <span className='text-primary font-semibold'>
                      {data?.data?.creator_share_percentage}%
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Instructor Share</span>
                    <span className='text-primary font-semibold'>
                      {data?.data?.instructor_share_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Badges */}
            <div className='border-border bg-card rounded-2xl border p-6 shadow-lg'>
              <h3 className='text-foreground mb-4 text-lg font-semibold'>Compliance</h3>
              <div className='space-y-3'>
                {/* {data?.data?.compliance.copyright_confirmed && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Copyright Verified</span>
                  </div>
                )}
                {data?.data?.compliance.accessibility_captions && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Accessibility Compliant</span>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
