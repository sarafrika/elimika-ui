'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock,
  LayoutList,
  Play,
  Sparkles,
  Star,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { EntityFact } from '@/components/data-display/entity-header-card';
import { EntityHeaderCard } from '@/components/data-display/entity-header-card';
import { surfaceTheme } from '@/components/data-display/page-shell';
import {
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  useSectionTab,
} from '@/components/data-display/section-tabs';
import { usePinnedNavHeight } from '@/components/data-display/use-pinned-nav-height';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPreviewSheet } from '@/components/ui/video-preview-sheet';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getAllDifficultyLevelsOptions } from '@/services/client/@tanstack/react-query.gen';
import {
  COURSE_TAB_LABELS,
  COURSE_TABS,
  type CoursePageModel,
  type CourseTab,
  openClassesSentence,
  priceFromLabel,
  splitRequirements,
} from '@/src/features/catalogue/course-page';
import { levelLabel } from '@/src/features/catalogue/catalogue-search';
import type { CourseOpenClasses } from '@/src/features/catalogue/open-classes';
import { useCourseOpenClasses } from '@/src/features/catalogue/use-course-open-classes';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { CourseClassesPanel } from './CourseClassesPanel';
import { OverviewPanel, RequirementsPanel, SyllabusPanel } from './CoursePanels';
import { CourseSimilarPanel } from './CourseSimilarPanel';
import { SeeClassesAction } from './course-actions';

const TAB_ICONS = {
  overview: LayoutList,
  requirements: ClipboardCheck,
  syllabus: BookOpen,
  classes: CalendarDays,
  similar: Sparkles,
} as const;

type OfferState = {
  offer: CourseOpenClasses | undefined;
  loading: boolean;
  error: boolean;
  retry: () => void;
};

/**
 * The public course page: breadcrumb, header card with the honest "From" price, and the
 * five sections in URL-backed tabs. Every panel is rendered (inactive ones hidden), so the
 * server HTML carries the whole record.
 */
