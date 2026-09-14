'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import { stripHtml } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { ArrowRight, Building2, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { useCreatorOrganisations } from './useCreatorOrganisations';

export default function ApprovedOrganisations() {
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search).trim().toLowerCase();
  const { groups, courseIds, courseMap, applicationsQuery, hasError, hasProfile, isLoading } =
    useCreatorOrganisations();
  const organisationIds = useMemo(() => groups.map(group => group.uuid), [groups]);
  const { organisationMap, isLoading: profilesLoading } = useOrganisationsByIds(organisationIds);
  const loading = isLoading || profilesLoading;
  const organisations = useMemo(
    () =>
      groups
        .map(group => ({
          ...group,
          profile: organisationMap[group.uuid],
          name: organisationMap[group.uuid]?.name || 'Organisation details unavailable',
          courses: group.courseIds.map(uuid => ({
            uuid,
            name: courseMap[uuid]?.name || 'Course title unavailable',
          })),
        }))
        .filter(organisation =>
          [
            organisation.name,
            stripHtml(organisation.profile?.description),
            organisation.profile?.location,
            organisation.profile?.country,
            ...organisation.courses.map(course => course.name),
          ].some(value => value?.toLowerCase().includes(term))
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [groups, organisationMap, courseMap, term]
  );

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2'>
        {[
          { label: 'Approved organisations', value: groups.length },
          { label: 'Courses with approved organisations', value: courseIds.length },
        ].map(metric => (
          <Card key={metric.label} className='border-l-primary border-l-4'>
            <CardContent>
              {loading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <p className='text-2xl font-bold'>{hasError ? '—' : metric.value}</p>
              )}
              <p className='text-muted-foreground text-xs'>
                {metric.label}
                {applicationsQuery.hasNextPage ? ' (loaded so far)' : ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='relative max-w-md'>
        <Search className='text-muted-foreground absolute top-3 left-3 size-4' />
        <Input
          aria-label='Search organisations or courses'
          placeholder='Search organisations or courses...'
          value={search}
          onChange={event => setSearch(event.target.value)}
          className='pl-9'
        />
      </div>
      {loading ? (
        <div className='space-y-3'>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className='h-36 w-full' />
          ))}
        </div>
      ) : !hasProfile ? (
        <EmptyState
          icon={Building2}
          title='Course creator profile unavailable'
          description='A course creator profile is needed to view approved organisations.'
        />
      ) : hasError && groups.length === 0 ? (
        <EmptyState
          icon={Building2}
          title='Could not load organisations'
          description='Please try again.'
          action={
            <Button variant='outline' onClick={() => applicationsQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : organisations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            groups.length ? 'No organisations match your search' : 'No approved organisations yet'
          }
          description={
            groups.length
              ? 'Try another organisation or course name, or load more results.'
              : 'Organisations appear here once their application to train one of your courses is approved.'
          }
        />
      ) : (
        <div className='space-y-4'>
          {organisations.map(organisation => (
            <Link
              key={organisation.uuid}
              href={`/dashboard/course-creator/organisations/${encodeURIComponent(
                organisation.uuid
              )}`}
              className='group focus-visible:ring-ring block rounded-xl outline-none focus-visible:ring-2'
            >
              <Card className='group-hover:border-primary/50 transition-colors'>
                <CardContent className='flex items-start gap-4 px-4 py-2'>
                  <Avatar className='size-12 shrink-0'>
                    <AvatarFallback className='bg-primary/10 text-primary'>
                      <Building2 className='size-5' />
                    </AvatarFallback>
                  </Avatar>

                  <div className='min-w-0 flex-1 space-y-3'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h2 className='max-w-full font-semibold break-words'>
                        {organisation.name}
                      </h2>

                      <Badge>Approved</Badge>
                      <Badge variant='outline'>Organisation</Badge>
                    </div>

                    {/* <p className='text-muted-foreground line-clamp-2 text-sm'>
          {stripHtml(organisation.profile?.description) ||
            'No description provided.'}
        </p> */}

                    <p className='text-muted-foreground flex items-center gap-2 text-xs'>
                      <MapPin className='size-3.5 shrink-0' />
                      {[organisation.profile?.location, organisation.profile?.country]
                        .filter(Boolean)
                        .join(', ') || 'Location not listed'}
                    </p>

                    <div className='flex flex-wrap gap-2'>
                      {organisation.courses.map(course => (
                        <Badge
                          key={course.uuid}
                          variant='secondary'
                          className='max-w-full text-left break-words whitespace-normal'
                        >
                          {course.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* View action */}
                  <div className='ml-auto shrink-0 self-start'>
                    <div className='text-primary flex items-center gap-1.5 text-sm font-medium transition-opacity group-hover:opacity-80'>
                      <span className='hidden sm:inline'>
                        View organisation & instructors
                      </span>
                      <ArrowRight className='size-4' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {hasError && groups.length > 0 && (
        <EmptyState
          title='Could not refresh all organisations'
          description='The results already loaded are shown above.'
          action={
            <Button variant='outline' onClick={() => applicationsQuery.refetch()}>
              Retry
            </Button>
          }
        />
      )}
      {applicationsQuery.hasNextPage && (
        <div className='flex justify-center'>
          <Button
            variant='outline'
            disabled={applicationsQuery.isFetching}
            onClick={() => applicationsQuery.fetchNextPage()}
          >
            {applicationsQuery.isFetchingNextPage && <Spinner />}Load more
          </Button>
        </div>
      )}
    </div>
  );
}
