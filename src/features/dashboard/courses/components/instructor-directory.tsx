'use client';

import { InstructorCard } from '@/app/dashboard/@student/_components/instructor-card';
import { InstructorProfileComponent } from '@/app/dashboard/@student/_components/instructor-profile-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { searchSkillsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Booking } from '@/src/features/dashboard/courses/pages/InstructorBookingPage';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Filter, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { BundledClass, SearchInstructor } from '../types';

type Props = {
  instructors: SearchInstructor[];
  classes: BundledClass[];
  onBookingComplete: (booking: Booking) => void;
  courseId: string;
};

type Filters = {
  searchQuery: string;
  courseType: string[];
  instructorType: 'all' | 'individual' | 'organization';
  gender: 'all' | 'male' | 'female' | 'other';
  minRating: number;
  experience: number[];
  specializations: string[];
  feeRange: number[];
  skillLevel: string[];
  mode: string[];
  location: string;
};

const defaultFilters: Filters = {
  searchQuery: '',
  courseType: [],
  instructorType: 'all',
  gender: 'all',
  minRating: 0,
  experience: [0, 20],
  specializations: [],
  feeRange: [0, 1000],
  skillLevel: [],
  mode: [],
  location: '',
};

const getInstructorBatchSize = (width: number) => {
  if (width >= 1536) return 9;
  if (width >= 768) return 6;
  return 4;
};

