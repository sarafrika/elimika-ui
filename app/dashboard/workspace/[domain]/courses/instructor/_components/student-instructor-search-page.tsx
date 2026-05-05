'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import useSearchTrainingInstructors from '@/hooks/use-search-training-instructors';
import { listTrainingApplicationsOptions, searchSkillsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import type { SearchInstructor } from '@/src/features/dashboard/courses/types';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { InstructorHireModal } from './instructor-hire-modal';
import { SearchInstructorCard } from './search-instructor-card';
import {
  SearchInstructorFilters,
  searchInstructorFiltersDefaults,
  type InstructorSearchFiltersState,
} from './search-instructor-filters';
import { SearchInstructorMetrics } from './search-instructor-metrics';
import { SearchInstructorSidebar } from './search-instructor-sidebar';

type SortBy = 'relevance' | 'rating' | 'experience' | 'alphabetical';
const PAGE_SIZE = 6;

type PaginationItemValue = number | 'ellipsis';

function buildPaginationItems(currentPage: number, totalPages: number): PaginationItemValue[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

function getInstructorType(instructor: SearchInstructor) {
  const userDomain = instructor.user_domain;
  const domainList = Array.isArray(userDomain) ? userDomain : userDomain ? [userDomain] : [];
  return domainList.some(value => String(value).toLowerCase().includes('organization'))
    ? 'organization'
    : 'individual';
}

function matchesExperienceBand(experience: number, band: string) {
  if (band === 'all') return true;
  if (band === '0-2') return experience <= 2;
  if (band === '3-5') return experience >= 3 && experience <= 5;
  if (band === '6-10') return experience >= 6 && experience <= 10;
  if (band === '10+') return experience >= 10;

  return true;
}

function getInstructorLocation(instructor: SearchInstructor) {
  return instructor.formatted_location || instructor.location?.city || 'Nairobi, Kenya';
}

function getMatchScore(instructor: SearchInstructor) {
  const ratingScore = Math.min(20, Math.round((instructor.rating ?? 4.3) * 4));
  const experienceScore = Math.min(10, Math.round((instructor.total_experience_years ?? 0) * 1.2));
  const verifiedScore = instructor.admin_verified ? 7 : 0;
  const profileScore = instructor.is_profile_complete ? 5 : 0;

  return Math.min(99, 58 + ratingScore + experienceScore + verifiedScore + profileScore);
}

export default function StudentInstructorSearchPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const { activeDomain } = useUserDomain();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { data: trainingInstructors = [], loading } = useSearchTrainingInstructors();
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [selectedInstructorUuid, setSelectedInstructorUuid] = useState<string | null>(null);
  const [hireModalInstructorUuid, setHireModalInstructorUuid] = useState<string | null>(null);
  const [filters, setFilters] = useState<InstructorSearchFiltersState>(searchInstructorFiltersDefaults);
  const [page, setPage] = useState(1);

  // const { data: applications } = useQuery(
  //   courseId
  //     ? listTrainingApplicationsOptions({
  //       path: { courseUuid: courseId },
  //       query: { pageable: {}, status: 'approved' },

  //     })
  //     : {
  //       queryKey: ['student-instructor-search', 'approved-applications', null],
  //       queryFn: async () => ({ data: { content: [] } }),
  //       enabled: false,
  //     }
  // );

  const { data: applications } = useQuery({
    ...listTrainingApplicationsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {} },
    }),
    enabled: !!courseId,
  });

  const approvedInstructorUuids =
    applications?.data?.content
      ?.filter(application => application?.applicant_type === 'instructor')
      ?.map(application => application?.applicant_uuid) ?? [];

  const { data: skillsResponse } = useQuery(
    searchSkillsOptions({ query: { pageable: {}, searchParams: {} } })
  );

  const allSpecializations = useMemo(
    () =>
      [
        ...new Set(
          skillsResponse?.data?.content
            ?.map(skill => skill?.skill_name)
            ?.filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
        ),
      ].sort((left, right) => left.localeCompare(right)),
    [skillsResponse]
  );

  useEffect(() => {
    replaceBreadcrumbs([
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/overview'),
      },
      {
        id: 'courses',
        title: 'Browse Courses',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/courses'),
      },
      {
        id: 'search-instructors',
        title: 'Search Instructors',
        url: buildWorkspaceAliasPath(
          activeDomain,
          `/dashboard/courses/instructor${courseId ? `?courseId=${courseId}` : ''}`
        ),
      },
    ]);
  }, [activeDomain, courseId, replaceBreadcrumbs]);

  const scopedInstructors = useMemo(() => {
    if (!courseId) return [];

    return trainingInstructors.filter(instructor =>
      approvedInstructorUuids.includes(instructor.uuid)
    );
  }, [approvedInstructorUuids, courseId, trainingInstructors]);

  const filteredInstructors = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();

    const result = scopedInstructors.filter(instructor => {
      const searchTarget = [
        instructor.full_name,
        instructor.professional_headline,
        instructor.bio,
        instructor.location?.city,
        getInstructorLocation(instructor),
        ...instructor.specializations.map(skill => skill.skill_name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (query && !searchTarget.includes(query)) {
        return false;
      }

      if (filters.skillCategory !== 'all') {
        const hasSkill = instructor.specializations.some(
          skill => skill.skill_name.toLowerCase() === filters.skillCategory.toLowerCase()
        );

        if (!hasSkill) return false;
      }

      if (filters.specialist !== 'all') {
        const hasSpecialist = instructor.specializations.some(
          skill => skill.skill_name.toLowerCase() === filters.specialist.toLowerCase()
        );

        if (!hasSpecialist) return false;
      }

      if (
        filters.location &&
        !getInstructorLocation(instructor).toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      if ((instructor.rating ?? 0) < filters.minRating) {
        return false;
      }

      if (!matchesExperienceBand(instructor.total_experience_years ?? 0, filters.experienceBand)) {
        return false;
      }

      if (filters.gender !== 'all' && String(instructor.gender ?? '').toLowerCase() !== filters.gender) {
        return false;
      }

      if (
        filters.instructorType !== 'all' &&
        getInstructorType(instructor) !== filters.instructorType
      ) {
        return false;
      }

      if (filters.availability === 'verified' && !instructor.admin_verified) {
        return false;
      }

      if (filters.certifications === 'verified' && !instructor.admin_verified) {
        return false;
      }

      if (filters.certifications === 'complete' && !instructor.is_profile_complete) {
        return false;
      }

      if (filters.mode === 'online' && instructor.has_location_coordinates) {
        return false;
      }

      if (filters.mode === 'physical' && !instructor.has_location_coordinates) {
        return false;
      }

      return true;
    });

    const withScores = result.map(instructor => ({
      instructor,
      score: getMatchScore(instructor),
      rating: instructor.rating ?? 0,
      experience: instructor.total_experience_years ?? 0,
      name: instructor.full_name ?? '',
    }));

    withScores.sort((left, right) => {
      if (sortBy === 'rating') return right.rating - left.rating;
      if (sortBy === 'experience') return right.experience - left.experience;
      if (sortBy === 'alphabetical') return left.name.localeCompare(right.name);
      if (right.score !== left.score) return right.score - left.score;
      if (right.rating !== left.rating) return right.rating - left.rating;
      return right.experience - left.experience;
    });

    return withScores.map(entry => entry.instructor);
  }, [filters, scopedInstructors, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredInstructors.length / PAGE_SIZE));
  const paginatedInstructors = useMemo(
    () => filteredInstructors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredInstructors, page]
  );
  const paginationItems = useMemo(() => buildPaginationItems(page, totalPages), [page, totalPages]);


  useEffect(() => {
    if (!filteredInstructors.length) {
      setSelectedInstructorUuid(null);
      return;
    }

    const selectedExists = filteredInstructors.some(instructor => instructor.uuid === selectedInstructorUuid);
    if (!selectedExists) {
      setSelectedInstructorUuid(filteredInstructors[0]?.uuid ?? null);
    }
  }, [filteredInstructors, selectedInstructorUuid]);

  useEffect(() => {
    setPage(1);
  }, [courseId, filters, sortBy]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedInstructor =
    filteredInstructors.find(instructor => instructor.uuid === selectedInstructorUuid) ??
    filteredInstructors[0] ??
    null;

  const hireModalInstructor =
    filteredInstructors.find(instructor => instructor.uuid === hireModalInstructorUuid) ?? null;

  const shortlist = filteredInstructors.slice(0, 3);
  const topSkill = useMemo(() => {
    const counts = new Map<string, number>();

    filteredInstructors.forEach(instructor => {
      instructor.specializations.forEach(skill => {
        counts.set(skill.skill_name, (counts.get(skill.skill_name) ?? 0) + 1);
      });
    });

    return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'Piano';
  }, [filteredInstructors]);

  const topLocation = useMemo(() => {
    const counts = new Map<string, number>();

    filteredInstructors.forEach(instructor => {
      const location = getInstructorLocation(instructor);
      counts.set(location, (counts.get(location) ?? 0) + 1);
    });

    return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'Nairobi';
  }, [filteredInstructors]);

  const topRating = useMemo(
    () => filteredInstructors.reduce((max, instructor) => Math.max(max, instructor.rating ?? 0), 0),
    [filteredInstructors]
  );
  const topRatedInstructor = useMemo(
    () =>
      filteredInstructors.reduce<SearchInstructor | null>((currentBest, instructor) => {
        if (!currentBest) return instructor;

        const currentBestRating = currentBest.rating ?? 0;
        const nextRating = instructor.rating ?? 0;

        if (nextRating > currentBestRating) {
          return instructor;
        }

        return currentBest;
      }, null),
    [filteredInstructors]
  );

  const updateFilter = <K extends keyof InstructorSearchFiltersState>(
    key: K,
    value: InstructorSearchFiltersState[K]
  ) => {
    setFilters(current => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(searchInstructorFiltersDefaults);
    setSortBy('relevance');
  };

  const selectInstructor = (uuid: string) => {
    setSelectedInstructorUuid(uuid);

    const selectedIndex = filteredInstructors.findIndex(instructor => instructor.uuid === uuid);
    if (selectedIndex >= 0) {
      setPage(Math.floor(selectedIndex / PAGE_SIZE) + 1);
    }
  };

  return (
    <div className='space-y-2 px-3 py-4 sm:px-4 lg:px-6'>
      <section className='bg-card py-4 shadow-none'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <h1 className='text-3xl font-bold tracking-[-0.03em]'>
                Search Instructors
              </h1>
            </div>
            <p className='text-muted-foreground max-w-3xl text-sm sm:text-[0.95rem]'>
              Find, compare, and hire verified instructors.
            </p>
          </div>

          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            {/* <Button type='button' variant='success' className='h-10 rounded-xl px-4 text-sm'>
              <Plus className='size-4' />
              Post a Job
            </Button> */}
            <Button type='button' variant='outline' className='h-10 rounded-md px-4 text-sm'>
              <Bookmark className='size-4' />
              Saved Instructors
            </Button>
          </div>
        </div>
      </section>

      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='min-w-0 space-y-4'>
          <SearchInstructorFilters
            filters={filters}
            allSpecializations={allSpecializations}
            onChange={updateFilter}
            onReset={resetFilters}
            onApply={() => undefined}
          />

          <SearchInstructorMetrics
            totalInstructors={filteredInstructors.length}
            topSkill={topSkill}
            topLocation={topLocation}
            topInstructorName={topRatedInstructor?.full_name ?? ''}
            topRating={topRating}
          />

          <div className='bg-card px-4 py-0 shadow-none'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between'>
              <div>
                <p className='text-sm font-semibold sm:text-base'>Showing {filteredInstructors.length} instructors</p>
              </div>

              <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                {/* <div className='inline-flex items-center gap-2 rounded-xl border px-3 py-2'>
                  <span className='bg-primary size-2 rounded-full' />
                  <span className='text-xs font-medium sm:text-sm'>
                    {selectedInstructor ? selectedInstructor.full_name : 'No instructor selected'}
                  </span>
                </div> */}
                <Select value={sortBy} onValueChange={value => setSortBy(value as SortBy)}>
                  <SelectTrigger className='h-10 rounded-md text-sm sm:w-[180px]'>
                    <SelectValue placeholder='Sort by: Relevance' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='relevance'>Relevance</SelectItem>
                    <SelectItem value='rating'>Highest Rated</SelectItem>
                    <SelectItem value='experience'>Most Experience</SelectItem>
                    <SelectItem value='alphabetical'>Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2 2xl:grid-cols-3'>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className='h-[280px] rounded-xl border bg-card p-4 shadow-none' />
              ))
            ) : paginatedInstructors.length > 0 ? (
              paginatedInstructors.map(instructor => (
                <SearchInstructorCard
                  key={instructor.uuid}
                  instructor={instructor}
                  courseId={courseId}
                  selected={selectedInstructorUuid === instructor.uuid}
                  onSelect={() => selectInstructor(instructor.uuid as string)}
                  onHireNow={() => setHireModalInstructorUuid(instructor.uuid as string)}
                />
              ))
            ) : (
              <Card className='col-span-1 md:col-span-2 2xl:col-span-3 w-full rounded-xl border border-dashed bg-card p-8 text-center shadow-none'>
                <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted/40'>
                  <Search className='text-muted-foreground size-5' />
                </div>
                <h3 className='text-base font-semibold'>No instructors found</h3>
                <p className='text-muted-foreground mt-2 text-sm'>
                  Try broadening the filters or clearing the current search.
                </p>
                <Button type='button' variant='outline' className='mt-4 rounded-xl' onClick={resetFilters}>
                  Clear Filters
                </Button>
              </Card>
            )}
          </div>

          {filteredInstructors.length > PAGE_SIZE ? (
            <Pagination className='justify-center pb-2'>
              <PaginationContent className='flex-wrap justify-center'>
                <PaginationItem>
                  <PaginationPrevious
                    href='#'
                    onClick={event => {
                      event.preventDefault();
                      setPage(current => Math.max(1, current - 1));
                    }}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>

                {paginationItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href='#'
                        isActive={item === page}
                        onClick={event => {
                          event.preventDefault();
                          setPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href='#'
                    onClick={event => {
                      event.preventDefault();
                      setPage(current => Math.min(totalPages, current + 1));
                    }}
                    aria-disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>

        <aside className='min-w-0 xl:sticky xl:top-4 xl:h-fit'>
          <SearchInstructorSidebar
            selectedInstructor={selectedInstructor}
            shortlist={shortlist}
            instructorIntroVideo=''
            onSelectShortlist={selectInstructor}
            onQuickHire={() => {
              if (selectedInstructor?.uuid) {
                setHireModalInstructorUuid(selectedInstructor.uuid);
              }
            }}
            courseId={courseId}
          />
        </aside>
      </div>

      <InstructorHireModal
        instructor={hireModalInstructor}
        open={Boolean(hireModalInstructor)}
        onOpenChange={open => {
          if (!open) {
            setHireModalInstructorUuid(null);
          }
        }}
      />
    </div>
  );
}
