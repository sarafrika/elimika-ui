import type { PageMetadataLike } from '@/lib/api-helpers';
import type {
  CommerceCatalogueItem,
  Course,
  CourseCatalogueSnapshot,
  CourseCreator,
  Lesson,
} from '@/services/client';

/**
 * What a public course card needs, and no more.
 *
 * The listing used to be typed against `Course`, which is the privileged record:
 * it *requires* `creator_share_percentage` and `instructor_share_percentage`.
 * Typing a page served to anonymous browsers against a shape that mandates the
 * revenue split was the wrong model, and it is why the catalogue could only be
 * built by fetching each course from an authenticated endpoint.
 *
 * Both a full `Course` and the catalogue's public `CourseCatalogueSnapshot`
 * satisfy this structurally, so the cards render from whichever the caller has.
 */
export type PublicCourseSummary = {
  uuid?: string;
  name?: string;
  description?: string;
  thumbnail_url?: string | null;
  duration_hours?: number;
  duration_minutes?: number;
  total_duration_display?: string;
  category_names?: Array<string>;
  price?: number | null;
  age_lower_limit?: number | null;
  age_upper_limit?: number | null;
  status?: Course['status'];
  is_published?: boolean;
  accepts_new_enrollments?: boolean;
  course_creator_uuid?: string;
};

/** The catalogue's own projection is one of the shapes a card can render from. */
export type CatalogueCourseProjection = CourseCatalogueSnapshot;

export type PublicCatalogueCourse = {
  course: PublicCourseSummary;
  creator: CourseCreator | null;
  creatorName?: string;
  catalogueItem: CommerceCatalogueItem | null;
  priceAmount: number | null;
  currencyCode: string | null;
  isFree: boolean;
};

export type PublicCatalogueListResult = {
  items: PublicCatalogueCourse[];
  metadata: PageMetadataLike;
};

export type PublicCourseDetail = {
  course: Course;
  creator: CourseCreator | null;
  creatorName?: string;
  catalogueItem: CommerceCatalogueItem | null;
  lessons: Lesson[];
  priceAmount: number | null;
  currencyCode: string | null;
  isFree: boolean;
};
