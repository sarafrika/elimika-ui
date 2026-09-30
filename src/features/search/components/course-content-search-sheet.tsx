'use client';

import { BookOpen, ClipboardCheck, FileQuestion, FileText, Search } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { FacetChips } from '@/components/search/facet-chips';
import { Highlight } from '@/components/search/highlight';
import { SearchQueryInput } from '@/components/search/search-input';
import { SearchUnavailable } from '@/components/search/search-unavailable';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchQuery } from '@/hooks/use-search-query';
import { isForbidden } from '@/lib/api-errors';
import {
  COURSE_CONTENT_TYPES,
  type CourseContentHit,
  type CourseContentType,
  useCourseContentSearch,
} from '../hooks/use-course-content-search';

const TYPE_META: Record<CourseContentType, { label: string; icon: typeof BookOpen }> = {
  lesson: { label: 'Lessons', icon: BookOpen },
  content: { label: 'Content', icon: FileText },
  quiz: { label: 'Quizzes', icon: FileQuestion },
  assignment: { label: 'Assignments', icon: ClipboardCheck },
};

const isContentType = (value: unknown): value is CourseContentType =>
  typeof value === 'string' && (COURSE_CONTENT_TYPES as readonly string[]).includes(value);

/**
 * "Search this course": a right-side Sheet over the per-course content index. Hits are
 * lessons, content items, quizzes and assignments; choosing one hands it to `onSelect`,
 * which opens it in the course view.
 */
export function CourseContentSearchSheet({
  courseUuid,
  onSelect,
  trigger,
}: {
  courseUuid: string | null | undefined;
  onSelect: (hit: CourseContentHit) => void;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const search = useSearchQuery();
  const [types, setTypes] = useState<CourseContentType[]>([]);
  const results = useCourseContentSearch({
    courseUuid,
    q: search.q,
    types,
    enabled: open,
  });

  const choose = (hit: CourseContentHit) => {
    onSelect(hit);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild disabled={!courseUuid}>
        {trigger ?? (
          <Button variant='outline' size='sm' className='gap-2'>
            <Search className='size-4' />
            Search this course
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side='right' className='flex w-full flex-col gap-0 p-0 sm:max-w-lg'>
        <SheetHeader className='border-b px-5 py-4'>
          <SheetTitle>Search this course</SheetTitle>
          <SheetDescription>Find a lesson, reading, quiz or assignment by what it says.</SheetDescription>
        </SheetHeader>
        <div className='space-y-3 border-b px-5 py-4'>
          <SearchQueryInput search={search} placeholder='Search lessons and content…' autoFocus />
          <FacetChips
            label='Show'
            options={COURSE_CONTENT_TYPES.map(type => ({ value: type, label: TYPE_META[type].label }))}
            selected={types}
            onChange={next => setTypes(next.filter(isContentType))}
          />
        </div>
        <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4' aria-live='polite'>
          <Results
            search={search}
            results={results}
            onSelect={choose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Results({
  search,
  results,
  onSelect,
}: {
  search: ReturnType<typeof useSearchQuery>;
  results: ReturnType<typeof useCourseContentSearch>;
  onSelect: (hit: CourseContentHit) => void;
}) {
  if (search.searchUnavailable || results.searchUnavailable) {
    return (
      <SearchUnavailable
        onClear={search.clear}
        onRetry={search.retrySearch}
        description='Searching inside this course is not available right now. Browse the lessons instead, or try again in a moment.'
      />
    );
  }
  if (!results.term) {
    return (
      <p className='text-muted-foreground text-sm'>
        {search.tooShort ? 'Type at least 2 characters.' : 'Type a word or phrase to search.'}
      </p>
    );
  }
  if (results.isLoading) {
    return (
      <div className='space-y-2' aria-busy>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className='h-14 w-full rounded-md' />
        ))}
      </div>
    );
  }
  if (results.isError) {
    return (
      <EmptyState
        variant='compact'
        icon={Search}
        title={isForbidden(results.error) ? 'You cannot search this course' : 'This search could not be run'}
        description={
          isForbidden(results.error)
            ? 'Only people enrolled in, or teaching, this course can search inside it.'
            : 'Clear the search and try different words.'
        }
        action={
          <Button variant='outline' size='sm' onClick={search.clear}>
            Clear search
          </Button>
        }
      />
    );
  }
  if (results.hits.length === 0) {
    return (
      <EmptyState
        variant='compact'
        icon={Search}
        title='Nothing in this course matches'
        description='Try another word, or show every kind of item.'
      />
    );
  }

  return (
    <div className='space-y-2'>
      <p className='text-muted-foreground text-xs'>
        {results.total} result{results.total === 1 ? '' : 's'}
      </p>
      <ul className='space-y-2'>
        {results.hits.map(hit => {
          const meta = isContentType(hit.type) ? TYPE_META[hit.type] : TYPE_META.content;
          const Icon = meta.icon;
          return (
            <li key={`${hit.type}:${hit.uuid}`}>
              <button
                type='button'
                onClick={() => onSelect(hit)}
                className='hover:bg-muted/60 focus-visible:ring-ring/50 border-border/70 flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none'
              >
                <Icon aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
                <span className='min-w-0 flex-1'>
                  <span className='text-foreground block truncate text-sm font-medium'>
                    {hit.title || 'Untitled'}
                  </span>
                  {hit.lesson_title && hit.type !== 'lesson' ? (
                    <span className='text-muted-foreground block truncate text-xs'>
                      Lesson {hit.lesson_number ?? ''} · {hit.lesson_title}
                    </span>
                  ) : null}
                  {hit.highlight ? (
                    <Highlight
                      value={hit.highlight}
                      className='text-muted-foreground mt-1 line-clamp-2 block text-xs'
                    />
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
