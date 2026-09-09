import 'server-only';

import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  type CommerceCatalogueItem,
  getAllOrganisations,
  searchCatalogue,
} from '@/services/client';
import {
  formatCourseDuration,
  formatPricingLabel,
  getCourseDisplayTitle,
} from '@/src/features/catalogue/format';
import { listPublicCatalogueCourses } from '@/src/features/catalogue/server';
import type { PublicCatalogueCourse } from '@/src/features/catalogue/types';
import { resolveGeneratedData } from '@/src/lib/api/client.server';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

// Entries pulled for the grid. Each one costs a course fetch plus a creator
// fetch, so this stays well under the full catalogue page.
const CATALOGUE_SAMPLE_SIZE = 24;

/** Cards rendered per category view. */
export const HOME_GRID_SIZE = 6;

/** Chips offered beside "All". */
const MAX_CATEGORY_CHIPS = 4;

// Ceiling on the page read to count distinct courses. Past it the figure is
// reported as a floor ("N+") rather than an exact total.
const CATALOGUE_COUNT_SIZE = 200;

// One figure in the hero's proof strip. Every figure is a live total from an
// endpoint that answers anonymously; one that fails or reads zero is dropped
// rather than guessed at.
export type PlatformStat = {
  key: string;
  value: number;
  /** True when the real total is known only to be at least `value`. */
  atLeast: boolean;
  label: string;
};

/** Everything one course card on the landing page needs, already formatted. */
export type HomeCourseCard = {
  uuid: string;
  href: string;
  title: string;
  primaryCategory: string | null;
  categories: string[];
  tags: string[];
  durationLabel: string | null;
  creatorName: string | null;
  priceLabel: string;
  thumbnailUrl: string | null;
};

export type HomeCatalogue = {
  courses: HomeCourseCard[];
  categories: string[];
  hasError: boolean;
};

const isOnSale = (item: CommerceCatalogueItem) =>
  item.publicly_visible !== false && item.active !== false;

// Distinct courses on sale. No public endpoint totals published courses, and
// the catalogue's own total counts price entries - one course can have several,
// one per class on offer - so they are counted here by `course_uuid`.
const countCatalogueCourses = async () => {
  const response = await resolveGeneratedData(
    searchCatalogue({
      query: { searchParams: {}, pageable: { page: 0, size: CATALOGUE_COUNT_SIZE } },
    }),
    'Failed to count catalogue courses'
  );

  const { items, metadata } = extractPage<CommerceCatalogueItem>(response);

  const courseUuids = new Set(
    items.filter(isOnSale).flatMap(item => (item.course_uuid ? [item.course_uuid] : []))
  );

  return {
    value: courseUuids.size,
    atLeast: getTotalFromMetadata(metadata) > items.length,
  };
};

/** Organisations registered on Elimika. `GET /organisations` is public. */
const countOrganisations = async () => {
  const response = await resolveGeneratedData(
    getAllOrganisations({ query: { pageable: { page: 0, size: 1 } } }),
    'Failed to count organisations'
  );

  return { value: getTotalFromMetadata(extractPage(response).metadata), atLeast: false };
};

type CountResult = { value: number; atLeast: boolean };

const toStat = (
  key: string,
  result: PromiseSettledResult<CountResult>,
  singular: string,
  plural: string
): PlatformStat | null => {
  if (result.status !== 'fulfilled') {
    return null;
  }

  const { value, atLeast } = result.value;

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return { key, value, atLeast, label: value === 1 ? singular : plural };
};

// The design asked for three figures; only two have a public source, since
// every instructor and course-creator count needs a bearer token. The two are
// settled independently, so one failing service costs only its own figure.
export const getPlatformStats = async (): Promise<PlatformStat[]> => {
  const [courses, organisations] = await Promise.allSettled([
    countCatalogueCourses(),
    countOrganisations(),
  ]);

  return [
    toStat('courses', courses, 'course in the catalogue', 'courses in the catalogue'),
    toStat('organisations', organisations, 'training organisation', 'training organisations'),
  ].filter((stat): stat is PlatformStat => stat !== null);
};

const toAgeRange = ({
  age_lower_limit: lower,
  age_upper_limit: upper,
}: PublicCatalogueCourse['course']) => {
  if (typeof lower === 'number' && typeof upper === 'number') {
    return `Ages ${lower}-${upper}`;
  }

  if (typeof lower === 'number') {
    return `Ages ${lower}+`;
  }

  return undefined;
};

