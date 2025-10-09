// schemas/courseSchema.ts
import { z } from 'zod';

export const courseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    name: z.string().min(1, "Title is required"),
    subtitle: z.string().optional(),
    categories: z.string().array(),
    difficulty: z.string().optional(),
    description: z.string().optional(),
    targetAudience: z.array(z.string()).optional(),
    objectives: z.any(),
    prerequisites: z.string().max(999, 'Objectives must not exceed 1000 characters'),
    equipment: z.string().optional(),
    classroom: z.string().optional()
});

export type CourseFormValues = z.infer<typeof courseSchema>;
