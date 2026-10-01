/**
 * Course-record blocks.
 *
 * Every block in here takes props and renders — none of them fetch. Data comes
 * from `useCourseRecord` at the route and is passed down, which is what keeps a
 * block reusable across the record, the prospectus and the reader.
 *
 * Add a block by exporting it from this barrel and nothing else.
 *
 * Alphabetical by module. The two underscore-prefixed modules are not blocks:
 * they hold the small vocabulary the blocks' props are typed in — the class row,
 * the reader item, the money and date formatters — and so are exported first.
 */

export {
  COURSE_DEFAULT_CURRENCY,
  type CourseClassFormatTone,
  type CourseClassRow,
  formatCourseDate,
  formatCourseMoney,
} from './_shared';
export { AccessCard } from './AccessCard';
export { ActionsCard, type CourseRailActionItem } from './ActionsCard';
export { ActivityTab } from './ActivityTab';
export { ApplicationStatusPanel } from './ApplicationStatusPanel';
export { AssessmentTab } from './AssessmentTab';
export { ClassesTab } from './ClassesTab';
export { CommercialsTab, type CourseOrderRow } from './CommercialsTab';
export { CourseHero } from './CourseHero';
export {
  courseContentKind,
  type CourseCurriculumItem,
  type CourseCurriculumLesson,
  CurriculumTab,
} from './CurriculumTab';
export { DeliveryTab } from './DeliveryTab';
export { EnrolPanel } from './EnrolPanel';
export { GateBanner } from './GateBanner';
export { GlanceCard } from './GlanceCard';
export { KpiBand } from './KpiBand';
export { LicenceCard } from './LicenceCard';
export { OpportunityPanel } from './OpportunityPanel';
export { courseBulletLines, OverviewTab } from './OverviewTab';
export { type CourseApplicationRow, OwnerDecisionsPanel } from './OwnerDecisionsPanel';
export { type ProgramCurriculumCourse, ProgramsCurriculumTab } from './ProgramsCurriculumTab';
export { ProgressStrip } from './ProgressStrip';
export { ReviewsTab, summarise } from './ReviewsTab';
