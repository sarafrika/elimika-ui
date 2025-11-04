import { z } from 'zod';

export const SettingsPaginationSchema = z.object({
  page: z.number().nonnegative().default(0),
  pageSize: z.number().int().positive().default(20),
  total: z.number().int().nonnegative().optional(),
  hasNext: z.boolean().optional(),
});

export const TemplateVariableSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  sample: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const EmailTemplateSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    name: z.string(),
    code: z.string().optional(),
    description: z.string().optional(),
    subject: z.string().default(''),
    body: z.string().default(''),
    textBody: z.string().optional(),
    category: z.string().optional(),
    channel: z.string().optional(),
    variables: z.array(TemplateVariableSchema).optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional(),
  })
  .transform(template => ({
    ...template,
    subject: template.subject ?? '',
    body: template.body ?? '',
  }));

const EmailTemplateCollectionSchema = z.union([
  z.array(EmailTemplateSchema),
  z.object({ templates: z.array(EmailTemplateSchema) }).transform(data => data.templates),
  z.object({ items: z.array(EmailTemplateSchema) }).transform(data => data.items),
  z
    .object({
      data: z
        .object({
          templates: z.array(EmailTemplateSchema).optional(),
          items: z.array(EmailTemplateSchema).optional(),
          content: z.array(EmailTemplateSchema).optional(),
        })
        .optional(),
    })
    .transform(({ data }) => data?.templates ?? data?.items ?? data?.content ?? []),
]);

export const EmailTemplateListSchema = EmailTemplateCollectionSchema.transform(templates =>
  Array.isArray(templates) ? templates : []
);

export const UpdateEmailTemplateInputSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Template body is required'),
  textBody: z.string().optional(),
  description: z.string().optional(),
});

export const AuditLogActorSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  domain: z.string().optional(),
});

export const AuditLogResourceSchema = z.object({
  type: z.string().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
  path: z.string().optional(),
});

export const AuditLogEntrySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  event: z.string(),
  action: z.string().optional(),
  actor: AuditLogActorSchema.optional(),
  resource: AuditLogResourceSchema.optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().or(z.date()).transform(value =>
    value instanceof Date ? value.toISOString() : value
  ),
  metadata: z.record(z.any()).optional(),
});

export const AuditLogPageSchema = z.object({
  items: z.array(AuditLogEntrySchema).default([]),
  page: z.number().nonnegative().default(0),
  pageSize: z.number().positive().default(50),
  total: z.number().nonnegative().optional(),
  hasNext: z.boolean().optional(),
});

const AuditLogCollectionUnion = z.union([
  AuditLogPageSchema,
  z
    .object({
      data: z
        .object({
          items: z.array(AuditLogEntrySchema).optional(),
          content: z.array(AuditLogEntrySchema).optional(),
          page: z.number().optional(),
          pageSize: z.number().optional(),
          total: z.number().optional(),
          hasNext: z.boolean().optional(),
        })
        .optional(),
      meta: SettingsPaginationSchema.partial().optional(),
    })
    .transform(({ data, meta }) => ({
      items: data?.items ?? data?.content ?? [],
      page: data?.page ?? meta?.page ?? 0,
      pageSize: data?.pageSize ?? meta?.pageSize ?? data?.items?.length ?? 50,
      total: data?.total ?? meta?.total,
      hasNext: data?.hasNext ?? meta?.hasNext,
    })),
]);

export const AuditLogCollectionSchema = AuditLogCollectionUnion.transform(page => ({
  items: page.items ?? [],
  page: page.page ?? 0,
  pageSize: page.pageSize ?? page.items.length ?? 50,
  total: page.total,
  hasNext: page.hasNext,
}));

export const FeatureToggleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  enabled: z.boolean(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});

const FeatureToggleCollectionSchema = z.union([
  z.array(FeatureToggleSchema),
  z.object({ toggles: z.array(FeatureToggleSchema) }).transform(data => data.toggles),
  z
    .object({
      data: z
        .object({
          toggles: z.array(FeatureToggleSchema).optional(),
          items: z.array(FeatureToggleSchema).optional(),
          content: z.array(FeatureToggleSchema).optional(),
        })
        .optional(),
    })
    .transform(({ data }) => data?.toggles ?? data?.items ?? data?.content ?? []),
]);

export const FeatureToggleListSchema = FeatureToggleCollectionSchema.transform(toggles =>
  Array.isArray(toggles) ? toggles : []
);

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof UpdateEmailTemplateInputSchema>;
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
export type AuditLogPage = z.infer<typeof AuditLogPageSchema>;
export type FeatureToggle = z.infer<typeof FeatureToggleSchema>;
