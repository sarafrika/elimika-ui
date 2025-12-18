import {
  getAllInstructorsOptions,
  getInstructorExperienceOptions,
  getInstructorSkillsOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';

function useSearchTrainingInstructors() {
  const {
    data,
    isLoading: isInstructorsLoading,
    isError,
    isFetching,
  } = useQuery({
    ...getAllInstructorsOptions({
      query: { pageable: { page: 0, size: 20 } },
    }),
  });
  const instructors = data?.data?.content || [];

  // Fetch profiles
  const profileQueries = useQueries({
    queries:
      instructors.map((instructor: any) => ({
        ...getUserByUuidOptions({
          path: { uuid: instructor.user_uuid },
        }),
        enabled: !!instructor.user_uuid,
      })) || [],
  });
  const profiles = profileQueries.map(q => q.data?.data ?? null);

  // Fetch experiences
  const experienceQueries = useQueries({
    queries:
      instructors.map((instructor: any) => ({
        ...getInstructorExperienceOptions({
          query: { pageable: {} },
          path: { instructorUuid: instructor?.uuid as string },
        }),
        enabled: !!instructor.uuid,
      })) || [],
  });
  const experiences = experienceQueries.map(q => q.data?.data ?? []);

  // Fetch skills
  const skillQueries = useQueries({
    queries:
      instructors.map((instructor: any) => ({
        ...getInstructorSkillsOptions({
          query: { pageable: {} },
          path: { instructorUuid: instructor?.uuid as string },
        }),
        enabled: !!instructor.uuid,
      })) || [],
  });
  const skills = skillQueries.map(q => q.data?.data?.content ?? []);


  // Combine data
  const instructorsWithProfiles = instructors.map((instructor: any, i: number) => {
    const profile = profiles[i];
    const expArray = experiences[i] ?? [];
    const totalExperience = Array.isArray(expArray)
      ? expArray.reduce(
        (sum, exp: any) => sum + (exp?.years_of_experience ?? exp?.calculated_years ?? 0),
        0
      )
      : 0;

    const skillArray = Array.isArray(skills[i]) ? skills[i] : [];
    const skillCategories = skillArray.reduce((acc: Record<string, any[]>, skill: any) => {
      const category = skill.skill_category || 'UNCATEGORIZED';
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
    };
  });

  // Handle loading states
  const isProfilesLoading = profileQueries.some(q => q.isLoading || q.isFetching);
  const isExperiencesLoading = experienceQueries.some(q => q.isLoading || q.isFetching);
  const isSkillsLoading = skillQueries.some(q => q.isLoading || q.isFetching);
  const loading =
    isInstructorsLoading ||
    isFetching ||
    isProfilesLoading ||
    isExperiencesLoading ||
    isSkillsLoading;

  return {
    data: instructorsWithProfiles,
    loading,
    isError,
  };
}

export default useSearchTrainingInstructors;
