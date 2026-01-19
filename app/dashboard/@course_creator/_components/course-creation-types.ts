import z from 'zod';

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 4MB
export const MAX_VIDEO_SIZE_MB = 150; // Adjust according to your backend limit
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

export const requirementTypes = ['material', 'equipment', 'facility', 'other'] as const;
export const providedByOptions = [
  'course_creator',
  'instructor',
  'organisation',
  'student',
] as const;

export const courseCreationSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  description: z.string().min(10, 'Course description is required'),
  objectives: z
    .string()
    .min(10, 'Course objectives is required')
    .max(999, 'Objectives must not exceed 1000 characters'),
  thumbnail_url: z.any().optional(),
  banner_url: z.any().optional(),
  intro_video_url: z.any().optional(),
  is_free: z.boolean().default(false),
  currency: z.string().optional(),
  prerequisites: z.string().max(999, 'Objectives must not exceed 1000 characters'),
  categories: z.string().array(),
  difficulty: z.string().min(1, 'Please select a difficulty level'),
  class_limit: z.coerce.number().min(1, 'Class limit must be at least 1'),
  age_lower_limit: z.coerce.number().optional(),
  age_upper_limit: z.coerce.number().optional(),
  duration_hours: z.coerce.number().optional(),
  duration_minutes: z.coerce.number().min(0, 'minutes must be between 0 and 59'),
  minimum_training_fee: z.coerce.number().min(0, 'Minimum training fee must be zero or greater'),
  creator_share_percentage: z.coerce
    .number()
    .min(0, 'Creator share must be at least 0%')
    .max(100, 'Creator share cannot exceed 100%'),
  instructor_share_percentage: z.coerce
    .number()
    .min(0, 'Instructor share must be at least 0%')
    .max(100, 'Instructor share cannot exceed 100%'),
  revenue_share_notes: z.string().max(500).optional(),
  training_requirements: z
    .array(
      z.object({
        uuid: z.string().optional(),
        requirement_type: z.enum(requirementTypes),
        name: z.string().min(1, 'Requirement name is required'),
        description: z.string().optional(),
        quantity: z.coerce.number().optional(),
        unit: z.string().optional(),
        provided_by: z.enum(providedByOptions),
        is_mandatory: z.boolean().default(false),
      })
    )
    .optional(),
  welcome_message: z.string().max(300).optional(),
  theme_color: z.string().optional(),
  coupon_code: z.string().optional(),
  org_access: z.object({
    educational: z.boolean().optional(),
    corporate: z.boolean().optional(),
    non_profit: z.boolean().optional(),
    individual: z.boolean().optional(),
  }).optional(),
  learning_rules: z.object({
    prerequisites_required: z.boolean().default(false),
    drip_schedule_enabled: z.boolean().default(false),
    completion_rules_enabled: z.boolean().default(false),
  }),

});

export type CourseCreationFormValues = z.infer<typeof courseCreationSchema> & {
  [key: string]: any;
};

export const CURRENCIES = {
  KES: 'KES',
} as const;
