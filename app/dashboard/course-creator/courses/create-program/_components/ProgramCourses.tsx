'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { searchCoursesInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Course } from '@/services/client/types.gen';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, BookOpen, Check, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { ProgramFormValues } from '../program-schema';

const EMPTY_COURSES: Course[] = [];

export default function ProgramCourses({ creatorUuid }: { creatorUuid: string }) {
  const form = useFormContext<ProgramFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'courses',
  });
  const categoryUuids = useWatch({ control: form.control, name: 'categoryUuids' });
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const coursesQuery = useInfiniteQuery({
    ...searchCoursesInfiniteOptions({
      query: {
        searchParams: { is_published: true },
        pageable: { size: 24 },
      },
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.error || lastPage.success === false) return undefined;
      const metadata = lastPage.data?.metadata;
      return (metadata?.hasNext ?? pages.length < (metadata?.totalPages ?? 1))
        ? pages.length
        : undefined;
    },
    enabled: Boolean(creatorUuid),
    staleTime: STALE_TIMES.reference,
  });
  const hasError =
    coursesQuery.isError ||
    coursesQuery.data?.pages.some(
      response => Boolean(response.error) || response.success === false
    );
  const loadedCourses = useMemo(() => {
    const courses = new Map<string, Course>();
    for (const response of coursesQuery.data?.pages ?? []) {
      if (response.error || response.success === false) continue;
      for (const course of response.data?.content ?? EMPTY_COURSES) {
        if (course.uuid) courses.set(course.uuid, course);
      }
    }
    return [...courses.values()];
  }, [coursesQuery.data]);
  const availableCourses = useMemo(
    () =>
      loadedCourses.filter(
        course =>
          course.category_uuids?.some(uuid => categoryUuids.includes(uuid)) &&
          course.name.toLowerCase().includes(deferredSearch)
      ),
    [loadedCourses, categoryUuids, deferredSearch]
  );
  const selectedIds = useMemo(() => new Set(fields.map(row => row.courseUuid)), [fields]);
  const missingIds = useMemo(
    () =>
      fields
        .filter(row => !loadedCourses.some(course => course.uuid === row.courseUuid))
        .map(row => row.courseUuid),
    [loadedCourses, fields]
  );
  const selectedLookup = useCoursesByIds(missingIds);
  const courseMap = useMemo(() => {
    const map = new Map<string, Course>(Object.entries(selectedLookup.courseMap));
    for (const course of loadedCourses) if (course.uuid) map.set(course.uuid, course);
    return map;
  }, [loadedCourses, selectedLookup.courseMap]);

  const removeCourse = (index: number) => {
    const removedUuid = fields[index].courseUuid;
    remove(index);
    form.getValues('courses').forEach((row, rowIndex) => {
      if (row.prerequisiteCourseUuid === removedUuid)
        form.setValue(`courses.${rowIndex}.prerequisiteCourseUuid`, '', {
          shouldDirty: true,
          shouldValidate: true,
        });
    });
  };
  const toggleCourse = (course: Course) => {
    if (!course.uuid) return;
    const index = fields.findIndex(row => row.courseUuid === course.uuid);
    if (index >= 0) removeCourse(index);
    else append({ courseUuid: course.uuid, isRequired: true, prerequisiteCourseUuid: '' });
  };

  return (
    <div className='space-y-5'>
      <div className='flex items-end justify-between gap-3'>
        <div>
          <h3 className='text-sm font-medium'>Courses in this program</h3>
          <p className='text-muted-foreground mt-1 text-xs'>
            Showing published courses in any selected category. Tap a course tile to add or remove
            it. Selected courses appear in the curriculum table.
          </p>
        </div>
        <Badge variant='secondary' className='shrink-0'>
          {fields.length} selected
        </Badge>
      </div>
      <div className='relative max-w-sm'>
        <Search className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
        <Input
          value={search}
          onChange={event => setSearch(event.target.value)}
          className='pl-9'
          placeholder='Search published courses'
          aria-label='Search published courses'
        />
      </div>
      {hasError ? (
        <EmptyState
          variant='compact'
          title='Unable to load courses'
          description='Try again to browse the course catalogue.'
          action={
            <Button type='button' variant='outline' onClick={() => coursesQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : coursesQuery.isLoading ? (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className='h-40' />
          ))}
        </div>
      ) : !categoryUuids.length ? (
        <EmptyState
          variant='compact'
          title='Select program categories'
          description='Choose categories in Program set-up to see matching courses.'
        />
      ) : !availableCourses.length ? (
        <EmptyState
          variant='compact'
          title={
            coursesQuery.hasNextPage ? 'No matching courses loaded yet' : 'No matching courses'
          }
          description={
            coursesQuery.hasNextPage
              ? 'Load more courses below to find matches in the selected categories.'
              : 'Try another course title or change the categories in Program set-up.'
          }
          action={
            !search &&
            !coursesQuery.hasNextPage && (
              <Button asChild type='button' variant='outline'>
                <Link href='/dashboard/course-creator/courses/create-course'>
                  Open course builder
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {availableCourses
            .filter(course => course.uuid)
            .map((course, index) => (
              <CourseTile
                key={course.uuid}
                course={course}
                index={index}
                selected={selectedIds.has(course.uuid!)}
                onToggle={() => toggleCourse(course)}
              />
            ))}
        </div>
      )}
      {coursesQuery.hasNextPage && !hasError && (
        <div className='flex flex-wrap items-center justify-end gap-3'>
          <span className='text-muted-foreground text-xs'>
            {availableCourses.length} matching of {loadedCourses.length} loaded courses
          </span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={coursesQuery.isFetching}
            onClick={() => void coursesQuery.fetchNextPage()}
          >
            {coursesQuery.isFetchingNextPage && <Spinner />}
            Load more courses
          </Button>
        </div>
      )}
      <FormField
        control={form.control}
        name='courses'
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
      {selectedLookup.isError && (
        <EmptyState
          variant='compact'
          title='Some selected courses could not be loaded'
          action={
            <Button type='button' variant='outline' onClick={() => selectedLookup.refetch()}>
              Try again
            </Button>
          }
        />
      )}
      {fields.length > 0 && (
        <section className='space-y-2' aria-label='Program curriculum'>
          <h3 className='text-sm font-medium'>Curriculum</h3>
          <div className='border-border overflow-x-auto border'>
            <table className='w-full min-w-[720px] text-sm'>
              <thead className='bg-muted/60'>
                <tr>
                  {['Order', 'Course name', 'Required', 'Prerequisite', 'Actions'].map(label => (
                    <th
                      key={label}
                      scope='col'
                      className='border-border border-b px-3 py-2 text-left font-semibold'
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((row, index) => (
                  <tr key={row.id} className='align-top'>
                    <td className='border-border bg-muted/30 border-b px-3 py-3'>
                      Course {index + 1}
                    </td>
                    <td className='border-border border-b px-3 py-3'>
                      {courseMap.get(row.courseUuid)?.name ??
                        (selectedLookup.isLoading ? 'Loading course…' : `Course ${row.courseUuid}`)}
                    </td>
                    <td className='border-border border-b px-3 py-3'>
                      <FormField
                        control={form.control}
                        name={`courses.${index}.isRequired`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='sr-only'>
                              Course {index + 1} is required
                            </FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={checked => field.onChange(checked === true)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className='border-border min-w-48 border-b px-3 py-2'>
                      <FormField
                        control={form.control}
                        name={`courses.${index}.prerequisiteCourseUuid`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='sr-only'>
                              Prerequisite for course {index + 1}
                            </FormLabel>
                            <Select
                              value={field.value || 'none'}
                              onValueChange={value => field.onChange(value === 'none' ? '' : value)}
                            >
                              <FormControl>
                                <SelectTrigger className='w-full'>
                                  <SelectValue placeholder='No prerequisite' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='none'>No prerequisite</SelectItem>
                                {fields.slice(0, index).map(prerequisite => (
                                  <SelectItem
                                    key={prerequisite.courseUuid}
                                    value={prerequisite.courseUuid}
                                  >
                                    {courseMap.get(prerequisite.courseUuid)?.name ??
                                      prerequisite.courseUuid}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className='border-border border-b px-3 py-2'>
                      <div className='flex gap-1'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          disabled={index === 0}
                          aria-label={`Move course ${index + 1} up`}
                          onClick={() => {
                            move(index, index - 1);
                            void form.trigger('courses');
                          }}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          disabled={index === fields.length - 1}
                          aria-label={`Move course ${index + 1} down`}
                          onClick={() => {
                            move(index, index + 1);
                            void form.trigger('courses');
                          }}
                        >
                          <ArrowDown />
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          aria-label={`Remove course ${index + 1}`}
                          onClick={() => removeCourse(index)}
                        >
                          <X />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function CourseTile({
  course,
  index,
  selected,
  onToggle,
}: {
  course: Course;
  index: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const accent = `var(--chart-${(index % 5) + 1})`;
  return (
    <Button
      type='button'
      variant='outline'
      aria-pressed={selected}
      onClick={onToggle}
      className={`bg-background relative h-auto flex-col items-stretch justify-start gap-2 overflow-hidden rounded-sm p-0 text-left whitespace-normal ${selected ? 'border-transparent' : 'border-border hover:bg-muted/40'}`}
      style={selected ? { boxShadow: `0 0 0 2px ${accent}` } : undefined}
    >
      <span
        aria-hidden
        className='absolute inset-x-0 top-0 h-1.5'
        style={{ backgroundColor: accent }}
      />
      <span className='flex items-start gap-3 p-4 pt-5'>
        <span
          aria-hidden
          className='flex h-9 w-9 shrink-0 items-center justify-center'
          style={{
            backgroundColor: `color-mix(in oklch, ${accent} 15%, transparent)`,
            color: accent,
          }}
        >
          <BookOpen />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='text-foreground block truncate text-sm font-semibold'>
            {course.name}
          </span>
          {course.description && (
            <p className='text-muted-foreground mt-1 line-clamp-3 overflow-hidden text-xs leading-relaxed'>
              {course.description.replace(/<[^>]*>/g, '')}
            </p>
          )}
        </span>
        <span
          aria-hidden
          className={`flex h-5 w-5 shrink-0 items-center justify-center border ${selected ? 'text-primary-foreground border-transparent' : 'border-border text-transparent'}`}
          style={selected ? { backgroundColor: accent } : undefined}
        >
          <Check className='size-3.5' />
        </span>
      </span>
      <span className='border-border bg-muted/30 text-muted-foreground mt-auto flex items-center gap-2 border-t px-4 py-2 text-xs'>
        <span
          className='truncate px-1.5 py-0.5 font-semibold'
          style={{
            backgroundColor: `color-mix(in oklch, ${accent} 12%, transparent)`,
            color: accent,
          }}
        >
          {course.category_names?.join(', ') || 'Uncategorised'}
        </span>
        <span className='ml-auto shrink-0'>
          {course.duration_hours}h {course.duration_minutes}m
        </span>
      </span>
    </Button>
  );
}
