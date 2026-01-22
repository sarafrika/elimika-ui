'use client'


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
    enabled: !!courseId
  })
  const [activeTab, setActiveTab] = useState('overview');

  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-background max-w-7xl mx-auto">
      {/* Status Banner */}
      {data?.data?.status === 'draft' && (
        <div className="bg-amber-500 text-white py-2 px-4 mb-2 text-center font-medium rounded-md">
          <AlertCircle className="inline-block w-4 h-4 mr-2" />
          This course is currently in draft mode. Publish you course to enable other users to access this course.
        </div>
      )}

      {/* Hero Section with Banner */}
      <div className="relative h-96 mt-4 overflow-hidden">
        <img
          src={data?.data?.banner_url}
          alt="Course Banner"
          className="w-full h-full object-cover opacity-40 rounded-md"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                {difficultyMap[data?.data?.difficulty_uuid as string]}
              </span>
              {!data?.data?.is_free && (
                <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                  Premium
                </span>
              )}
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">{data?.data?.name}</h1>
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{data?.data?.class_limit} seats available</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>
                  Self-paced
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span>Ages {data?.data?.age_lower_limit}-{data?.data?.age_upper_limit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Preview */}
            <div className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
              <div className="relative bg-black aspect-video">
                {!isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={data?.data?.thumbnail_url}
                      alt="Course Thumbnail"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="absolute z-10 w-20 h-20 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl"
                    >
                      <Play className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" />
                    </button>
                  </div>
                ) : (
                  <video
                    src={data?.data?.intro_video_url}
                    controls
                    autoPlay
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
              <div className="border-b border-border">
                <nav className="flex">
                  {['overview', 'objectives', 'prerequisites', 'details'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${activeTab === tab
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">Course Description</h2>
                    <div
                      className="prose prose-blue max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: data?.data?.description }}
                    />
                  </div>
                )}

                {activeTab === 'objectives' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">Learning Objectives</h2>
                    <div
                      className="prose prose-blue max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: data?.data?.objectives }}
                    />
                  </div>
                )}

                {activeTab === 'prerequisites' && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">Prerequisites</h2>
                    <div
                      className="prose prose-blue max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: data?.data?.prerequisites }}
                    />
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-foreground">Course Details</h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Difficulty Level</p>
                        <p className="text-lg font-semibold text-muted-foreground">
                          {difficultyMap[data?.data?.difficulty_uuid as string]}
                        </p>
                      </div>
                      <div className=" p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-lg font-semibold text-muted-foreground">
                          {data?.data?.is_free ? 'Free' : `${data?.data?.minimum_training_fee}`}
                        </p>
                      </div>
                      <div className=" p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Class Size</p>
                        <p className="text-lg font-semibold text-muted-foreground">Max {data?.data?.class_limit} students</p>
                      </div>
                      <div className=" p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Age Range</p>
                        <p className="text-lg font-semibold text-muted-foreground">
                          {data?.data?.age_lower_limit}-{data?.data?.age_upper_limit} years
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Learning Features</h3>
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
            <div className="bg-card rounded-2xl shadow-lg p-6 sticky top-6 border border-border">
              <div className="space-y-4">
                <div className="text-center">
                  {data?.data?.is_free ? (
                    <p className="text-4xl font-bold text-green-600">FREE</p>
                  ) : (
                    <div>
                      <p className="text-4xl font-bold text-foreground">
                        {data?.data?.minimum_training_fee}
                      </p>
                      <p className="text-sm text-muted-foreground">one-time payment</p>
                    </div>
                  )}
                </div>

                <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg">
                  Enroll Now
                </button>

                <div className="pt-4 border-t border-border space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <span>{data?.data?.class_limit} spots remaining</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-primary" />
                    {/* {data?.data?.compliance.certificate_enabled ? (
                      <span>Certificate included</span>
                    ) : (
                      <span>No certificate</span>
                    )} */}
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Share Info (if applicable) */}
            {data?.data?.creator_share_percentage && (
              <div className="rounded-2xl shadow-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Share</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Creator Share</span>
                    <span className="font-semibold text-primary">
                      {data?.data?.creator_share_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Instructor Share</span>
                    <span className="font-semibold text-primary">
                      {data?.data?.instructor_share_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Badges */}
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Compliance</h3>
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