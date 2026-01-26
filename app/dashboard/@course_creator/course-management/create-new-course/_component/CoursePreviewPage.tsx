'use client';

import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { getCourseByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Award,
  BookOpen,
  Clock,
  Play,
  Target,
  Users,
} from 'lucide-react';
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
    <div className="mx-auto min-h-screen max-w-7xl bg-background">
      {/* Status Banner */}
      {data?.data?.status === 'draft' && (
        <div className="mb-2 rounded-md bg-warning px-4 py-2 text-center font-medium text-warning-foreground">
          <AlertCircle className="mr-2 inline-block h-4 w-4" />
          This course is currently in draft mode. Publish your course to enable other
          users to access this course.
        </div>
      )}

      {/* Hero Section with Banner */}
      <div className="relative mt-4 h-96 overflow-hidden rounded-lg">
        <img
          src={data?.data?.banner_url}
          alt="Course Banner"
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                {difficultyMap[data?.data?.difficulty_uuid as string]}
              </span>
              {!data?.data?.is_free && (
                <span className="rounded-full bg-success px-3 py-1 text-sm font-semibold text-success-foreground">
                  Premium
                </span>
              )}
            </div>
            <h1 className="mb-4 text-5xl font-bold text-white">
              {data?.data?.name}
            </h1>
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{data?.data?.class_limit} seats available</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Self-paced</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <span>
                  Ages {data?.data?.age_lower_limit}-{data?.data?.age_upper_limit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Video Preview */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="relative aspect-video bg-black">
                {!isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={data?.data?.thumbnail_url}
                      alt="Course Thumbnail"
                      className="h-full w-full object-cover opacity-60"
                    />
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="absolute z-10 flex h-20 w-20 transform items-center justify-center rounded-full bg-primary shadow-2xl transition-all hover:scale-110 hover:bg-primary/90"
                    >
                      <Play
                        className="ml-1 h-10 w-10 fill-primary-foreground text-primary-foreground"
                        fill="currentColor"
                      />
                    </button>
                  </div>
                ) : (
                  <video
                    src={data?.data?.intro_video_url}
                    controls
                    autoPlay
                    className="h-full w-full"
                  />
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="border-b border-border">
                <nav className="flex">
                  {['overview', 'objectives', 'prerequisites', 'details'].map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    )
                  )}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">
                      Course Description
                    </h2>
                    <div
                      className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: data?.data?.description,
                      }}
                    />
                  </div>
                )}

                {activeTab === 'objectives' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">
                      Learning Objectives
                    </h2>
                    <div
                      className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: data?.data?.objectives,
                      }}
                    />
                  </div>
                )}

                {activeTab === 'prerequisites' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">
                      Prerequisites
                    </h2>
                    <div
                      className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: data?.data?.prerequisites,
                      }}
                    />
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      Course Details
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">
                          Difficulty Level
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {
                            difficultyMap[
                            data?.data?.difficulty_uuid as string
                            ]
                          }
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-lg font-semibold text-foreground">
                          {data?.data?.is_free
                            ? 'Free'
                            : `${data?.data?.minimum_training_fee}`}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">
                          Class Size
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          Max {data?.data?.class_limit} students
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">
                          Age Range
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {data?.data?.age_lower_limit}-
                          {data?.data?.age_upper_limit} years
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="mb-4 text-lg font-semibold text-foreground">
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
          <div className="space-y-6">
            {/* Enrollment Card */}
            <div className="sticky top-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="space-y-4">
                <div className="text-center">
                  {data?.data?.is_free ? (
                    <p className="text-4xl font-bold text-success">FREE</p>
                  ) : (
                    <div>
                      <p className="text-4xl font-bold text-foreground">
                        {data?.data?.minimum_training_fee}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        one-time payment
                      </p>
                    </div>
                  )}
                </div>

                <button className="w-full rounded-xl bg-primary px-6 py-4 font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 hover:shadow-lg">
                  Enroll Now
                </button>

                <div className="space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span>{data?.data?.class_limit} spots remaining</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary" />
                    <span>Certificate included</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Share Info (if applicable) */}
            {data?.data?.creator_share_percentage && (
              <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Revenue Share
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Creator Share</span>
                    <span className="font-semibold text-primary">
                      {data?.data?.creator_share_percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Instructor Share
                    </span>
                    <span className="font-semibold text-primary">
                      {data?.data?.instructor_share_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Badges */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Compliance
              </h3>
              <div className="space-y-3">
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