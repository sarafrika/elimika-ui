// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useSearchTrainingInstructors from '@/hooks/use-search-training-instructors';
import {
  getCourseByUuidOptions,
  listTrainingApplicationsOptions,
  searchSkillsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { InstructorHireModal } from '@/src/features/dashboard/courses/shared/instructor/_components/instructor-hire-modal';
import type { SearchInstructor } from '@/src/features/dashboard/courses/types';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Building2,
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  Languages,
  Menu,
  MessageSquare,
  Navigation,
  PiggyBank,
  PlayCircle,
  Star,
  User,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toAuthenticatedMediaUrl } from '../../../../../../lib/media-url';
import { stripHtml } from '../../_components/courses-data';

type SortBy = 'relevance' | 'rating' | 'experience' | 'alphabetical' | 'distance';
type ActiveView = 'search' | 'saved' | 'hired';
const PAGE_SIZE = 5;
const SAVED_INSTRUCTORS_STORAGE_KEY = 'elimika.saved-training-instructors';

type InstructorSearchFiltersState = {
  searchQuery: string;
  skillCategory: string;
  specialist: string;
  location: string;
  minRating: number;
  experienceBand: string;
  gender: string;
  instructorType: string;
  availability: string;
  certifications: string;
  mode: string;
};

const searchInstructorFiltersDefaults: InstructorSearchFiltersState = {
  searchQuery: '',
  skillCategory: 'all',
  specialist: 'all',
  location: '',
  minRating: 0,
  experienceBand: 'all',
  gender: 'all',
  instructorType: 'all',
  availability: 'all',
  certifications: 'all',
  mode: 'all',
};

