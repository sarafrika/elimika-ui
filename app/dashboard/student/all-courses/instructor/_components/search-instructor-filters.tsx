'use client';

import type React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';

export type InstructorSearchFiltersState = {
  searchQuery: string;
  skillCategory: string;
  location: string;
  minRating: number;
  experienceBand: string;
  gender: string;
  instructorType: string;
  specialist: string;
  availability: string;
  certifications: string;
  language: string;
  mode: string;
  priceBand: number[];
};

type Props = {
  filters: InstructorSearchFiltersState;
  allSpecializations: string[];
  onChange: <K extends keyof InstructorSearchFiltersState>(
    key: K,
    value: InstructorSearchFiltersState[K]
  ) => void;
  onReset: () => void;
  onApply: () => void;
};

const experienceLabels = [
  { label: 'All Levels', value: 'all' },
  { label: '0 - 2 Years', value: '0-2' },
  { label: '3 - 5 Years', value: '3-5' },
  { label: '6 - 10 Years', value: '6-10' },
  { label: '10+ Years', value: '10+' },
];

const ratingLabels = [
  { label: 'Any Rating', value: '0' },
  { label: '4.5+', value: '4.5' },
  { label: '4.0+', value: '4.0' },
  { label: '3.5+', value: '3.5' },
];

const genericLabels = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Open', value: 'open' },
];

export const searchInstructorFiltersDefaults: InstructorSearchFiltersState = {
  searchQuery: '',
  skillCategory: 'all',
  location: '',
  minRating: 0,
  experienceBand: 'all',
  gender: 'all',
  instructorType: 'all',
  specialist: 'all',
  availability: 'all',
  certifications: 'all',
  language: 'all',
  mode: 'all',
  priceBand: [0, 5000],
};

