'use client';

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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Filter, MapPin, Search, Star, X } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { searchSkillsOptions } from '../../../services/client/@tanstack/react-query.gen';
import { InstructorCard } from '../@student/_components/instructor-card';
import { InstructorProfileComponent } from '../@student/_components/instructor-profile-modal';
import type { Booking } from '../@student/all-courses/instructor/page';

type Props = {
  instructors: any[];
  classes: any[];
  onBookingComplete: (booking: Booking) => void;
  courseId: string;
  isLoading?: boolean;
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

export const InstructorDirectory: React.FC<Props> = ({
  instructors,
  classes: _classes,
  onBookingComplete,
  courseId,
  isLoading = false,
}) => {
  const [selectedInstructor, setSelectedInstructor] = useState<any | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
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
  });

  // specializations and skils
  const { data: newSkllll } = useQuery(
    searchSkillsOptions({ query: { pageable: {}, searchParams: {} } })
  );

  const allSpecializations = useMemo(() => {
    return [
      ...new Set(
        newSkllll?.data?.content
          ?.map((skill: any) => skill?.skill_name)
          ?.filter(
            (name: any): name is string => typeof name === 'string' && name.trim().length > 0
          )
      ),
    ];
  }, [newSkllll]);

  const activeFilterCount = [
    filters.specializations.length > 0,
    filters.mode.length > 0,
    filters.instructorType !== 'all',
    filters.gender !== 'all',
    filters.minRating > 0,
    filters.location.trim().length > 0,
    filters.searchQuery.trim().length > 0,
    filters.experience[0] !== 0 || filters.experience[1] !== 20,
    filters.feeRange[0] !== 0 || filters.feeRange[1] !== 1000,
  ].filter(Boolean).length;

  // Filter instructors based on criteria
  const filteredInstructors = instructors
    ?.filter(instructor => {
      if (
        filters.searchQuery &&
        !instructor.full_name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !instructor.professional_headline
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) &&
        !instructor.bio.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Instructor type
      if (filters.instructorType !== 'all') {
        const isOrganization = instructor.user_domain?.includes('organization');
        const instructorType = isOrganization ? 'organization' : 'individual';
        if (instructorType !== filters.instructorType) {
          return false;
        }
      }

      // Gender
      if (
        filters.gender !== 'all' &&
        String(instructor.gender ?? '').toLowerCase() !== filters.gender
      ) {
        return false;
      }

      // Rating
      if (instructor.rating < filters.minRating) {
        return false;
      }

      // Experience
      if (
        // @ts-expect-error
        instructor.total_experience_years < filters.experience[0] ||
        // @ts-expect-error
        instructor.total_experience_years > filters.experience[1]
      ) {
        return false;
      }

      // Specializations
      // Specializations
      if (filters.specializations.length > 0) {
        const instructorSkillNames =
          instructor.specializations?.map((s: any) => s.skill_name.toLowerCase()) ?? [];

        const hasMatch = filters.specializations.some(spec =>
          instructorSkillNames.includes(spec.toLowerCase())
        );

        if (!hasMatch) {
          return false;
        }
      }

      // Fee range
      // if (
      //     instructor.rateCard.hourly < filters.feeRange[0] ||
      //     instructor.rateCard.hourly > filters.feeRange[1]
      // ) {
      //     return false;
      // }

      // Mode
      // if (
      //   filters.mode.length > 0 &&
      //   !filters.mode.some(m => instructor.mode.includes(m as 'online' | 'onsite'))
      // ) {
      //   return false;
      // }

      // Location
      if (
        filters.location &&
        !String(instructor.location?.city ?? '')
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    ?.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      if (b.total_experience_years !== a.total_experience_years) {
        return b.total_experience_years - a.total_experience_years;
      }

      const aSpecs = a.specializations?.length ?? 0;
      const bSpecs = b.specializations?.length ?? 0;

      return bSpecs - aSpecs;
    });

  const clearFilters = () => {
    setFilters({
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
    });
  };

  const toggleSpecialization = (spec: string) => {
    setFilters(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const toggleMode = (mode: string) => {
    setFilters(prev => ({
      ...prev,
      mode: prev.mode.includes(mode) ? prev.mode.filter(m => m !== mode) : [...prev.mode, mode],
    }));
  };

  const filterPanel = (
    <div className='space-y-6 p-5 sm:p-6'>
      <div className='flex items-center justify-between gap-3'>
        <div className='space-y-1'>
          <h3 className='flex items-center gap-2 text-base font-semibold'>
            <Filter className='h-4 w-4' />
            Filters
          </h3>
          <p className='text-muted-foreground text-sm'>
            Narrow the directory without losing space for instructor cards.
          </p>
        </div>
        <Button variant='ghost' size='sm' onClick={clearFilters} className='h-8 px-2'>
          Clear all
        </Button>
      </div>

      <div>
        <Label>Search</Label>
        <div className='relative mt-2'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder='Search instructors...'
            value={filters.searchQuery}
            onChange={e => setFilters({ ...filters, searchQuery: e.target.value })}
            className='pl-10'
          />
        </div>
      </div>

      <div className='w-full'>
        <Label>Instructor Type</Label>
        <Select
          value={filters.instructorType}
          onValueChange={(value: any) => setFilters({ ...filters, instructorType: value })}
        >
          <SelectTrigger className='mt-2 w-full'>
            <SelectValue placeholder='Select instructor type' />
          </SelectTrigger>
          <SelectContent className='w-full'>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='individual'>Individual</SelectItem>
            <SelectItem value='organization'>Organization</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Gender</Label>
        <Select
          value={filters.gender}
          onValueChange={(value: any) => setFilters({ ...filters, gender: value })}
        >
          <SelectTrigger className='mt-2 w-full'>
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

      <div>
        <Label>Minimum Rating</Label>
        <div className='mt-2 flex items-center gap-2'>
          <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
          <Slider
            value={[filters.minRating]}
            onValueChange={value => setFilters({ ...filters, minRating: value[0] ?? 0 })}
            max={5}
            step={0.5}
            className='flex-1'
          />
          <span className='w-8 text-sm'>{filters.minRating.toFixed(1)}</span>
        </div>
      </div>

      <div>
        <Label>Experience (years)</Label>
        <div className='mt-2 flex items-center gap-2'>
          <Slider
            value={filters.experience}
            onValueChange={value => setFilters({ ...filters, experience: value })}
            max={20}
            step={1}
            className='my-2 flex-1'
          />
        </div>
        <p className='text-muted-foreground mt-1 text-sm'>
          {filters.experience[0]} - {filters.experience[1]} years
        </p>
      </div>

      <div>
        <Label>Specializations</Label>
        <div className='mt-3 space-y-2'>
          {allSpecializations.slice(0, 5).map((spec: any) => (
            <div key={spec} className='flex items-center gap-2.5'>
              <Checkbox
                id={`spec-${spec}`}
                checked={filters.specializations.includes(spec)}
                onCheckedChange={() => toggleSpecialization(spec)}
              />
              <label htmlFor={`spec-${spec}`} className='cursor-pointer text-sm'>
                {spec}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Hourly Rate (USD)</Label>
        <div className='mt-2 flex items-center gap-2'>
          <DollarSign className='text-muted-foreground h-4 w-4' />
          <Slider
            value={filters.feeRange}
            onValueChange={value => setFilters({ ...filters, feeRange: value })}
            max={1000}
            step={10}
            className='flex-1'
          />
        </div>
        <p className='text-muted-foreground mt-1 text-sm'>
          ${filters.feeRange[0]} - ${filters.feeRange[1]}
        </p>
      </div>

      <div>
        <Label>Mode</Label>
        <div className='mt-2 space-y-2'>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='mode-online'
              checked={filters.mode.includes('online')}
              onCheckedChange={() => toggleMode('online')}
            />
            <label htmlFor='mode-online' className='cursor-pointer text-sm'>
              Online
            </label>
          </div>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='mode-onsite'
              checked={filters.mode.includes('onsite')}
              onCheckedChange={() => toggleMode('onsite')}
            />
            <label htmlFor='mode-onsite' className='cursor-pointer text-sm'>
              Onsite
            </label>
          </div>
        </div>
      </div>

      <div>
        <Label>Location</Label>
        <div className='relative mt-2'>
          <MapPin className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder='City name...'
            value={filters.location}
            onChange={e => setFilters({ ...filters, location: e.target.value })}
            className='pl-10'
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className='space-y-6'>
      {!selectedInstructor && (
        <Card className='border-border/60 bg-card/80 rounded-[32px] p-6 shadow-sm'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div className='space-y-2'>
              <h2 className='text-2xl font-semibold'>Instructor discovery</h2>
              <p className='text-muted-foreground max-w-3xl text-sm'>
                Explore approved instructors for this course, compare expertise and pricing, then
                open a full profile before you book.
              </p>
            </div>

            <div className='flex flex-wrap gap-3 text-sm'>
              <div className='border-border rounded-full border px-4 py-2'>
                {filteredInstructors?.length ?? 0} matched instructor
                {(filteredInstructors?.length ?? 0) === 1 ? '' : 's'}
              </div>
              <div className='border-border rounded-full border px-4 py-2'>
                {filters.specializations.length} active specialization filter
                {filters.specializations.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {selectedInstructor ? (
        <InstructorProfileComponent
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
          onBookingComplete={onBookingComplete}
        />
      ) : (
        <>
          <div className='min-w-0'>
            <div className='mb-6 flex flex-col gap-4 rounded-[32px] border border-border/60 bg-card/70 p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between'>
              <div className='space-y-2'>
                <p className='text-muted-foreground text-sm'>
                  Showing {filteredInstructors?.length} of {instructors?.length} instructors
                </p>
                <div className='flex flex-wrap gap-2 text-sm'>
                  <div className='rounded-full border border-border px-3 py-1.5'>
                    {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
                  </div>
                  <div className='rounded-full border border-border px-3 py-1.5'>
                    {allSpecializations.length} available specialization
                    {allSpecializations.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-3'>
                <Button onClick={() => setIsFiltersOpen(true)} className='gap-2'>
                  <Filter className='h-4 w-4' />
                  Open filters
                  <span className='rounded-full bg-background/90 px-2 py-0.5 text-xs text-foreground'>
                    {activeFilterCount}
                  </span>
                </Button>
                {activeFilterCount > 0 && (
                  <Button onClick={clearFilters} variant='ghost' className='px-2'>
                    Reset filters
                  </Button>
                )}
              </div>
            </div>

            {(filters.specializations.length > 0 ||
              filters.mode.length > 0 ||
              filters.instructorType !== 'all' ||
              filters.minRating > 0) && (
                <div className='mb-6 flex flex-wrap gap-2'>
                  {filters.specializations.map(spec => (
                    <Badge key={spec} variant='secondary' className='gap-1'>
                      {spec}
                      <X
                        className='h-3 w-3 cursor-pointer'
                        onClick={() => toggleSpecialization(spec)}
                      />
                    </Badge>
                  ))}
                  {filters.mode.map(mode => (
                    <Badge key={mode} variant='secondary' className='gap-1'>
                      {mode}
                      <X className='h-3 w-3 cursor-pointer' onClick={() => toggleMode(mode)} />
                    </Badge>
                  ))}
                  {filters.instructorType !== 'all' && (
                    <Badge variant='secondary' className='gap-1'>
                      {filters.instructorType}
                      <X
                        className='h-3 w-3 cursor-pointer'
                        onClick={() => setFilters({ ...filters, instructorType: 'all' })}
                      />
                    </Badge>
                  )}
                  {filters.minRating > 0 && (
                    <Badge variant='secondary' className='gap-1'>
                      {filters.minRating}+ rating
                      <X
                        className='h-3 w-3 cursor-pointer'
                        onClick={() => setFilters({ ...filters, minRating: 0 })}
                      />
                    </Badge>
                  )}
                </div>
              )}

            {isLoading ? (
              <Card className='rounded-[32px] p-12 text-center shadow-sm'>
                <Search className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <h3 className='text-lg font-semibold'>Loading instructors</h3>
                <p className='text-muted-foreground mt-2 text-sm'>
                  Approved instructor profiles are being prepared for this course.
                </p>
              </Card>
            ) : filteredInstructors?.length === 0 ? (
              <Card className='p-12 text-center'>
                <Search className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <h3>No instructors found</h3>
                <p className='text-muted-foreground mt-2'>
                  Try adjusting your filters to see more results
                </p>
                <Button onClick={clearFilters} variant='outline' className='mt-4'>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5 2xl:grid-cols-3'>
                {filteredInstructors?.map((instructor: any, index: any) => (
                  <div key={index} className='min-w-0'>
                    <InstructorCard
                      key={instructor?.uuid}
                      instructor={instructor}
                      onViewProfile={() => setSelectedInstructor(instructor)}
                      courseId={courseId}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetContent side='right' className='w-[100vw] max-w-md overflow-y-auto p-0 pb-6'>
              <SheetHeader className='border-border border-b px-5 py-4 text-left sm:px-6'>
                <SheetTitle>Filter instructors</SheetTitle>
                <SheetDescription>
                  Refine the directory while keeping the card grid fully visible.
                </SheetDescription>
              </SheetHeader>
              {filterPanel}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
};