// Deterministic pseudo-distance in km when we lack coordinates; stable across renders.
function pseudoDistanceKm(instructorUuid: string, near: string): number {
  const seed = `${instructorUuid}|${near.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return Math.round(((hash % 4800) / 100 + 0.5) * 10) / 10; // 0.5 – 48.5 km
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
  return instructor.formatted_location || instructor.location?.city || 'Not available';
}

function getMatchScore(instructor: SearchInstructor) {
  const ratingScore = Math.min(20, Math.round((instructor.rating ?? 4.3) * 4));
  const experienceScore = Math.min(10, Math.round((instructor.total_experience_years ?? 0) * 1.2));
  const verifiedScore = instructor.admin_verified ? 7 : 0;
  const profileScore = instructor.is_profile_complete ? 5 : 0;

  return Math.min(99, 58 + ratingScore + experienceScore + verifiedScore + profileScore);
}

function getMatchReasons(instructor: SearchInstructor) {
  const reasons: string[] = [];
  if ((instructor.rating ?? 0) >= 4.5) reasons.push('top rated');
  if (instructor.admin_verified) reasons.push('verified');
  if (instructor.is_profile_complete) reasons.push('complete profile');
  if ((instructor.total_experience_years ?? 0) >= 5) reasons.push('experienced');
  if (reasons.length === 0) reasons.push('recommended pick');
  return reasons;
}

function getDeliveryModesLabel(instructor: SearchInstructor) {
  return instructor.has_location_coordinates ? 'Physical, Online' : 'Online';
}

export default function StudentInstructorSearchPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const { activeDomain } = useUserDomain();
  const { data: trainingInstructors = [], loading } = useSearchTrainingInstructors();
  const [activeView, setActiveView] = useState<ActiveView>('search');
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [selectedInstructorUuid, setSelectedInstructorUuid] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hireModalInstructorUuid, setHireModalInstructorUuid] = useState<string | null>(null);
  const [filters, setFilters] = useState<InstructorSearchFiltersState>(
    searchInstructorFiltersDefaults
  );
  const [page, setPage] = useState(1);
  const [savedInstructorUuids, setSavedInstructorUuids] = useState<string[]>([]);

  const { data: courseResp } = useQuery({
    ...getCourseByUuidOptions({
      path: { uuid: courseId as string },
    })
  });
  const course = courseResp?.data;

  const { data: applications } = useQuery({
    ...listTrainingApplicationsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {}, status: 'approved' },
    }),
    enabled: !!courseId,
  });

  const approvedInstructorUuids =
    applications?.data?.content
      ?.filter(application => application?.applicant_type === 'instructor')
      ?.map(application => application?.applicant_uuid) ?? [];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_INSTRUCTORS_STORAGE_KEY);
      if (!stored) {
        setSavedInstructorUuids([]);
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setSavedInstructorUuids(
          parsed.filter(
            (value): value is string => typeof value === 'string' && value.trim().length > 0
          )
        );
      }
    } catch {
      setSavedInstructorUuids([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SAVED_INSTRUCTORS_STORAGE_KEY,
      JSON.stringify(savedInstructorUuids)
    );
  }, [savedInstructorUuids]);

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

  const scopedInstructors = useMemo(() => {
    if (!courseId) return [];

    return trainingInstructors.filter(instructor =>
      approvedInstructorUuids.includes(instructor.uuid)
    );
  }, [approvedInstructorUuids, courseId, trainingInstructors]);

  const savedInstructors = useMemo(
    () => trainingInstructors.filter(instructor => savedInstructorUuids.includes(instructor.uuid)),
    [savedInstructorUuids, trainingInstructors]
  );

  const hiredInstructors = useMemo(
    () =>
      trainingInstructors.filter(instructor => approvedInstructorUuids.includes(instructor.uuid)),
    [approvedInstructorUuids, trainingInstructors]
  );

  const activeInstructorList =
    activeView === 'saved'
      ? savedInstructors
      : activeView === 'hired'
        ? hiredInstructors
        : scopedInstructors;

  const showDistance = filters.mode === 'physical' && filters.location.trim().length > 0;

  const { data: instructorPricing } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: {
          course_uuid: courseId as string,
          applicant_uuid_in: activeInstructorList.map(instructor => instructor.uuid).join(','),
        },
      },
    }),
  });

  const pricingMap = useMemo(() => {
    return new Map(
      (instructorPricing?.data?.content ?? []).map(pricing => [
        pricing.applicant_uuid,
        pricing,
      ])
    );
  }, [instructorPricing]);

  const filteredInstructors = useMemo(() => {
    if (activeView !== 'search') {
      return activeInstructorList;
    }

    const query = filters.searchQuery.trim().toLowerCase();

    const result = activeInstructorList.filter(instructor => {
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

      if (
        filters.gender !== 'all' &&
        String(instructor.gender ?? '').toLowerCase() !== filters.gender
      ) {
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
      instructor: {
        ...instructor,
        pricing: pricingMap.get(instructor.uuid),
      },
      score: getMatchScore(instructor),
      rating: instructor.rating ?? 0,
      experience: instructor.total_experience_years ?? 0,
      name: instructor.full_name ?? '',
    }));

    withScores.sort((left, right) => {
      if (sortBy === 'rating') return right.rating - left.rating;
      if (sortBy === 'experience') return right.experience - left.experience;
      if (sortBy === 'alphabetical') return left.name.localeCompare(right.name);
      if (sortBy === 'distance' && showDistance) {
        return (
          pseudoDistanceKm(left.instructor.uuid as string, filters.location) -
          pseudoDistanceKm(right.instructor.uuid as string, filters.location)
        );
      }
      if (right.score !== left.score) return right.score - left.score;
      if (right.rating !== left.rating) return right.rating - left.rating;
      return right.experience - left.experience;
    });

    return withScores.map(entry => entry.instructor);
  }, [activeInstructorList, activeView, filters, showDistance, sortBy]);

  const recommended = useMemo(() => filteredInstructors.slice(0, 3), [filteredInstructors]);

  const totalPages = Math.max(1, Math.ceil(filteredInstructors.length / PAGE_SIZE));
  const paginatedInstructors = useMemo(
    () => filteredInstructors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredInstructors, page]
  );

  useEffect(() => {
    setPage(1);
  }, [activeView, courseId, filters, sortBy]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedInstructor =
    filteredInstructors.find(instructor => instructor.uuid === selectedInstructorUuid) ?? null;

  const hireModalInstructor =
    filteredInstructors.find(instructor => instructor.uuid === hireModalInstructorUuid) ?? null;

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

  const openProfile = (uuid: string) => {
    setSelectedInstructorUuid(uuid);
    setProfileOpen(true);
  };

  const toggleSavedInstructor = (uuid: string) => {
    setSavedInstructorUuids(current =>
      current.includes(uuid) ? current.filter(item => item !== uuid) : [...current, uuid]
    );
  };

  const viewHeading =
    activeView === 'search'
      ? 'All Instructors'
      : activeView === 'saved'
        ? 'Saved Instructors'
        : 'Hired Instructors';

  const viewSubheading =
    activeView === 'search'
      ? 'Find, compare, and hire verified instructors.'
      : activeView === 'saved'
        ? 'Review the instructors you saved for later.'
        : 'See the instructors already approved for this course.';

  return (
    <div className="px-4 py-6">
      <Link
        href={buildWorkspaceAliasPath(activeDomain, '/dashboard/courses')}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Browse Courses
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{viewHeading}</h2>
          {/* <p className="text-sm text-muted-foreground">{viewSubheading}</p> */}
          <p className="text-[15px] text-muted-foreground mt-1">{course?.name}</p>

        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeView === 'search' ? 'default' : 'outline'}
            className={activeView === 'search' ? 'bg-primary hover:bg-primary/90' : ''}
            onClick={() => setActiveView('search')}
          >
            <Menu className="mr-1 h-4 w-4" /> All
          </Button>
          <Button
            size="sm"
            variant={activeView === 'saved' ? 'default' : 'outline'}
            className={activeView === 'saved' ? 'bg-primary hover:bg-primary/90' : ''}
            onClick={() => setActiveView('saved')}
          >
            <Bookmark className="mr-1 h-4 w-4" /> Saved
          </Button>
          <Button
            size="sm"
            variant={activeView === 'hired' ? 'default' : 'outline'}
            className={activeView === 'hired' ? 'bg-primary hover:bg-primary/90' : ''}
            onClick={() => setActiveView('hired')}
          >
            <BadgeCheck className="mr-1 h-4 w-4" /> Hired
          </Button>
        </div>
      </div>

      {!loading && activeInstructorList.length === 0 ? (
        <InstructorEmptyState activeView={activeView} onReset={resetFilters} />
      ) : (
        <>
          {/* {activeView === 'search' && recommended.length > 0 && (
            <section className="mt-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Recommended Instructors</h3>
                <Badge variant="secondary" className="text-[10px]">
                  AI matched
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {recommended.map(instructor => (
                  <button
                    key={instructor.uuid}
                    onClick={() => openProfile(instructor.uuid as string)}
                    className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-3 text-left transition hover:border-primary"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {instructor.full_name ?? 'Not available'}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {instructor.rating ?? '—'} · {"200 students"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                        {getMatchScore(instructor)}% match
                      </Badge>
                      {instructor.admin_verified && (
                        <Badge variant="outline" className="border-primary/40 text-primary">
                          Verified
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {getMatchReasons(instructor).join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )} */}

          <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
            {activeView === 'search' && (
              <aside className="space-y-4 rounded-xl border bg-card p-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Search</label>
                  <Input
                    value={filters.searchQuery}
                    onChange={e => updateFilter('searchQuery', e.target.value)}
                    placeholder="Name or headline"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Skill category
                  </label>

                  <Select
                    value={filters.skillCategory}
                    onValueChange={v => updateFilter('skillCategory', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                      <SelectItem value="all">Any</SelectItem>

                      {allSpecializations.map(skill => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Delivery mode</label>
                  <Select value={filters.mode} onValueChange={v => updateFilter('mode', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="physical">Physical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Location</label>
                  <Input
                    value={filters.location}
                    onChange={e => updateFilter('location', e.target.value)}
                    placeholder="City or area (e.g. Nairobi CBD)"
                  />
                  {filters.mode === 'physical' && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Distance shown from this location
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-muted-foreground">Minimum rating</label>
                    <span className="text-xs text-muted-foreground">
                      {filters.minRating ? `${filters.minRating}★+` : 'Any'}
                    </span>
                  </div>

                  <Slider
                    value={[filters.minRating]}
                    min={0}
                    max={5}
                    step={0.5}
                    onValueChange={([v]) => updateFilter('minRating', v)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Experience</label>
                  <Select
                    value={filters.experienceBand}
                    onValueChange={v => updateFilter('experienceBand', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="0-2">0–2 years</SelectItem>
                      <SelectItem value="3-5">3–5 years</SelectItem>
                      <SelectItem value="6-10">6–10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Instructor type</label>
                  <Select
                    value={filters.instructorType}
                    onValueChange={v => updateFilter('instructorType', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="organization">Organization</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Gender</label>
                  <Select value={filters.gender} onValueChange={v => updateFilter('gender', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Verification</label>
                  <Select
                    value={filters.certifications}
                    onValueChange={v => updateFilter('certifications', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="verified">Admin verified</SelectItem>
                      <SelectItem value="complete">Complete profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                  <Select value={sortBy} onValueChange={v => setSortBy(v as SortBy)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="rating">Highest rated</SelectItem>
                      <SelectItem value="experience">Most experience</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      {showDistance && <SelectItem value="distance">Nearest first</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={resetFilters}>
                  Reset filters
                </Button>
              </aside>
            )}

            <div className={activeView === 'search' ? 'space-y-4' : 'space-y-4 lg:col-span-2'}>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {filteredInstructors.length} instructor
                  {filteredInstructors.length === 1 ? '' : 's'} {activeView === 'search' ? 'match' : 'found'}
                </span>
                {activeView === 'search' && (
                  <span>
                    Page {page} of {totalPages}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="h-40 animate-pulse" />
                  ))}
                </div>
              ) : (activeView === 'search' ? paginatedInstructors : filteredInstructors).length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No instructors match these filters.
                  </CardContent>
                </Card>
              ) : (
                (activeView === 'search' ? paginatedInstructors : filteredInstructors).map(instructor => {
                  const distance = showDistance
                    ? pseudoDistanceKm(instructor.uuid as string, filters.location)
                    : null;

                  return (
                    <Card key={instructor.uuid}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {instructor?.profile_image_url ? (
                              <img
                                src={toAuthenticatedMediaUrl(instructor.profile_image_url)}
                                alt={instructor.full_name ?? "Instructor"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-7 w-7 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="text-base">
                                {instructor.full_name ?? 'Not available'}
                              </CardTitle>

                              {instructor.admin_verified && (
                                <Badge variant="outline" className="border-primary/40 text-primary">
                                  <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                                </Badge>
                              )}

                              <Badge variant="outline">
                                {getInstructorType(instructor) === 'organization'
                                  ? 'Organization'
                                  : 'Individual'}
                              </Badge>

                              {instructor.is_profile_complete && (
                                <Badge className="bg-success/10 text-success hover:bg-success/10">
                                  Profile complete
                                </Badge>
                              )}

                              {distance !== null && (
                                <Badge variant="secondary" className="inline-flex items-center gap-1">
                                  <Navigation className="h-3 w-3" />
                                  {distance} km
                                </Badge>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {getInstructorLocation(instructor)}
                              </span>
                              <span>{instructor.total_experience_years ?? 0} yrs exp</span>
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3 w-3 fill-warning text-warning" />
                                {instructor.rating ?? '—'} ({instructor.reviews?.length ?? 0} reviews)
                              </span>
                              <span>Students taught: Not available</span>
                            </div>

                            <div className="mt-1 text-xs text-foreground">
                              {instructor.professional_headline ?? 'Not available'}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                          <div className="inline-flex items-center gap-1.5">
                            <Languages className="h-3.5 w-3.5" /> English
                          </div>
                          <div>Teaching: Not available</div>
                          <div>Modes: {getDeliveryModesLabel(instructor)}</div>
                          <div>Hourly: {instructor.pricing?.rate_card?.currency} {instructor.pricing?.rate_card?.group_inperson_hourly_rate ?? 'Not available'}</div>
                          <div>Group: {instructor.pricing?.rate_card?.currency} {instructor.pricing?.rate_card?.group_inperson_hourly_rate ?? 'Not available'}</div>
                          <div>Private: {instructor.pricing?.rate_card?.currency} {instructor.pricing?.rate_card?.private_inperson_hourly_rate ?? 'Not available'}</div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => setHireModalInstructorUuid(instructor.uuid as string)}
                          >
                            Hire Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openProfile(instructor.uuid as string)}
                          >
                            View Profile
                          </Button>
                          <Button size="sm" variant="outline" disabled title="Not available">
                            <PlayCircle className="mr-1 h-4 w-4" />
                            Intro
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleSavedInstructor(instructor.uuid as string)}
                          >
                            <Bookmark className="mr-1 h-4 w-4" />
                            {savedInstructorUuids.includes(instructor.uuid as string) ? 'Saved' : 'Save'}
                          </Button>
                          <Button size="sm" variant="ghost" disabled title="Not available">
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Message
                          </Button>
                          <Button size="sm" variant="ghost" disabled title="Not available">
                            <Wallet className="mr-1 h-4 w-4" />
                            Pay Wallet
                          </Button>
                          <Button size="sm" variant="ghost" disabled title="Not available">
                            <PiggyBank className="mr-1 h-4 w-4" />
                            Skills Fund
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {activeView === 'search' && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(current => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <Button
                      key={n}
                      size="sm"
                      variant={n === page ? 'default' : 'outline'}
                      className={n === page ? 'bg-primary hover:bg-primary/90' : ''}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Sheet open={profileOpen} onOpenChange={o => setProfileOpen(o)} >
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>{selectedInstructor?.full_name ?? 'Not available'}</SheetTitle>
          </SheetHeader>

          {selectedInstructor && (
            <Tabs defaultValue="profile" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-2 pt-3 text-sm">
                <p>{stripHtml(selectedInstructor.bio) ?? 'Not available'}</p>
                <div>
                  <strong>Headline:</strong> {selectedInstructor.professional_headline ?? 'Not available'}
                </div>
                <div>
                  <strong>Experience:</strong> {selectedInstructor.total_experience_years ?? 0} years
                </div>
                <div>
                  <strong>Location:</strong> {getInstructorLocation(selectedInstructor)}
                </div>
                <div>
                  <strong>Specializations:</strong>{' '}
                  {selectedInstructor.specializations?.length
                    ? selectedInstructor.specializations.map(s => s.skill_name).join(', ')
                    : 'Not available'}
                </div>
                <div>
                  <strong>Delivery:</strong> {getDeliveryModesLabel(selectedInstructor)}
                </div>
                <div>
                  <strong>Languages:</strong> English
                </div>
                <div>
                  <strong>Teaching style:</strong> Project-based, hands-on, interactive
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="pt-3 text-sm text-muted-foreground">
                No portfolio provided.
              </TabsContent>

              <TabsContent value="reviews" className="pt-3 text-sm">
                <div className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />{' '}
                  {selectedInstructor.rating != null
                    ? Number(selectedInstructor.rating).toFixed(1)
                    : '—'}{' '}
                  across {selectedInstructor.review_count ?? '—'} reviews
                </div>

                {/* Reviews */}
                <div className="space-y-3 mt-2">
                  {selectedInstructor.reviews?.length ? (
                    selectedInstructor.reviews.map(review => (
                      <div
                        key={review.uuid}
                        className="rounded-sm border border-border bg-card p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="truncate text-sm font-semibold text-foreground">
                                {review.headline || ''}
                              </h4>

                              {review.is_anonymous && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  Anonymous
                                </span>
                              )}
                            </div>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {new Date(review.created_date).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                            <span className="text-xs font-semibold">
                              {Number(review.rating).toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {review.comments && (
                          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                            {review.comments}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                      No reviews yet.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="availability" className="pt-3 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-1">
                  <CalIcon className="h-4 w-4" /> Availability calendar coming soon.
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

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

function InstructorEmptyState({
  activeView,
  onReset,
}: {
  activeView: ActiveView;
  onReset: () => void;
}) {
  const copy =
    activeView === 'search'
      ? {
        title: 'No instructors are currently available',
        body: "Try broadening your filters, or check back once instructors have been added.",
      }
      : activeView === 'saved'
        ? {
          title: 'No saved instructors yet',
          body: 'Save instructors from the search tab to see them here.',
        }
        : {
          title: 'No hired instructors yet',
          body: 'Approved hires for this course will appear here once they are added.',
        };

  return (
    <Card className="mt-6 border-dashed">
      <CardContent className="py-10 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{copy.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
        {activeView === 'search' && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={onReset}>
              Reset filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}