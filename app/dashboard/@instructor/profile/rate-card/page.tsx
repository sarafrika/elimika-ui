'use client';

import { ProfileFormShell } from '@/components/profile/profile-form-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import { getAllCoursesOptions, searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import * as z from 'zod';


const availabilitySchema = z.object({
  calComLink: z.string().url().optional().or(z.literal('')),
  rates: z.object({
    privateInPerson: z.number().optional(),
    privateVirtual: z.number().optional(),
    groupInPerson: z.number().optional(),
    groupVirtual: z.number().optional(),
  }),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

const classTypes = [
  {
    type: 'Private Classes',
    description: 'Personalized one-on-one instruction tailored to individual needs.',
    methods: [
      { name: 'In-Person', key: 'privateInPerson' },
      { name: 'Virtual', key: 'privateVirtual' },
    ],
  },
  {
    type: 'Group Classes',
    description: 'Engaging sessions for workshops, camps, and group projects.',
    methods: [
      { name: 'In-Person', key: 'groupInPerson' },
      { name: 'Virtual', key: 'groupVirtual' },
    ],
  },
];

export default function AvailabilitySettings() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'availability',
        title: 'Availability',
        url: '/dashboard/profile/availability',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const user = useUserProfile();
  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();

  const size = 20;
  const [page, setPage] = useState(0);

  const {
    data: allCourses,
  } = useQuery(getAllCoursesOptions({ query: { pageable: { page, size, sort: [] } } }));

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: user?.instructor?.uuid as string } },
    }),
    enabled: !!user?.instructor?.uuid,
  });

  const combinedCourses = React.useMemo(() => {
    if (!allCourses?.data?.content || !appliedCourses?.data?.content) return [];
    const appliedMap = new Map(
      appliedCourses.data.content.map((app: any) => [app.course_uuid, app])
    );

    return allCourses.data.content.map((course: any) => ({
      ...course,
      application: appliedMap.get(course.uuid) || null,
    }));
  }, [allCourses, appliedCourses]);

  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    if (combinedCourses.length > 0 && !selectedCourse) {
      setSelectedCourse(combinedCourses[0]);
    }
  }, [combinedCourses, selectedCourse]);

  const domainBadges =
    (user?.user_domain as string[] | undefined)?.map(domain =>
      domain
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
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

        {/* Course Selector */}
        <div className="bg-muted/30 rounded-lg border p-4">
          <h3 className="mb-1 text-lg font-semibold">Select Course</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Choose a course to view its rate card.
          </p>

          <div className="max-w-sm">
            <Select
              value={selectedCourse?.uuid || ""}
              onValueChange={(value) => {
                const course = combinedCourses.find((c: any) => c.uuid === value);
                setSelectedCourse(course || null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Course" />
              </SelectTrigger>

              <SelectContent>
                {combinedCourses.map((course: any) => (
                  <SelectItem key={course.uuid} value={course.uuid}>
                    {course.title || course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rate Card */}
        {selectedCourse && (
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
        )}

      </div>

    </ProfileFormShell>
  );
}
