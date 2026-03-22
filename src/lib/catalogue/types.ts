import type { PageMetadataLike } from '@/lib/api-helpers';
import type { CommerceCatalogueItem, Course, CourseCreator, Lesson } from '@/services/client';

export type PublicCatalogueCourse = {
  course: Course;
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
