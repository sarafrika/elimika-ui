import { z } from "zod"

export const TrainingExperienceSchema = z.object({
  organisation_name: z.string().min(1, "Organisation name is required"),
  job_title: z.string().min(1, "Job title is required"),
  work_description: z.string().min(1, "Work description is required"),
  start_date: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date(),
  ),
  end_date: z
    .preprocess((val) => {
      if (val === "" || val === null) return null
      if (typeof val === "string") return new Date(val)
      return val
    }, z.date().nullable())
    .optional(),
  user_uuid: z.string(),
})

export const ProfessionalBodySchema = z.object({
  body_name: z.string().min(1, "Institution name is required"),
  membership_no: z.string().min(1, "Membership number is required"),
  member_since: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date(),
  ),
  end_year: z
    .preprocess((val) => {
      if (val === "" || val === null) return null
      if (typeof val === "string") return new Date(val)
      return val
    }, z.date().nullable())
    .optional(),
  current: z.boolean().optional().default(true),
  certificate_url: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  user_uuid: z.string(),
})

export const InstructorFormSchema = z.object({
  uuid: z.string().optional().nullable(),

  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),

  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits"),

  dob: z
    .union([z.date(), z.string().transform((val) => new Date(val))])
    .refine((val) => !isNaN(val.getTime()), {
      message: "Invalid date of birth",
    }),

  email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .optional()
    .nullable(),

  bio: z
    .string()
    .max(500, {
      message: "Bio cannot exceed 500 characters.",
    })
    .optional()
    .nullable(),

  professional_headline: z
    .string()
    .max(100, {
      message: "Headline cannot exceed 100 characters.",
    })
    .nullish(),

  website: z
    .union([
      z.string().url({ message: "Please enter a valid URL." }),
      z.string().nullish(),
    ])
    .optional()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : val)),

  location: z.string().max(100).optional().nullable(),

  user_uuid: z.string(),

  training_experiences: z.array(TrainingExperienceSchema).optional().nullable(),

  professional_bodies: z.array(ProfessionalBodySchema).optional().nullable(),
})

export type Instructor = z.infer<typeof InstructorFormSchema>
export type ProfessionalBody = z.infer<typeof ProfessionalBodySchema>
export type TrainingExperience = z.infer<typeof TrainingExperienceSchema>
