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
  COURSE_READER_KINDS,
  type CourseReaderItem,
  type CourseReaderItemKind,
  type CourseReaderKindStyle,
  type CourseReaderLesson,
  type CourseReaderLicenceSetId,
  courseReaderKind,
  courseReaderLicenceSet,
} from './_reader';
export {
  clampCoursePercent,
  COURSE_DEFAULT_CURRENCY,
  COURSE_PLACEHOLDER,
  type CourseClassFormatTone,
  type CourseClassRow,
  type CourseEligibilityCheck,
  courseInitials,
  courseSeatFill,
  formatCourseCount,
  formatCourseDate,
  formatCourseMoney,
  formatRateCardFrom,
} from './_shared';
export {
  AccessCard,
  type AccessCardProps,
  COURSE_ACCESS_GRANTS,
  type CourseGrant,
  CourseGrantIcon,
  courseGrantLabelClass,
  type CourseGrantTone,
} from './AccessCard';
export { ActionsCard, type ActionsCardProps, type CourseRailActionItem } from './ActionsCard';
export {
  ActivityTab,
  type ActivityTabProps,
  ActivityTabSkeleton,
  type CourseActivityEvent,
  type CourseActivityTone,
} from './ActivityTab';
export {
  ApplicationStatusPanel,
  type ApplicationStatusPanelProps,
  ApplicationStatusPanelSkeleton,
} from './ApplicationStatusPanel';
export {
  ClassesTab,
  type ClassesTabProps,
  ClassesTabSkeleton,
  EligibilityCard,
  type EligibilityCardProps,
} from './ClassesTab';
export {
  ApprovedRateCards,
  type ApprovedRateCardsProps,
  CommercialsTab,
  type CommercialsTabProps,
  CommercialsTabSkeleton,
  CommercialTerms,
  type CommercialTermsProps,
  courseCommercialsVisible,
  type CourseOrderRow,
  type CourseOrderStatusTone,
  RecentPurchases,
  type RecentPurchasesProps,
} from './CommercialsTab';
export { CourseHero, type CourseHeroProps, CourseHeroSkeleton } from './CourseHero';
export {
  COURSE_CONTENT_KINDS,
  type CourseContentKind,
  courseContentKind,
  type CourseCurriculumItem,
  type CourseCurriculumLesson,
  CurriculumTab,
  type CurriculumTabProps,
  CurriculumTabSkeleton,
} from './CurriculumTab';
export {
  DeliveryClassGrid,
  type DeliveryClassGridProps,
  DeliveryTab,
  type DeliveryTabProps,
  DeliveryTabSkeleton,
  DeliveryTrainerTable,
  type DeliveryTrainerTableProps,
} from './DeliveryTab';
export {
  COURSE_ENROL_INCLUSIONS,
  type CourseEnrolInclusion,
  type CourseEnrolVars,
  EnrolPanel,
  type EnrolPanelProps,
  EnrolPanelSkeleton,
} from './EnrolPanel';
export { GateBanner, type GateBannerProps } from './GateBanner';
export {
  COURSE_GLANCE_ROWS,
  type CourseGlanceRow,
  type CourseGlanceVars,
  GlanceCard,
  type GlanceCardProps,
  GlanceCardSkeleton,
} from './GlanceCard';
export {
  KPI_BAND_GRID,
  KpiBand,
  KpiBandHeaderSkeleton,
  type KpiBandProps,
  KpiBandSkeleton,
} from './KpiBand';
export { COURSE_LICENCE_TERMS, LicenceCard, type LicenceCardProps } from './LicenceCard';
export {
  COURSE_OPPORTUNITY_TERMS,
  type CourseOpportunityTerm,
  type CourseOpportunityTone,
  type CourseOpportunityVars,
  OpportunityPanel,
  type OpportunityPanelProps,
  OpportunityPanelSkeleton,
} from './OpportunityPanel';
export {
  COURSE_FIT_CARDS,
  COURSE_REQUIREMENT_PROVIDER_LABELS,
  COURSE_REQUIREMENT_PROVIDER_ORDER,
  COURSE_REQUIREMENT_TYPE_LABELS,
  courseBulletLines,
  type CourseFitCard,
  type CourseFitRow,
  type CourseFitVars,
  groupRequirements,
  OverviewTab,
  type OverviewTabProps,
  OverviewTabSkeleton,
} from './OverviewTab';
export {
  type CourseApplicationRow,
  OwnerDecisionsPanel,
  type OwnerDecisionsPanelProps,
  OwnerDecisionsPanelSkeleton,
} from './OwnerDecisionsPanel';
export {
  ProgressStrip,
  type ProgressStripProps,
  ProgressStripSkeleton,
} from './ProgressStrip';
export {
  COURSE_READER_FOOTER_NOTES,
  CourseReaderPane,
  type CourseReaderPaneProps,
  CourseReaderPaneSkeleton,
  type CourseReaderProseBlock,
  type CourseReaderQuiz,
  type CourseReaderQuizOption,
  type CourseReaderQuizQuestion,
  type CourseReaderVideo,
} from './ReaderPane';
export {
  COURSE_READER_LICENCES,
  type CourseReaderAttachment,
  type CourseReaderLicence,
  type CourseReaderNote,
  CourseReaderRail,
  type CourseReaderRailProps,
  CourseReaderRailSkeleton,
} from './ReaderRail';
export {
  CourseReaderTree,
  type CourseReaderTreeProps,
  CourseReaderTreeSkeleton,
} from './ReaderTree';
export {
  type CourseRatingBar,
  type CourseRatingSummary,
  RatingSummary,
  type RatingSummaryProps,
  ReviewsTab,
  type ReviewsTabProps,
  ReviewsTabSkeleton,
  summarise,
} from './ReviewsTab';