export const InstructorDirectory: React.FC<Props> = ({
  instructors,
  classes: _classes,
  onBookingComplete,
  courseId,
}) => {
  const [selectedInstructor, setSelectedInstructor] = useState<SearchInstructor | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [visibleInstructorCount, setVisibleInstructorCount] = useState(6);

  useEffect(() => {
    const syncVisibleCountToViewport = () => {
      const batchSize = getInstructorBatchSize(window.innerWidth);
      setVisibleInstructorCount(current => {
        if (current <= batchSize) {
          return batchSize;
        }

        return Math.ceil(current / batchSize) * batchSize;
      });
    };

    syncVisibleCountToViewport();
    window.addEventListener('resize', syncVisibleCountToViewport);

    return () => {
      window.removeEventListener('resize', syncVisibleCountToViewport);
    };
  }, []);

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
      ],
    [skillsResponse]
  );

  const filteredInstructors = useMemo(
    () =>
      instructors
        ?.filter(instructor => {
          if (
            filters.searchQuery &&
            !(instructor.full_name ?? '').toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
            !(instructor.professional_headline ?? '')
              .toLowerCase()
              .includes(filters.searchQuery.toLowerCase()) &&
            !(instructor.bio ?? '').toLowerCase().includes(filters.searchQuery.toLowerCase())
          ) {
            return false;
          }

          if (filters.instructorType !== 'all') {
            const isOrganization = instructor.user_domain?.includes('organization');
            const instructorType = isOrganization ? 'organization' : 'individual';
            if (instructorType !== filters.instructorType) {
              return false;
            }
          }

          if (filters.gender !== 'all' && (instructor.gender ?? '').toLowerCase() !== filters.gender) {
            return false;
          }

          if ((instructor.rating ?? 0) < filters.minRating) {
            return false;
          }

          if (
            instructor.total_experience_years < filters.experience[0] ||
            instructor.total_experience_years > filters.experience[1]
          ) {
            return false;
          }

          if (filters.specializations.length > 0) {
            const instructorSkillNames = instructor.specializations.map(skill =>
              skill.skill_name.toLowerCase()
            );

            const hasMatch = filters.specializations.some(spec =>
              instructorSkillNames.includes(spec.toLowerCase())
            );

            if (!hasMatch) {
              return false;
            }
          }

          if (
            filters.location &&
            !(instructor.location?.city ?? '').toLowerCase().includes(filters.location.toLowerCase())
          ) {
            return false;
          }

          return true;
        })
        ?.sort((left, right) => {
          if ((right.rating ?? 0) !== (left.rating ?? 0)) {
            return (right.rating ?? 0) - (left.rating ?? 0);
          }

          if (right.total_experience_years !== left.total_experience_years) {
            return right.total_experience_years - left.total_experience_years;
          }

          const leftSpecs = left.specializations?.length ?? 0;
          const rightSpecs = right.specializations?.length ?? 0;

          return rightSpecs - leftSpecs;
        }),
    [filters, instructors]
  );

  const visibleInstructors = filteredInstructors.slice(0, visibleInstructorCount);
  const hasMoreInstructors = filteredInstructors.length > visibleInstructorCount;

  const clearFilters = () => {
    setFilters(defaultFilters);
    setVisibleInstructorCount(getInstructorBatchSize(window.innerWidth));
  };

  const toggleSpecialization = (specialization: string) => {
    setFilters(current => ({
      ...current,
      specializations: current.specializations.includes(specialization)
        ? current.specializations.filter(spec => spec !== specialization)
        : [...current.specializations, specialization],
    }));
    setVisibleInstructorCount(getInstructorBatchSize(window.innerWidth));
  };

  const toggleMode = (mode: string) => {
    setFilters(current => ({
      ...current,
      mode: current.mode.includes(mode)
        ? current.mode.filter(item => item !== mode)
        : [...current.mode, mode],
    }));
    setVisibleInstructorCount(getInstructorBatchSize(window.innerWidth));
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(current => ({ ...current, [key]: value }));
    setVisibleInstructorCount(getInstructorBatchSize(window.innerWidth));
  };

  const activeFilterCount =
    filters.specializations.length +
    filters.mode.length +
    (filters.instructorType !== 'all' ? 1 : 0) +
    (filters.gender !== 'all' ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.location ? 1 : 0);

  const filterPanel = (
    <Card className='space-y-4 rounded-[22px] border bg-card p-4 shadow-none'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='flex items-center gap-2 text-sm font-semibold'>
          <Filter className='h-4 w-4' />
          Filters
        </h3>
        <Button variant='ghost' size='sm' onClick={clearFilters} className='h-8 rounded-lg px-2'>
          Clear All
        </Button>
      </div>

      <div className='space-y-1'>
        <Label className='text-xs font-medium'>Search</Label>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search instructors...'
            value={filters.searchQuery}
            onChange={event => updateFilter('searchQuery', event.target.value)}
            className='h-10 rounded-xl pl-10'
          />
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-1'>
        <div className='space-y-1'>
          <Label className='text-xs font-medium'>Instructor Type</Label>
          <Select
            value={filters.instructorType}
            onValueChange={value =>
              updateFilter('instructorType', value as Filters['instructorType'])
            }
          >
            <SelectTrigger className='h-10 rounded-xl'>
              <SelectValue placeholder='Select instructor type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='individual'>Individual</SelectItem>
              <SelectItem value='organization'>Organization</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1'>
          <Label className='text-xs font-medium'>Gender</Label>
          <Select
            value={filters.gender}
            onValueChange={value => updateFilter('gender', value as Filters['gender'])}
          >
            <SelectTrigger className='h-10 rounded-xl'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='male'>Male</SelectItem>
              <SelectItem value='female'>Female</SelectItem>
              <SelectItem value='other'>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-1'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-3'>
            <Label className='text-xs font-medium'>Minimum Rating</Label>
            <span className='text-muted-foreground text-xs'>{filters.minRating.toFixed(1)}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
            <Slider
              value={[filters.minRating]}
              onValueChange={value => updateFilter('minRating', value[0] ?? 0)}
              max={5}
              step={0.5}
              className='flex-1'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-3'>
            <Label className='text-xs font-medium'>Experience</Label>
            <span className='text-muted-foreground text-xs'>
              {filters.experience[0]} - {filters.experience[1]} yrs
            </span>
          </div>
          <Slider
            value={filters.experience}
            onValueChange={value => updateFilter('experience', value as Filters['experience'])}
            max={20}
            step={1}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex items-center justify-between gap-3'>
          <Label className='text-xs font-medium'>Specializations</Label>
          <span className='text-muted-foreground text-xs'>
            {filters.specializations.length} selected
          </span>
        </div>
        <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-1'>
          {allSpecializations.slice(0, 6).map(spec => (
            <label key={spec} className='flex items-center gap-2 rounded-xl border px-3 py-2 text-sm'>
              <Checkbox
                checked={filters.specializations.includes(spec)}
                onCheckedChange={() => toggleSpecialization(spec)}
              />
              <span className='line-clamp-1'>{spec}</span>
            </label>
          ))}
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-1'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-3'>
            <Label className='text-xs font-medium'>Hourly Rate</Label>
            <span className='text-muted-foreground text-xs'>
              ${filters.feeRange[0]} - ${filters.feeRange[1]}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <DollarSign className='text-muted-foreground h-4 w-4' />
            <Slider
              value={filters.feeRange}
              onValueChange={value => updateFilter('feeRange', value as Filters['feeRange'])}
              max={1000}
              step={10}
              className='flex-1'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label className='text-xs font-medium'>Location</Label>
          <div className='relative'>
            <MapPin className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='City name...'
              value={filters.location}
              onChange={event => updateFilter('location', event.target.value)}
              className='h-10 rounded-xl pl-10'
            />
          </div>
        </div>
      </div>

      <div className='space-y-2'>
        <Label className='text-xs font-medium'>Mode</Label>
        <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-1'>
          {['online', 'onsite'].map(mode => (
            <label key={mode} className='flex items-center gap-2 rounded-xl border px-3 py-2 text-sm capitalize'>
              <Checkbox
                checked={filters.mode.includes(mode)}
                onCheckedChange={() => toggleMode(mode)}
              />
              <span>{mode}</span>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );

  return (
    <div className='grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]'>
      {!selectedInstructor ? (
        <>
          <div className='hidden xl:block xl:sticky xl:top-4 xl:h-fit'>{filterPanel}</div>

          <div className='min-w-0'>
            <Card className='mb-5 rounded-[22px] border bg-card p-4 shadow-none sm:p-5'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <p className='text-foreground text-sm font-semibold'>Instructor results</p>
                  <p className='text-muted-foreground text-sm'>
                    Showing {visibleInstructors.length} of {filteredInstructors.length} matching instructors
                  </p>
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant='outline' className='gap-2 rounded-xl shadow-none xl:hidden'>
                      <SlidersHorizontal className='h-4 w-4' />
                      Filters
                      {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='left' className='w-[88vw] max-w-sm overflow-y-auto p-0'>
                    <SheetHeader className='border-b px-4 py-4'>
                      <SheetTitle>Filter Instructors</SheetTitle>
                      <SheetDescription>
                        Refine the instructor list by search, experience, rating, mode and specialization.
                      </SheetDescription>
                    </SheetHeader>
                    <div className='p-4'>{filterPanel}</div>
                  </SheetContent>
                </Sheet>
              </div>
            </Card>

            {activeFilterCount > 0 ? (
              <div className='mb-5 flex flex-wrap gap-2'>
                {filters.specializations.map(spec => (
                  <Badge key={spec} variant='secondary' className='gap-1 rounded-full px-3 py-1'>
                    {spec}
                    <X className='h-3 w-3 cursor-pointer' onClick={() => toggleSpecialization(spec)} />
                  </Badge>
                ))}
                {filters.mode.map(mode => (
                  <Badge key={mode} variant='secondary' className='gap-1 rounded-full px-3 py-1'>
                    {mode}
                    <X className='h-3 w-3 cursor-pointer' onClick={() => toggleMode(mode)} />
                  </Badge>
                ))}
                {filters.instructorType !== 'all' ? (
                  <Badge variant='secondary' className='gap-1 rounded-full px-3 py-1'>
                    {filters.instructorType}
                    <X
                      className='h-3 w-3 cursor-pointer'
                      onClick={() => updateFilter('instructorType', 'all')}
                    />
                  </Badge>
                ) : null}
                {filters.gender !== 'all' ? (
                  <Badge variant='secondary' className='gap-1 rounded-full px-3 py-1'>
                    {filters.gender}
                    <X className='h-3 w-3 cursor-pointer' onClick={() => updateFilter('gender', 'all')} />
                  </Badge>
                ) : null}
                {filters.minRating > 0 ? (
                  <Badge variant='secondary' className='gap-1 rounded-full px-3 py-1'>
                    {filters.minRating}+ rating
                    <X className='h-3 w-3 cursor-pointer' onClick={() => updateFilter('minRating', 0)} />
                  </Badge>
                ) : null}
              </div>
            ) : null}

            {filteredInstructors.length === 0 ? (
              <Card className='rounded-[22px] border border-dashed p-12 text-center shadow-none'>
                <Search className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <h3>No instructors found</h3>
                <p className='text-muted-foreground mt-2'>
                  Try adjusting your filters to see more results.
                </p>
                <Button onClick={clearFilters} variant='outline' className='max-auto self-center max-w-fit px-4 mt-4 rounded-md shadow-none'>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
                  {visibleInstructors.map(instructor => (
                    <InstructorCard
                      key={instructor.uuid}
                      instructor={instructor}
                      onViewProfile={() => setSelectedInstructor(instructor)}
                      courseId={courseId}
                    />
                  ))}
                </div>

                {hasMoreInstructors ? (
                  <div className='mt-5 flex justify-center'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() =>
                        setVisibleInstructorCount(current => current + getInstructorBatchSize(window.innerWidth))
                      }
                      className='rounded-xl px-5 shadow-none'
                    >
                      Show More
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </>
      ) : null}

      {selectedInstructor ? (
        <InstructorProfileComponent
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
          onBookingComplete={onBookingComplete}
        />
      ) : null}
    </div>
  );
};
