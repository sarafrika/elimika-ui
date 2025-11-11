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
import { Slider } from '@/components/ui/slider';
import { DollarSign, Filter, MapPin, Search, Star, X } from 'lucide-react';
import React, { useState } from 'react';
import { InstructorCard } from '../@student/_components/instructor-card';
import { InstructorProfileModal } from '../@student/_components/instructor-profile-modal';
import { Booking, Instructor } from '../@student/browse-courses/instructor/page';

type Props = {
  instructors: any[];
  classes: any[];
  onBookingComplete: (booking: Booking) => void;
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
  classes,
  onBookingComplete,
}) => {
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [showFilters, setShowFilters] = useState(true);
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

  // Get unique values for filter options
  const allSpecializations = [
    'specialization1',
    'specialization2',
    'specialization3',
    'specialization4',
    'specialization5',
  ] as any;
  const allCourses = [...new Set(instructors?.flatMap(i => i.courses))] as any;

  // Filter instructors based on criteria
  const filteredInstructors = instructors?.filter(instructor => {
    if (
      filters.searchQuery &&
      !instructor.full_name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
      !instructor.professional_headline.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
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
    if (filters.gender !== 'all' && instructor.gender.toLowerCase() !== filters.gender) {
      return false;
    }

    // Rating
    if (instructor.rating < filters.minRating) {
      return false;
    }

    // Experience
    if (
      // @ts-ignore
      instructor.total_experience_years < filters.experience[0] ||
      // @ts-ignore
      instructor.total_experience_years > filters.experience[1]
    ) {
      return false;
    }

    // Specializations
    if (
      filters.specializations.length > 0 &&
      !filters.specializations.some(spec => instructor.specializations.includes(spec))
    ) {
      return false;
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
      !instructor.location?.city.toLowerCase().includes(filters.location.toLowerCase())
    ) {
      return false;
    }

    return true;
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

  return (
    <div className='flex gap-6'>
      {/* Filter Sidebar */}
      {showFilters && <div className='w-60 flex-shrink-0 space-y-4 xl:w-80'>
        <Card className='space-y-6 p-4'>
          <div className='flex items-center justify-between'>
            <h3 onClick={() => { }} className='flex items-center gap-2'>
              <Filter className='h-4 w-4' />
              Filters
            </h3>
            <Button variant='ghost' size='sm' onClick={clearFilters} className='h-8 px-2'>
              Clear All
            </Button>
          </div>

          {/* Search */}
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

          {/* Instructor Type */}
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

          {/* Gender */}
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

          {/* Minimum Rating */}
          <div>
            <Label>Minimum Rating</Label>
            <div className='mt-2 flex items-center gap-2'>
              <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
              <Slider
                value={[filters.minRating]}
                onValueChange={
                  value => setFilters({ ...filters })
                  // setFilters({ ...filters, minRating: value[0] })
                }
                max={5}
                step={0.5}
                className='flex-1'
              />
              <span className='w-8 text-sm'>{filters.minRating.toFixed(1)}</span>
            </div>
          </div>

          {/* Experience */}
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

          {/* Specializations */}
          <div>
            <Label>Specializations</Label>
            <div className='mt-2 space-y-2'>
              {allSpecializations.slice(0, 5).map((spec: any) => (
                <div key={spec} className='flex items-center gap-2'>
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

          {/* Fee Range */}
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

          {/* Mode */}
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

          {/* Location */}
          <div className='pb-20'>
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
        </Card>
      </div>}

      {/* Main Content */}
      <div className='flex-1'>
        {/* Results Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <p className='text-muted-foreground'>
              Showing {filteredInstructors?.length} of {instructors?.length} instructors
            </p>
          </div>
          <Button variant='outline' onClick={() => setShowFilters(!showFilters)} className='gap-2'>
            <Filter className='h-4 w-4' />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>

        {/* Active Filters */}
        {(filters.specializations.length > 0 ||
          filters.mode.length > 0 ||
          filters.instructorType !== 'all' ||
          filters.minRating > 0) && (
            <div className='mb-6 flex flex-wrap gap-2'>
              {filters.specializations.map(spec => (
                <Badge key={spec} variant='secondary' className='gap-1'>
                  {spec}
                  <X className='h-3 w-3 cursor-pointer' onClick={() => toggleSpecialization(spec)} />
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

        {/* Instructor Grid */}
        {filteredInstructors?.length === 0 ? (
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
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-2'>
            {filteredInstructors?.map((instructor: any, index: any) => (
              <div key={index}>
                <InstructorCard
                  key={instructor?.uuid}
                  instructor={instructor}
                  onViewProfile={() => setSelectedInstructor(instructor)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructor Profile Modal */}
      {selectedInstructor && (
        <InstructorProfileModal
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
          onBookingComplete={onBookingComplete}
        />
      )}
    </div>
  );
};
