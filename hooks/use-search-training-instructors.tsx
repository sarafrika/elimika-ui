import { STALE_TIMES } from '@/lib/query-client';
import {
  getAllInstructorsOptions,
  getInstructorRatingSummaryOptions,
  getInstructorReviewsOptions,
  searchExperienceOptions,
  searchSkillsOptions
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Instructor,
  InstructorExperience,
  InstructorSkill,
} from '@/services/client/types.gen';
import type { SearchInstructor } from '@/src/features/dashboard/courses/types';
import { retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useUsersByIds } from './use-batched-lookups';

/**
 * Instructor directory data. The API lists verified instructors plus the caller's own
 * profile, so an empty directory means "no verified instructors", not "none exist";
 * empty states should say so.
 * Previously fired 5 requests per instructor
 * (profile, reviews, rating summary, experience, skills — 100+ requests for a
 * 20-instructor page). Now: 1 instructor page + 1 batched user lookup +
 * 1 experience search + 1 skills search + N small rating summaries.
 */
/**
 * The rating the instructor list carries itself (`rating_avg`, `review_count`), when the
 * API sends it. The generated types do not know these fields yet, so they are read through
 * a guard rather than a cast.
 */
export function listRating(instructor: unknown): { rating: number; reviewCount: number } | null {
  if (!instructor || typeof instructor !== 'object') return null;
  const record = instructor as Record<string, unknown>;
  const average = record.rating_avg;
  const count = record.review_count;
  if (average === undefined && count === undefined) return null;
  const rating = typeof average === 'number' ? average : Number(average ?? 0);
  const reviewCount = typeof count === 'number' ? count : Number(count ?? 0);
  return {
    rating: Number.isFinite(rating) ? rating : 0,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
  };
}

