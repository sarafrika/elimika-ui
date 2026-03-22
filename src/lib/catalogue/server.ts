import 'server-only';

import { extractEntity, extractList, extractPage, type PageMetadataLike } from '@/lib/api-helpers';
import {
  getCourseByUuid,
  getCourseCreatorByUuid,
  getCourseLessons,
  resolveByCourseOrClass,
  searchCatalogue,
  type CommerceCatalogueItem,
  type Course,
  type CourseCreator,
  type Lesson,
} from '@/services/client';
import { resolveGeneratedData } from '@/src/lib/api/client.server';
import type {
  PublicCatalogueCourse,
  PublicCatalogueListResult,
  PublicCourseDetail,
} from '@/src/lib/catalogue/types';

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

const derivePrice = (course: Course, catalogueItem: CommerceCatalogueItem | null) => {
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

const enrichCourse = (
  course: Course,
  creator: CourseCreator | null,
  catalogueItem: CommerceCatalogueItem | null
): PublicCatalogueCourse => {
  const priceAmount = derivePrice(course, catalogueItem);

  return {
    course,
    creator,
    creatorName: getCreatorName(creator),
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

  const coursePairs = await Promise.all(
    Array.from(uniqueCourseMappings.entries()).map(async ([courseUuid, catalogueItem]) => {
      try {
        const course = await fetchCourse(courseUuid);
        return course ? { course, catalogueItem } : null;
      } catch {
        return null;
      }
    })
  );

  const validCoursePairs = coursePairs
    .filter((pair): pair is { course: Course; catalogueItem: CommerceCatalogueItem } =>
      Boolean(pair?.course?.uuid)
    )
    .filter(({ course }) => course.is_published !== false);

  const uniqueCreatorUuids = Array.from(
    new Set(
      validCoursePairs
        .map(({ course }) => course.course_creator_uuid)
        .filter((creatorUuid): creatorUuid is string => Boolean(creatorUuid))
    )
  );

  const creatorEntries = await Promise.all(
    uniqueCreatorUuids.map(async creatorUuid => {
      try {
        const creator = await fetchCreator(creatorUuid);
        return [creatorUuid, creator] as const;
      } catch {
        return [creatorUuid, null] as const;
      }
    })
  );

  const creators = new Map<string, CourseCreator | null>(creatorEntries);

  return {
    items: validCoursePairs.map(({ course, catalogueItem }) =>
      enrichCourse(course, creators.get(course.course_creator_uuid) ?? null, catalogueItem)
    ),
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
