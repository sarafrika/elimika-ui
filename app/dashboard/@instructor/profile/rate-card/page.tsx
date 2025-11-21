'use client';

import { ProfileFormShell } from '@/components/profile/profile-form-layout';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import { getAllCoursesOptions, searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Button } from '../../../../../components/ui/button';

export default function AvailabilitySettings() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      { id: 'availability', title: 'Availability', url: '/dashboard/profile/availability', isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  const user = useUserProfile();
  const { disableEditing } = useProfileFormMode();

  const size = 50;
  const [page] = useState(0);

  const { data: allCourses } = useQuery(getAllCoursesOptions({ query: { pageable: { page, size, sort: [] } } }));

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: user?.instructor?.uuid as string } },
    }),
    enabled: !!user?.instructor?.uuid,
  });

  const combinedCourses = React.useMemo(() => {
    if (!allCourses?.data?.content || !appliedCourses?.data?.content) return [];
    const appliedMap = new Map(appliedCourses.data.content.map((app: any) => [app.course_uuid, app]));
    return allCourses.data.content.map((course: any) => ({
      ...course,
      application: appliedMap.get(course.uuid) || null,
    }));
  }, [allCourses, appliedCourses]);

  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const domainBadges =
    (user?.user_domain as string[] | undefined)?.map(domain =>
      domain.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    ) ?? [];

  const labelMap: Record<string, string> = {
    private_individual_rate: "Private Individual",
    private_group_rate: "Private Group",
    public_individual_rate: "Public Individual",
    public_group_rate: "Public Group",
  };

  const iconMap: Record<string, string> = {
    private_individual_rate: "👤",
    private_group_rate: "👥",
    public_individual_rate: "👤",
    public_group_rate: "👥",
  };

  return (
    <ProfileFormShell
      eyebrow='Instructor'
      title='Instructor Rates'
      description='Define the hourly rates you offer.'
      badges={domainBadges}
    >
      <div className="space-y-6">
        {/* Course List */}
        {!selectedCourse && (
          <div className="flex flex-col gap-4">
            {combinedCourses.map((course: any) => (
              <div
                key={course.uuid}
                onClick={() => setSelectedCourse(course)}
                className="w-full cursor-pointer p-6 border rounded-xl hover:shadow-lg transition-shadow bg-background"
              >
                <h4 className="font-bold text-lg">{course.title || course.name}</h4>
                <p className={`mt-2 text-sm ${course.application?.rate_card ? 'text-green-600' : 'text-gray-400 italic'}`}>
                  {course.application?.rate_card ? 'Rate available' : 'No rate card'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Rate Card */}
        {selectedCourse && (
          <div className="space-y-4">

            <Button
              onClick={() => setSelectedCourse(null)}
              className="px-4 py-2 rounded-lg text-sm"
            >
              ← Back to Courses
            </Button>

            <div className="rounded-xl border bg-gradient-to-b from-muted/20 to-muted p-6 shadow-sm">

              <h3 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <span className="text-base">📘</span>
                Rate Card — {selectedCourse.title || selectedCourse.name}
              </h3>

              {!selectedCourse.application?.rate_card ? (
                <p className="text-muted-foreground text-sm italic">
                  No rate card available for this course.
                </p>
              ) : (
                (() => {
                  const rateCard = selectedCourse.application.rate_card;

                  return (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {Object.entries(rateCard).map(([key, value]) => {
                        if (key === "currency") return null;
                        const label = labelMap[key] || key;
                        const icon = iconMap[key] || "💼";

                        return (
                          <div
                            key={key}
                            className="rounded-lg border bg-background p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-xl">{icon}</span>
                              <span className="font-semibold text-sm">{label}</span>
                            </div>
                            <div className="mt-2">
                              <span className="text-2xl font-bold">
                                {value} {rateCard.currency}
                              </span>
                              <span className="text-muted-foreground ml-1 text-xs">
                                per hour per head
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

      </div>
    </ProfileFormShell>
  );
}