export function SearchInstructorFilters({
  filters,
  allSpecializations,
  onChange,
  onReset,
  onApply,
}: Props) {
  return (
    <Card className='rounded-xl border bg-card p-4 shadow-none sm:p-5'>
      <div className='flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <SlidersHorizontal className='text-primary size-4' />
          <h2 className='text-sm font-semibold sm:text-base'>Search and filter instructors</h2>
        </div>
        <div className='text-muted-foreground text-xs sm:text-sm'>
          Narrow by expertise, location, rating, and experience
        </div>
      </div>

      <div className='mt-4 flex flex-col gap-3 lg:flex-row lg:items-center'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={filters.searchQuery}
            onChange={event => onChange('searchQuery', event.target.value)}
            placeholder='Search by skill, name, certification (e.g., Piano, AI, Football Coach)'
            className='h-11 rounded-xl pl-10 text-sm sm:text-base'
          />
        </div>

        <Button type='button' variant='default' className='h-11 rounded-xl px-5' onClick={onApply}>
          Search
        </Button>
      </div>

      <div className='mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
        <Field label='Skill Category'>
          <Select value={filters.skillCategory} onValueChange={value => onChange('skillCategory', value)}>
            <SelectTrigger className='h-10 w-full rounded-xl text-sm'>
              <SelectValue placeholder='All Categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              {allSpecializations.map(skill => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label='Availability'>
          <Select value={filters.availability} onValueChange={value => onChange('availability', value)}>
            <SelectTrigger className='h-10 w-full rounded-xl text-sm'>
              <SelectValue placeholder='All Availability' />
            </SelectTrigger>
            <SelectContent>
              {genericLabels.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label === 'All' ? 'All Availability' : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label='Certifications'>
          <Select
            value={filters.certifications}
            onValueChange={value => onChange('certifications', value)}
          >
            <SelectTrigger className='h-10 w-full rounded-xl text-sm'>
              <SelectValue placeholder='All Certifications' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Certifications</SelectItem>
              <SelectItem value='verified'>Verified Instructors</SelectItem>
              <SelectItem value='complete'>Profile Complete</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label='Location'>
          <Input
            value={filters.location}
            onChange={event => onChange('location', event.target.value)}
            placeholder='All Locations'
            className='h-10 rounded-xl text-sm'
          />
        </Field>

        <Field label='Rating'>
          <Select value={String(filters.minRating)} onValueChange={value => onChange('minRating', Number(value))}>
            <SelectTrigger className='h-10 w-full rounded-xl text-sm'>
              <SelectValue placeholder='Any Rating' />
            </SelectTrigger>
            <SelectContent>
              {ratingLabels.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label='Language'>
          <Select value={filters.language} onValueChange={value => onChange('language', value)}>
            <SelectTrigger className='h-10 w-full rounded-xl text-sm'>
              <SelectValue placeholder='All Languages' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Languages</SelectItem>
              <SelectItem value='english'>English</SelectItem>
              <SelectItem value='swahili'>Swahili</SelectItem>
              <SelectItem value='french'>French</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label='Experience Level'>
          <Select
            value={filters.experienceBand}
            onValueChange={value => onChange('experienceBand', value)}
          >
            <SelectTrigger className='h-10 w-full rounded-xl text-sm'>
              <SelectValue placeholder='All Levels' />
            </SelectTrigger>
            <SelectContent>
              {experienceLabels.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label='Price Range (KSh)'>
          <div className='space-y-2 rounded-xl border px-3 py-3'>
            <Slider
              value={filters.priceBand}
              onValueChange={value => onChange('priceBand', value)}
              min={0}
              max={5000}
              step={100}
            />
            <div className='text-muted-foreground flex items-center justify-between text-xs'>
              <span>{filters.priceBand[0] ?? 0}</span>
              <span>{filters.priceBand[1] ?? 5000}+</span>
            </div>
          </div>
        </Field>

        <Field label='Mode'>
          <div className='grid grid-cols-3 gap-2'>
            {[
              { label: 'Online', value: 'online' },
              { label: 'Physical', value: 'physical' },
              { label: 'Hybrid', value: 'hybrid' },
            ].map(option => (
              <button
                key={option.value}
                type='button'
                onClick={() => onChange('mode', filters.mode === option.value ? 'all' : option.value)}
                className={[
                  'rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
                  filters.mode === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground hover:bg-accent',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label='Gender'>
          <Select value={filters.gender} onValueChange={value => onChange('gender', value)}>
            <SelectTrigger className='h-10 w-full rounded-xl text-sm'>
              <SelectValue placeholder='All Gender' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Gender</SelectItem>
              <SelectItem value='male'>Male</SelectItem>
              <SelectItem value='female'>Female</SelectItem>
              <SelectItem value='other'>Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label='Instructor Type'>
          <Select
            value={filters.instructorType}
            onValueChange={value => onChange('instructorType', value)}
          >
            <SelectTrigger className='h-10 w-full rounded-xl text-sm'>
              <SelectValue placeholder='All Instructor Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Instructor Types</SelectItem>
              <SelectItem value='individual'>Individual</SelectItem>
              <SelectItem value='organization'>Organization</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label='Specialist'>
          <Select value={filters.specialist} onValueChange={value => onChange('specialist', value)}>
            <SelectTrigger className='h-10 w-full rounded-xl text-sm'>
              <SelectValue placeholder='All Specialities' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Specialities</SelectItem>
              {allSpecializations.slice(0, 10).map(skill => (
                <SelectItem key={`specialist-${skill}`} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Separator className='my-4' />

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
        <Button
          type='button'
          variant='ghost'
          className='h-9 rounded-xl px-3 text-sm'
          onClick={onReset}
        >
          Reset Filters
        </Button>
        <Button type='button' className='h-9 rounded-xl px-4 text-sm' onClick={onApply}>
          Apply Filters
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1.5'>
      <Label className='text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
        {label}
      </Label>
      {children}
    </div>
  );
}