const toCourseCard = (item: PublicCatalogueCourse): HomeCourseCard | null => {
  const { course, creatorName } = item;
  const uuid = course.uuid;

  if (!uuid) {
    return null;
  }

  const categories = (course.category_names ?? []).filter(Boolean);

  // The design's meta line carries two short facts. Level and delivery mode are
  // not on a course record, so the two that are real take the slot.
  const tags = [
    creatorName,
    toAgeRange(course),
    course.accepts_new_enrollments === false ? undefined : 'Enrolling now',
  ];

  return {
    uuid,
    href: `/courses/${encodeURIComponent(uuid)}`,
    title: getCourseDisplayTitle(course),
    primaryCategory: categories[0] ?? null,
    categories,
    tags: tags.filter((tag): tag is string => Boolean(tag)).slice(0, 2),
    durationLabel: formatCourseDuration(course),
    creatorName: creatorName ?? null,
    priceLabel: formatPricingLabel(item),
    thumbnailUrl: toAuthenticatedMediaUrl(course.thumbnail_url) ?? null,
  };
};

// Categories that actually have courses, most populated first. The design's
// chip row guessed at the taxonomy; this is the live answer, and it can never
// offer a chip that filters down to nothing.
const deriveCategories = (courses: HomeCourseCard[]) => {
  const counts = new Map<string, number>();

  for (const course of courses) {
    for (const category of course.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort(([leftName, leftCount], [rightName, rightCount]) =>
      rightCount === leftCount ? leftName.localeCompare(rightName) : rightCount - leftCount
    )
    .slice(0, MAX_CATEGORY_CHIPS)
    .map(([name]) => name);
};

/** The live course grid behind the hero, plus the chips that filter it. */
export const getHomeCatalogue = async (): Promise<HomeCatalogue> => {
  if (process.env.HOME_FIXTURES) {
    const mk = (
      i: number,
      cat: string,
      title: string,
      price: string,
      dur: string,
      who: string
    ): HomeCourseCard => ({
      uuid: 'u' + i,
      href: '/courses/u' + i,
      title,
      primaryCategory: cat,
      categories: [cat],
      tags: i % 2 ? ['Ages 8-14', 'Enrolling now'] : ['Enrolling now'],
      durationLabel: dur,
      creatorName: who,
      priceLabel: price,
      thumbnailUrl: null,
    });
    const courses = [
      mk(
        1,
        'Music',
        'Piano Foundations for Beginners',
        'KES 6,500',
        '12 weeks / 24 sessions',
        'Grace Wanjiru'
      ),
      mk(
        2,
        'Coding',
        'Python for Secondary Schools and a rather long course title that wraps',
        'KES 9,000',
        '10 weeks / 20 sessions',
        'Nairobi Code Lab'
      ),
      mk(
        3,
        'Sports',
        'Athletics Coaching Level 1',
        'KES 4,800',
        '6 weeks / 18 sessions',
        'Coach Otieno'
      ),
      mk(4, 'Arts & Design', 'Digital Illustration Studio', 'Free', '10 weeks', 'Studio Kesho'),
      mk(
        5,
        'Music',
        'Choir and Vocal Technique',
        'KES 5,200',
        '8 weeks / 16 sessions',
        'Amani Music School'
      ),
      mk(
        6,
        'Coding',
        'Robotics Club Starter Kit',
        'KES 11,400',
        '6 weeks / 12 sessions',
        'Makers Collective'
      ),
      mk(
        7,
        'Sports',
        'Swimming Safety and Stroke Basics',
        'KES 3,600',
        '4 weeks / 8 sessions',
        'Riverside Aquatics'
      ),
      mk(
        8,
        'Arts & Design',
        'Stage Design and Set Building',
        'KES 6,000',
        '5 weeks / 10 sessions',
        'Kenya Theatre Works'
      ),
    ];
    return { courses, categories: deriveCategories(courses), hasError: false };
  }

  try {
    const { items } = await listPublicCatalogueCourses({ size: CATALOGUE_SAMPLE_SIZE });

    const courses = items
      .map(toCourseCard)
      .filter((course): course is HomeCourseCard => course !== null);

    return { courses, categories: deriveCategories(courses), hasError: false };
  } catch {
    return { courses: [], categories: [], hasError: true };
  }
};
