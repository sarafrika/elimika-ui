import { z } from 'zod';

export const ReportParameterSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  options: z
    .array(
      z.object({
        value: z.union([z.string(), z.number(), z.boolean()]),
        label: z.string().optional(),
      })
    )
    .optional(),
});

export const ReportDefinitionSchema = z.object({
  type: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  schedule: z.string().optional(),
  parameters: z.array(ReportParameterSchema).optional(),
});

const ReportDefinitionCollectionSchema = z.union([
  z.array(ReportDefinitionSchema),
  z.object({ reports: z.array(ReportDefinitionSchema) }).transform(({ reports }) => reports),
  z
    .object({
      data: z
        .object({
          items: z.array(ReportDefinitionSchema).optional(),
          reports: z.array(ReportDefinitionSchema).optional(),
        })
        .optional(),
    })
    .transform(({ data }) => data?.reports ?? data?.items ?? []),
]);

export const ReportDefinitionListSchema = ReportDefinitionCollectionSchema.transform(reports =>
  Array.isArray(reports) ? reports : []
);

export const ReportJobSchema = z.object({
  jobId: z.union([z.string(), z.number()]).transform(String),
  reportType: z.string().optional(),
  status: z.string(),
  progress: z.number().min(0).max(100).optional(),
  submittedAt: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  requestedBy: z.string().optional(),
  downloadUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  attempts: z.number().optional(),
  parameters: z.record(z.any()).optional(),
  message: z.string().optional(),
});

const ReportJobPayloadSchema = z.union([
  ReportJobSchema,
  z.object({ job: ReportJobSchema }).transform(({ job }) => job),
  z
    .object({
      data: z
        .object({
          job: ReportJobSchema.optional(),
          jobs: z.array(ReportJobSchema).optional(),
        })
        .optional(),
    })
    .transform(({ data }) => data?.job ?? data?.jobs?.[0]),
]);

export const ReportJobResponseSchema = ReportJobPayloadSchema.refine(
  (value): value is z.infer<typeof ReportJobSchema> => Boolean(value),
  {
    message: 'Missing job details in response payload',
  }
);

export const ReportJobListSchema = z
  .object({
    jobs: z.array(ReportJobSchema).optional(),
    data: z
      .object({
        jobs: z.array(ReportJobSchema).optional(),
      })
      .optional(),
  })
  .transform(({ jobs, data }) => jobs ?? data?.jobs ?? []);

export type ReportDefinition = z.infer<typeof ReportDefinitionSchema>;
export type ReportParameter = z.infer<typeof ReportParameterSchema>;
export type ReportJob = z.infer<typeof ReportJobSchema>;