export function PublicCoursePage({ model }: { model: CoursePageModel }) {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(COURSE_TABS, 'overview');
  const offerQuery = useCourseOpenClasses(model.uuid);
  const offerState: OfferState = {
    offer: offerQuery.data,
    loading: offerQuery.isPending,
    error: offerQuery.isError,
    retry: () => void offerQuery.refetch(),
  };
  const level = useCourseLevel(model.difficultyUuid, signedIn);
  const requirements = useMemo(() => splitRequirements(model.requirements), [model.requirements]);
  const tabsAnchor = useRef<HTMLDivElement>(null);
  const navHeight = usePinnedNavHeight();

  const chooseClass = () => {
    setTab('classes');
    const anchor = tabsAnchor.current;
    if (!anchor) return;
    const top = anchor.getBoundingClientRect().top + window.scrollY - navHeight - 8;
    if (window.scrollY > top || anchor.getBoundingClientRect().top > window.innerHeight * 0.6) {
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const counts: Partial<Record<CourseTab, number>> = {
    requirements: requirements.provided.length + requirements.bring.length,
    syllabus: model.lessons.length,
    classes: offerQuery.data?.open_class_count,
  };
  const tabs: SectionTab<CourseTab>[] = COURSE_TABS.map(id => ({
    id,
    label: COURSE_TAB_LABELS[id],
    icon: TAB_ICONS[id],
    count: counts[id],
  }));

  return (
    <>
      <main className={cn(surfaceTheme.pageWide, 'flex flex-col gap-[18px] pt-5 pb-32 md:pb-14')}>
        <nav aria-label='Breadcrumb' className='text-muted-foreground min-w-0 text-[13px]'>
          <ol className='flex min-w-0 items-center gap-2'>
            <li className='shrink-0'>
              <Link
                href='/courses'
                className='hover:text-foreground inline-flex items-center gap-1.5 transition-colors'
              >
                <ArrowLeft className='size-3.5' aria-hidden />
                Catalogue
              </Link>
            </li>
            <li aria-hidden className='shrink-0'>
              /
            </li>
            <li aria-current='page' className='text-foreground min-w-0 truncate'>
              {model.title}
            </li>
          </ol>
        </nav>

        <CourseHeader
          model={model}
          level={level}
          offerState={offerState}
          signedIn={signedIn}
          onChooseClass={chooseClass}
        />

        <div ref={tabsAnchor} aria-hidden />
        <SectionTabs
          tabs={tabs}
          value={tab}
          onValueChange={setTab}
          hrefFor={hrefFor}
          label='Course sections'
          variant='pill'
          sticky={{ top: navHeight }}
        >
          <SectionTabPanel value='overview'>
            <OverviewPanel model={model} provided={requirements.provided} />
          </SectionTabPanel>
          <SectionTabPanel value='requirements'>
            <RequirementsPanel provided={requirements.provided} bring={requirements.bring} />
          </SectionTabPanel>
          <SectionTabPanel value='syllabus'>
            <SyllabusPanel model={model} />
          </SectionTabPanel>
          <SectionTabPanel value='classes'>
            <CourseClassesPanel
              courseUuid={model.uuid}
              courseTitle={model.title}
              signedIn={signedIn}
              {...offerState}
            />
          </SectionTabPanel>
          <SectionTabPanel value='similar'>
            <CourseSimilarPanel courseUuid={model.uuid} signedIn={signedIn} />
          </SectionTabPanel>
        </SectionTabs>
      </main>

      <MobilePriceBar
        offerState={offerState}
        courseUuid={model.uuid}
        courseTitle={model.title}
        signedIn={signedIn}
        onChooseClass={chooseClass}
      />
    </>
  );
}

/** The level's name, when the viewer may read the levels (the list is not public yet). */
function useCourseLevel(difficultyUuid: string | undefined, signedIn: boolean) {
  const levels = useQuery({
    ...getAllDifficultyLevelsOptions(),
    enabled: signedIn && Boolean(difficultyUuid),
    staleTime: STALE_TIMES.reference,
    retry: false,
  });
  const name = levels.data?.data?.find(item => item.uuid === difficultyUuid)?.name;
  return name ? levelLabel(name) : undefined;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

function CourseHeader({
  model,
  level,
  offerState,
  signedIn,
  onChooseClass,
}: {
  model: CoursePageModel;
  level?: string;
  offerState: OfferState;
  signedIn: boolean;
  onChooseClass: () => void;
}) {
  const [introOpen, setIntroOpen] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnail = thumbnailFailed ? undefined : toAuthenticatedMediaUrl(model.thumbnailUrl);
  const openClassCount = offerState.offer?.open_class_count;

  const facts: EntityFact[] = [];
  if (model.lessons.length > 0) {
    facts.push({
      key: 'lessons',
      icon: BookOpen,
      value: model.lessons.length,
      label: model.lessons.length === 1 ? 'lesson' : 'lessons',
    });
  }
  if (model.durationHours) {
    facts.push({
      key: 'hours',
      icon: Clock,
      value: model.durationHours,
      label: model.durationHours === 1 ? 'hour' : 'hours',
    });
  } else if (model.durationLabel) {
    facts.push({ key: 'hours', icon: Clock, label: model.durationLabel });
  }
  if (typeof openClassCount === 'number' && openClassCount > 0) {
    facts.push({
      key: 'classes',
      icon: CalendarDays,
      value: openClassCount,
      label: openClassCount === 1 ? 'open class' : 'open classes',
    });
  }
  facts.push({ key: 'certificate', icon: Award, label: 'Certificate on completion' });

  const chips = [
    ...model.categories
      .slice(0, 2)
      .map(name => ({ key: `category-${name}`, label: name, star: false })),
    ...(level ? [{ key: 'level', label: level, star: true }] : []),
  ];

  return (
    <>
      <EntityHeaderCard
        title={model.title}
        eyebrow='Course'
        badges={chips.map(chip => (
          <span
            key={chip.key}
            className='bg-muted text-foreground inline-flex h-[22px] items-center gap-1 rounded-md px-2 text-xs font-medium'
          >
            {chip.star ? <Star className='text-warning size-3 fill-current' aria-hidden /> : null}
            {chip.label}
          </span>
        ))}
        description={
          model.summary ? <p className='line-clamp-4 sm:line-clamp-3'>{model.summary}</p> : null
        }
        context={
          model.creatorName ? (
            <div className='flex items-center gap-2.5'>
              <Avatar className='size-[30px]'>
                <AvatarFallback className='bg-primary/10 text-primary text-xs font-bold'>
                  {initialsOf(model.creatorName)}
                </AvatarFallback>
              </Avatar>
              <span>
                <b className='font-semibold'>{model.creatorName}</b>{' '}
                <span className='text-muted-foreground'>· Course creator</span>
              </span>
            </div>
          ) : null
        }
        facts={facts}
        media={
          <div className='from-primary/15 via-primary/5 to-muted relative flex h-[160px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br md:h-full md:min-h-[180px]'>
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=''
                onError={() => setThumbnailFailed(true)}
                className='absolute inset-0 size-full object-cover'
              />
            ) : (
              <BookOpen className='text-primary/60 size-10' aria-hidden />
            )}
            {model.introVideoUrl ? (
              <Button
                type='button'
                size='sm'
                onClick={() => setIntroOpen(true)}
                className='bg-foreground/85 text-background hover:bg-foreground absolute bottom-3 left-3 h-[34px] rounded-full px-3 shadow-none'
              >
                <Play className='size-3.5 fill-current' aria-hidden />
                Watch the free intro
              </Button>
            ) : null}
          </div>
        }
        aside={
          <PriceCard
            offerState={offerState}
            courseUuid={model.uuid}
            courseTitle={model.title}
            signedIn={signedIn}
            onChooseClass={onChooseClass}
          />
        }
        asideClassName='hidden md:block'
      />
      {model.introVideoUrl ? (
        <VideoPreviewSheet
          open={introOpen}
          onOpenChange={setIntroOpen}
          title={model.title}
          description='The free introduction to this course.'
          videoUrl={model.introVideoUrl}
        />
      ) : null}
    </>
  );
}

type PriceProps = {
  offerState: OfferState;
  courseUuid: string;
  courseTitle: string;
  signedIn: boolean;
  onChooseClass: () => void;
};

function PriceCard({ offerState, courseUuid, courseTitle, signedIn, onChooseClass }: PriceProps) {
  const { offer, loading, error, retry } = offerState;
  const label = offer ? priceFromLabel(offer) : null;
  const count = offer?.open_class_count ?? 0;

  return (
    <aside
      aria-label='Price'
      className='bg-muted/40 flex h-full flex-col gap-3 rounded-[14px] border p-[18px]'
    >
      {loading ? (
        <>
          <Skeleton className='h-3 w-12' />
          <Skeleton className='h-8 w-40' />
          <Skeleton className='h-10 w-full' />
          <div className='grow' />
          <Skeleton className='h-11 w-full rounded-[10px]' />
        </>
      ) : error ? (
        <>
          <span className={surfaceTheme.sectionLabel}>Classes</span>
          <p className='text-sm'>The open classes could not be loaded just now.</p>
          <div className='grow' />
          <Button variant='outline' className='h-11 rounded-[10px]' onClick={retry}>
            Try again
          </Button>
        </>
      ) : label ? (
        <>
          <span className={surfaceTheme.sectionLabel}>From</span>
          <div className='flex flex-wrap items-baseline gap-x-2'>
            <span className='font-mono text-[30px] leading-9 font-semibold tracking-tight'>
              {label}
            </span>
            <span className='text-muted-foreground text-[13px]'>per learner</span>
          </div>
          <p className='text-muted-foreground text-[13px] leading-[19px]'>
            {openClassesSentence(count)}
          </p>
          <div className='grow' />
          <Button className='h-11 rounded-[10px] text-[15px] font-semibold' onClick={onChooseClass}>
            Choose a class
            <ArrowRight className='size-4' aria-hidden />
          </Button>
          <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <Check className='text-success size-3.5 shrink-0' aria-hidden />
            Lessons open once your enrolment is confirmed.
          </span>
        </>
      ) : (
        <>
          <span className={surfaceTheme.sectionLabel}>Classes</span>
          <span className='text-xl font-semibold'>No open classes yet</span>
          <p className='text-muted-foreground text-[13px] leading-[19px]'>
            Training providers schedule classes for this course, each with its own fee, place and
            dates. None is taking enrolments right now.
          </p>
          <div className='grow' />
          <SeeClassesAction
            courseUuid={courseUuid}
            title={courseTitle}
            signedIn={signedIn}
            variant='outline'
            className='h-11 rounded-[10px]'
          />
        </>
      )}
    </aside>
  );
}

function MobilePriceBar({
  offerState,
  courseUuid,
  courseTitle,
  signedIn,
  onChooseClass,
}: PriceProps) {
  const { offer, loading } = offerState;
  const label = offer ? priceFromLabel(offer) : null;
  if (loading) return null;

  return (
    <div className='bg-card fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg md:hidden'>
      {label ? (
        <>
          <div className='flex min-w-0 grow flex-col'>
            <span className='text-muted-foreground text-xs'>From</span>
            <span className='truncate font-mono text-[19px] font-semibold'>{label}</span>
          </div>
          <Button
            className='h-[46px] shrink-0 rounded-[10px] px-[18px] text-[15px] font-semibold'
            onClick={onChooseClass}
          >
            Choose a class
          </Button>
        </>
      ) : (
        <>
          <span className='min-w-0 grow text-sm font-medium'>No open classes yet</span>
          <SeeClassesAction
            courseUuid={courseUuid}
            title={courseTitle}
            signedIn={signedIn}
            variant='outline'
            className='h-[46px] shrink-0 rounded-[10px]'
          />
        </>
      )}
    </div>
  );
}
