import 'server-only';

import { extractEntity, extractList, extractPage, type PageMetadataLike } from '@/lib/api-helpers';
import {
  type CommerceCatalogueItem,
  type Course,
  type CourseCreator,
  getCourseByUuid,
  getCourseCreatorByUuid,
  getCourseLessons,
  type Lesson,
  resolveByCourseOrClass,
  searchCatalogue,
} from '@/services/client';
import type {
  CatalogueCourseProjection,
  PublicCatalogueCourse,
  PublicCatalogueListResult,
  PublicCourseDetail,
  PublicCourseSummary,
} from '@/src/features/catalogue/types';
import { resolveGeneratedData } from '@/src/lib/api/client.server';

type CatalogueListOptions = {
  page?: number;
  size?: number;
};

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 50;

const toJsonSafeMetadata = (metadata: PageMetadataLike): PageMetadataLike =>
  Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      typeof value === 'bigint' ? Number(value) : value,
    ])
  );

const derivePrice = (course: PublicCourseSummary, catalogueItem: CommerceCatalogueItem | null) => {
  if (typeof course.price === 'number') {
    return course.price;
  }

  if (typeof catalogueItem?.unit_amount === 'number') {
    return catalogueItem.unit_amount;
  }

  return null;
};

const deriveCurrencyCode = (catalogueItem: CommerceCatalogueItem | null) =>
  catalogueItem?.currency_code ?? 'KES';

const deriveIsFree = (priceAmount: number | null) => priceAmount === 0;

const getCreatorName = (creator: CourseCreator | null) => creator?.full_name ?? undefined;

const selectPublicCatalogueItem = (items: CommerceCatalogueItem[]) =>
  items.find(item => item.publicly_visible !== false && item.active !== false) ?? null;

const fetchCourse = async (courseUuid: string) => {
  const response = await resolveGeneratedData(
    getCourseByUuid({
      path: { uuid: courseUuid },
    }),
    'Failed to load course'
  );

  return extractEntity<Course>(response);
};

const fetchCreator = async (creatorUuid: string) =>
  resolveGeneratedData(
    getCourseCreatorByUuid({
      path: { uuid: creatorUuid },
    }),
    'Failed to load course creator'
  );

const fetchCatalogueItem = async (courseUuid: string) => {
  const response = await resolveGeneratedData(
    resolveByCourseOrClass({
      query: { course_uuid: courseUuid },
    }),
    'Failed to load catalogue item'
  );

  return selectPublicCatalogueItem(extractList<CommerceCatalogueItem>(response));
};

/** The catalogue's projection, in the shape the cards read. */
const toCourseSummary = (projection: CatalogueCourseProjection): PublicCourseSummary => ({
  uuid: projection.uuid,
  name: projection.name,
  description: projection.description,
  thumbnail_url: projection.thumbnail_url,
  duration_hours: projection.duration_hours,
  duration_minutes: projection.duration_minutes,
  category_names: projection.category_names,
  price: projection.price,
  age_lower_limit: projection.age_lower_limit,
  age_upper_limit: projection.age_upper_limit,
  is_published: projection.published,
  accepts_new_enrollments: projection.accepts_new_enrollments,
  course_creator_uuid: projection.creator_uuid,
});

const enrichCourse = (
  course: PublicCourseSummary,
  creator: CourseCreator | null,
  catalogueItem: CommerceCatalogueItem | null,
  creatorName?: string
): PublicCatalogueCourse => {
  const priceAmount = derivePrice(course, catalogueItem);

  return {
    course,
    creator,
    creatorName: creatorName ?? getCreatorName(creator),
    catalogueItem,
    priceAmount,
    currencyCode: deriveCurrencyCode(catalogueItem),
    isFree: deriveIsFree(priceAmount),
  };
};

export const listPublicCatalogueCourses = async ({
  page = DEFAULT_PAGE,
  size = DEFAULT_PAGE_SIZE,
}: CatalogueListOptions = {}): Promise<PublicCatalogueListResult> => {
  const response = await resolveGeneratedData(
    searchCatalogue({
      query: {
        searchParams: {},
        pageable: { page, size },
      },
    }),
    'Failed to load catalogue'
  );

  const cataloguePage = extractPage<CommerceCatalogueItem>(response);
  const uniqueCourseMappings = new Map<string, CommerceCatalogueItem>();

  for (const item of cataloguePage.items) {
    if (
      !item.course_uuid ||
      item.publicly_visible === false ||
      item.active === false ||
      uniqueCourseMappings.has(item.course_uuid)
    ) {
      continue;
    }

    uniqueCourseMappings.set(item.course_uuid, item);
  }

  /*
   * The catalogue row carries the course.
   *
   * This used to fetch each course and each creator separately - one request per
   * row against `GET /courses/{uuid}`, which requires a token. Logged-out
   * visitors got a 401 per card, every card was dropped by the surrounding
   * catch, and the public catalogue rendered empty while the landing page's own
   * counters - which never made that call - still reported the courses.
   *
   * The listing is now one request. A row whose `course` is missing is skipped
   * rather than fetched: an entry pointing at a course that no longer exists is
   * not something to paper over with a second call.
   */
  const items = Array.from(uniqueCourseMappings.values()).flatMap(catalogueItem => {
    const projection = catalogueItem.course;

    if (!projection || projection.published === false) {
      return [];
    }

    return [
      enrichCourse(
        toCourseSummary(projection),
        null,
        catalogueItem,
        projection.creator_name ?? undefined
      ),
    ];
  });

  return {
    items,
    metadata: toJsonSafeMetadata(cataloguePage.metadata),
  };
};

export const getPublicCourseDetail = async (
  courseUuid: string
): Promise<PublicCourseDetail | null> => {
  try {
    const course = await fetchCourse(courseUuid);

    if (!course || course.is_published === false) {
      return null;
    }

    const [creatorResult, lessonsResult, catalogueItemResult] = await Promise.allSettled([
      course.course_creator_uuid ? fetchCreator(course.course_creator_uuid) : Promise.resolve(null),
      resolveGeneratedData(
        getCourseLessons({
          path: { courseUuid },
          query: { pageable: {} },
        }),
        'Failed to load course lessons'
      ),
      fetchCatalogueItem(courseUuid),
    ]);

    const creator = creatorResult.status === 'fulfilled' ? creatorResult.value : null;
    const lessonsResponse = lessonsResult.status === 'fulfilled' ? lessonsResult.value : null;
    const catalogueItem =
      catalogueItemResult.status === 'fulfilled' ? catalogueItemResult.value : null;

    if (!catalogueItem) {
      return null;
    }

    const lessons = lessonsResponse ? extractPage<Lesson>(lessonsResponse).items : [];
    const priceAmount = derivePrice(course, catalogueItem);

    return {
      course,
      creator,
      creatorName: getCreatorName(creator),
      catalogueItem,
      lessons,
      priceAmount,
      currencyCode: deriveCurrencyCode(catalogueItem),
      isFree: deriveIsFree(priceAmount),
    };
  } catch {
    return null;
  }
};