function useSearchTrainingInstructors({
  q,
  near,
  page = 0,
  size = 20,
  ratings = 'eager',
}: {
  /** Debounced term (2+ characters): names, headlines and skills via the search index. */
  q?: string;
  /**
   * Near-me params from `useNearMe().params` (`near` rounded to 2 decimals, `radius_km`).
   * Served by the search index only; results then carry `distance_band`.
   */
  near?: { near?: string; radius_km?: string };
  page?: number;
  size?: number;
  /**
   * `eager` loads a rating summary and the reviews per listed instructor. `lazy` loads
   * neither: each card fetches its own summary when it is shown. Either way, ratings the
   * list already carries (`rating_avg`, `review_count`) win and nothing is fetched for them.
   */
  ratings?: 'eager' | 'lazy';
} = {}) {
  const {
    data,
    isLoading: isInstructorsLoading,
    isError,
    isFetching,
    error,
  } = useQuery({
    ...getAllInstructorsOptions({
      query: {
        pageable: { page, size },
        ...(q ? { q } : {}),
        ...(near?.near ? { near: near.near, radius_km: near.radius_km } : {}),
      },
    }),
    placeholderData: keepPreviousData,
    retry: retryUnlessClientOrSearchError,
  });
  const instructors: Instructor[] = useMemo(() => data?.data?.content ?? [], [data]);

  const instructorUuids = useMemo(
    () =>
      instructors
        .map(instructor => instructor.uuid)
        .filter((uuid): uuid is string => Boolean(uuid))
        .sort((a, b) => a.localeCompare(b)),
    [instructors]
  );

  const userUuids = useMemo(
    () => instructors.map(instructor => instructor.user_uuid).filter(Boolean) as string[],
    [instructors]
  );
  const { userMap, isLoading: isProfilesLoading } = useUsersByIds(userUuids);

  const { data: experienceData, isLoading: isExperiencesLoading } = useQuery({
    ...searchExperienceOptions({
      query: {
        searchParams: { instructor_uuid_in: instructorUuids.join(',') },
        pageable: { page: 0, size: 500 },
      },
    }),
    enabled: instructorUuids.length > 0,
    staleTime: STALE_TIMES.entity,
  });

  const { data: skillsData, isLoading: isSkillsLoading } = useQuery({
    ...searchSkillsOptions({
      query: {
        searchParams: { instructor_uuid_in: instructorUuids.join(',') },
        pageable: { page: 0, size: 500 },
      },
    }),
    enabled: instructorUuids.length > 0,
    staleTime: STALE_TIMES.entity,
  });

  const experienceByInstructor = useMemo(() => {
    const map = new Map<string, InstructorExperience[]>();
    const content = (experienceData?.data?.content ?? []) as unknown as InstructorExperience[];
    for (const experience of content) {
      if (!experience.instructor_uuid) continue;
      const current = map.get(experience.instructor_uuid) ?? [];
      current.push(experience);
      map.set(experience.instructor_uuid, current);
    }
    return map;
  }, [experienceData]);

  const skillsByInstructor = useMemo(() => {
    const map = new Map<string, InstructorSkill[]>();
    const content = (skillsData?.data?.content ?? []) as unknown as InstructorSkill[];
    for (const skill of content) {
      if (!skill.instructor_uuid) continue;
      const current = map.get(skill.instructor_uuid) ?? [];
      current.push(skill);
      map.set(skill.instructor_uuid, current);
    }
    return map;
  }, [skillsData]);

  const ratingsInline = useMemo(
    () => instructors.length > 0 && instructors.every(instructor => listRating(instructor)),
    [instructors]
  );
  const fetchRatings = ratings === 'eager';

  // No batch endpoint for rating summaries; payloads are tiny.
  const ratingSummaryQueries = useQueries({
    queries: instructors.map(instructor => ({
      ...getInstructorRatingSummaryOptions({
        path: { instructorUuid: instructor.uuid as string },
      }),
      enabled: fetchRatings && !!instructor.uuid && !listRating(instructor),
      staleTime: STALE_TIMES.entity,
    })),
  });
  const ratingSummaries = ratingSummaryQueries.map(q => q.data?.data ?? null);

  const reviewsQueries = useQueries({
    queries: instructors.map(instructor => ({
      ...getInstructorReviewsOptions({
        path: { instructorUuid: instructor.uuid as string },
      }),
      enabled: ratings === 'eager' && !!instructor.uuid,
      staleTime: STALE_TIMES.entity,
    })),
  });
  const reviews = reviewsQueries.map(q => q.data?.data ?? null);

  const instructorsWithProfiles: SearchInstructor[] = instructors.map((instructor, i) => {
    const profile = instructor.user_uuid ? (userMap[instructor.user_uuid] ?? null) : null;
    const expArray = experienceByInstructor.get(instructor.uuid ?? '') ?? [];
    const totalExperience = expArray.reduce(
      (sum, exp) => sum + (exp?.years_of_experience ?? exp?.calculated_years ?? 0),
      0
    );
    const ratingSummary = ratingSummaries[i];
    const review = reviews[i];
    const inline = listRating(instructor);
    const reviewCount =
      inline?.reviewCount ??
      (ratingSummary?.review_count ? Number(ratingSummary.review_count) : 0);
    const averageRating =
      inline?.rating ??
      (typeof ratingSummary?.average_rating === 'number'
        ? ratingSummary.average_rating
        : ((instructor as Instructor & { rating?: number }).rating ?? null));

    const skillArray = skillsByInstructor.get(instructor.uuid ?? '') ?? [];
    const skillCategories = skillArray.reduce<Record<string, InstructorSkill[]>>((acc, skill) => {
      const category = skill.proficiency_level || 'UNCATEGORIZED';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {});

    return {
      ...instructor,
      gender: profile?.gender ?? null,
      user_domain: profile?.user_domain ?? [],
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      dob: profile?.dob ?? null,
      organisation_affiliations: profile?.organisation_affiliations ?? [],
      phone_number: profile?.phone_number ?? null,
      profile_image_url: profile?.profile_image_url ?? null,
      total_experience_years: totalExperience,
      specializations: skillArray,
      skill_categories: skillCategories,
      rating: averageRating ?? (instructor as Instructor & { rating?: number }).rating ?? 0,
      review_count: reviewCount,
      reviews: review,
      ratings_inline: inline !== null,
    };
  });

  const isRatingSummaryLoading = ratingSummaryQueries.some(q => q.isLoading);
  const loading =
    isInstructorsLoading ||
    (isFetching && !data) ||
    isProfilesLoading ||
    isRatingSummaryLoading ||
    isExperiencesLoading ||
    isSkillsLoading;

  return {
    data: instructorsWithProfiles,
    loading,
    isError,
    error,
    isSearching: isFetching && Boolean(data),
    totalPages: Number(data?.data?.metadata?.totalPages ?? 1),
    /** Every listed instructor carries its rating, so the list can be filtered and sorted by it. */
    ratingsKnown: ratingsInline || fetchRatings,
  };
}

export default useSearchTrainingInstructors;
