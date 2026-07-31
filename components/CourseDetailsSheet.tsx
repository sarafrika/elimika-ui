"use client";

import HTMLTextPreview from "@/components/editors/html-text-preview";
import { CourseTrainingRequirements } from "@/app/dashboard/_components/course-training-requirements";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseLessonsWithContent } from "@/hooks/use-courselessonwithcontent";
import { useUserDomain } from "@/src/features/dashboard/context/user-domain-context";
import { buildWorkspaceAliasPath } from "@/src/features/dashboard/lib/active-domain-storage";
import { toAuthenticatedMediaUrl } from "@/src/lib/media-url";
import {
  getAllDifficultyLevelsOptions,
  getCourseAssessmentsOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getCourseReviewsOptions,
  getCourseTrainingRequirementsOptions,
  getProgramCoursesOptions,
  getProgramReviewsOptions,
  getTrainingProgramByUuidOptions,
} from "@/services/client/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  Layers3,
  Search,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type SelectedContentKind = "course" | "program";

type CourseDetailsSheetProps = {
  contentId: string | null;
  contentKind: SelectedContentKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.14em]">
      {children}
    </p>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-border bg-background/80 shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-xl">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <p className="text-foreground text-base font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="mt-4 space-y-4">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

function CourseSheet({
  courseId,
  onOpenChange,
}: {
  courseId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { activeDomain } = useUserDomain();

  const { data: courseResponse, isLoading: courseLoading } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId } }),
    enabled: Boolean(courseId),
    refetchOnWindowFocus: false,
  });

  const course = courseResponse?.data;

  const { data: creatorResponse } = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: course?.course_creator_uuid as string } }),
    enabled: Boolean(course?.course_creator_uuid),
    refetchOnWindowFocus: false,
  });
  const creator = creatorResponse?.data;

  const { data: reviewsResponse } = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: courseId } }),
    enabled: Boolean(courseId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: difficultyResponse } = useQuery(getAllDifficultyLevelsOptions());

  const { data: requirementsResponse } = useQuery({
    ...getCourseTrainingRequirementsOptions({
      path: { courseUuid: courseId },
      query: { pageable: {} },
    }),
    enabled: Boolean(courseId),
    refetchOnWindowFocus: false,
  });

  const { data: assessmentsResponse } = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: courseId },
      query: { pageable: {} },
    }),
    enabled: Boolean(courseId),
    refetchOnWindowFocus: false,
  });

  const { lessons, isLoading: lessonsLoading } = useCourseLessonsWithContent({
    courseUuid: courseId,
  });

  const reviewItems = reviewsResponse?.data ?? [];
  const reviewCount = reviewItems.length;
  const averageRating = reviewCount
    ? (
        reviewItems.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewCount
      ).toFixed(1)
    : null;

  const difficultyName = difficultyResponse?.data?.find(
    level => level.uuid === course?.difficulty_uuid
  )?.name;
  const lessonCount = lessons?.length ?? 0;
  const assessmentCount = assessmentsResponse?.data?.content?.length ?? 0;
  const trainingRequirements = requirementsResponse?.data?.content ?? [];
  const courseImage = toAuthenticatedMediaUrl(course?.banner_url ?? course?.thumbnail_url);

  if (courseLoading || lessonsLoading) {
    return <LoadingState />;
  }

  if (!course) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Course details are unavailable right now.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-5 text-sm">
      {courseImage ? (
        <img
          src={courseImage}
          alt={course.name}
          className="h-48 w-full rounded-2xl object-cover"
        />
      ) : (
        <div className="from-primary/10 via-primary/5 to-background flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br">
          <BookOpen className="text-primary/40 size-14" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {difficultyName ? <Badge variant="secondary">{difficultyName}</Badge> : null}
        {course.category_names?.map(category => (
          <Badge key={category} variant="outline">
            {category}
          </Badge>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-foreground text-xl font-semibold">{course.name}</h2>
        <div className="text-muted-foreground line-clamp-4">
          <HTMLTextPreview htmlContent={course.description || ""} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard icon={Star} label="Rating" value={averageRating ?? "N/A"} />
        <StatCard
          icon={Clock3}
          label="Duration"
          value={course.total_duration_display || `${course.duration_hours ?? 0}h`}
        />
        <StatCard icon={Users} label="Class limit" value={course.class_limit ?? "Open"} />
        <StatCard icon={Layers3} label="Lessons" value={lessonCount} />
      </div>

      <Card className="border-border bg-background/80 shadow-none">
        <CardContent className="space-y-4 p-4">
          <SectionLabel>Instructor</SectionLabel>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-muted text-foreground font-semibold">
                {(creator?.full_name ?? "CT")
                  .split(" ")
                  .filter(Boolean)
                  .map((part: string) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="text-foreground font-semibold">{creator?.full_name ?? "Course creator"}</p>
              <p className="text-muted-foreground truncate text-xs sm:text-sm">
                {creator?.professional_headline || "Course creator"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {course.prerequisites ? (
        <Card className="border-border bg-background/80 shadow-none">
          <CardContent className="space-y-2 p-4">
            <SectionLabel>Prerequisites</SectionLabel>
            <div className="text-muted-foreground">
              <HTMLTextPreview htmlContent={course.prerequisites} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {course.requirements ? (
        <Card className="border-border bg-background/80 shadow-none">
          <CardContent className="space-y-2 p-4">
            <SectionLabel>Course Requirements</SectionLabel>
            <div className="text-muted-foreground">
              <HTMLTextPreview htmlContent={course.requirements} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-background/80 shadow-none">
        <CardContent className="space-y-4 p-4">
          <SectionLabel>Assessment</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard icon={Award} label="Assessment items" value={assessmentCount} />
            <StatCard
              icon={CalendarDays}
              label="Training requirements"
              value={trainingRequirements.length}
            />
          </div>
          {trainingRequirements.length > 0 ? (
            <CourseTrainingRequirements
              requirements={trainingRequirements}
              viewerRole="student"
              description="Review the training requirements before you enroll."
              className="border-none shadow-none"
            />
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Button asChild className="w-full rounded-xl">
          <Link
            href={buildWorkspaceAliasPath(
              activeDomain,
              `/dashboard/courses/available-classes/${course.uuid}`
            )}
            onClick={() => onOpenChange(false)}
          >
            <Users className="mr-2 size-4" />
            View available classes
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full rounded-xl">
          <Link
            href={buildWorkspaceAliasPath(
              activeDomain,
              `/dashboard/courses/instructor?courseId=${course.uuid}`
            )}
            onClick={() => onOpenChange(false)}
          >
            <Search className="mr-2 size-4" />
            Search instructor
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ProgramSheet({
  programId,
  onOpenChange,
}: {
  programId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { activeDomain } = useUserDomain();

  const { data: programResponse, isLoading: programLoading } = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programId } }),
    enabled: Boolean(programId),
    refetchOnWindowFocus: false,
  });

  const program = programResponse?.data;

  const { data: reviewsResponse } = useQuery({
    ...getProgramReviewsOptions({
      path: { programUuid: programId },
      query: { pageable: {} },
    }),
    enabled: Boolean(programId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: coursesResponse } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programId } }),
    enabled: Boolean(programId),
    refetchOnWindowFocus: false,
  });

  const programCourses = coursesResponse?.data ?? [];
  const courseNames = useMemo(
    () => programCourses.map(course => course.name).filter(Boolean),
    [programCourses]
  );
  const aggregatedRequirements = useMemo(
    () => programCourses.flatMap(course => course.training_requirements ?? []),
    [programCourses]
  );
  const totalDurationMinutes = useMemo(
    () =>
      programCourses.reduce(
        (sum, course) => sum + (course.duration_hours ?? 0) * 60 + (course.duration_minutes ?? 0),
        0
      ),
    [programCourses]
  );

  const reviewItems = reviewsResponse?.data?.content ?? [];
  const reviewCount = reviewItems.length;
  const averageRating = reviewCount
    ? (
        reviewItems.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewCount
      ).toFixed(1)
    : null;

  if (programLoading) {
    return <LoadingState />;
  }

  if (!program) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Program details are unavailable right now.
      </div>
    );
  }

  const durationLabel = totalDurationMinutes
    ? `${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`
    : "N/A";
  const priceLabel =
    typeof program.price === "number"
      ? `KES ${program.price}`
      : program.price
        ? String(program.price)
        : "Flexible";

  return (
    <div className="mt-4 space-y-5 text-sm">
      <div className="from-primary/10 via-primary/5 to-background flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br">
        <Layers3 className="text-primary/40 size-16" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{program.program_type || "Program"}</Badge>
        <Badge variant="outline">{programCourses.length} courses</Badge>
      </div>

      <div className="space-y-2">
        <h2 className="text-foreground text-xl font-semibold">{program.title}</h2>
        <div className="text-muted-foreground line-clamp-4">
          <HTMLTextPreview htmlContent={program.description || ""} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard icon={Star} label="Rating" value={averageRating ?? "N/A"} />
        <StatCard icon={Clock3} label="Duration" value={durationLabel} />
        <StatCard icon={Users} label="Class limit" value={program.class_limit ?? "Open"} />
        <StatCard icon={BookOpen} label="Price" value={priceLabel} />
      </div>

      <Card className="border-border bg-background/80 shadow-none">
        <CardContent className="space-y-4 p-4">
          <SectionLabel>Program Courses</SectionLabel>
          <div className="space-y-3">
            {courseNames.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bundled courses are available yet.</p>
            ) : (
              courseNames.map((courseName, index) => (
                <div key={`${courseName}-${index}`} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-foreground font-medium">{courseName}</p>
                      <p className="text-muted-foreground text-xs">Bundled course {index + 1}</p>
                    </div>
                    <Badge variant="outline">{index + 1}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-background/80 shadow-none">
        <CardContent className="space-y-4 p-4">
          <SectionLabel>Assessment and Requirements</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard icon={Award} label="Assessments" value={0} />
            <StatCard icon={CalendarDays} label="Requirements" value={aggregatedRequirements.length} />
          </div>
          {aggregatedRequirements.length > 0 ? (
            <CourseTrainingRequirements
              requirements={aggregatedRequirements}
              title="Program Training Requirements"
              description="Review the shared requirements across the bundled courses."
              className="border-none shadow-none"
              viewerRole="student"
            />
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Button asChild className="w-full rounded-xl">
          <Link
            href={buildWorkspaceAliasPath(
              activeDomain,
              `/dashboard/courses/available-programs/${program.uuid}`
            )}
            onClick={() => onOpenChange(false)}
          >
            <Users className="mr-2 size-4" />
            View available sessions
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full rounded-xl">
          <Link
            href={buildWorkspaceAliasPath(
              activeDomain,
              `/dashboard/courses/instructor?courseId=${program.uuid}`
            )}
            onClick={() => onOpenChange(false)}
          >
            <Search className="mr-2 size-4" />
            Search instructor
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function CourseDetailsSheet({
  contentId,
  contentKind,
  open,
  onOpenChange,
}: CourseDetailsSheetProps) {
  const title =
    contentKind === "program"
      ? "Program details"
      : contentKind === "course"
        ? "Course details"
        : "Details";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">{title}</SheetTitle>
        </SheetHeader>

        {!open || !contentId || !contentKind ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Select a course or program to see the details.
          </div>
        ) : contentKind === "course" ? (
          <CourseSheet courseId={contentId} onOpenChange={onOpenChange} />
        ) : (
          <ProgramSheet programId={contentId} onOpenChange={onOpenChange} />
        )}
      </SheetContent>
    </Sheet>
  );
}
