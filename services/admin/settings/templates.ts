import { client } from '@/services/client/client.gen';
import { z } from 'zod';

import {
  EmailTemplateListSchema,
  EmailTemplateSchema,
  UpdateEmailTemplateInput,
  UpdateEmailTemplateInputSchema,
  type EmailTemplate,
} from './schemas';

const apiResponseSchema = z.object({
  data: z.any().optional(),
  message: z.string().optional(),
  status: z.number().optional(),
});

const unwrapData = (payload: unknown) => {
  const parsed = apiResponseSchema.safeParse(payload);
  if (parsed.success) {
    return parsed.data.data ?? payload;
  }
  if (typeof payload === 'object' && payload !== null && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: unknown }).data;
  }
  return payload;
};

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const response = await client.get<{ data?: unknown }, unknown, true>({
    url: '/api/v1/admin/notifications/templates',
    throwOnError: true,
  });

  const raw = unwrapData(response.data);
  return EmailTemplateListSchema.parse(raw);
}

export async function getEmailTemplate(templateId: string): Promise<EmailTemplate> {
  const response = await client.get<{ data?: unknown }, unknown, true>({
    url: `/api/v1/admin/notifications/templates/${encodeURIComponent(templateId)}`,
    throwOnError: true,
  });

  const raw = unwrapData(response.data);
  return EmailTemplateSchema.parse(raw);
}

export async function updateEmailTemplate(
  templateId: string,
  payload: UpdateEmailTemplateInput
): Promise<EmailTemplate> {
  const body = UpdateEmailTemplateInputSchema.parse(payload);

  const response = await client.put<{ data?: unknown }, unknown, true>({
    url: `/api/v1/admin/notifications/templates/${encodeURIComponent(templateId)}`,
    body,
    headers: {
      'Content-Type': 'application/json',
    },
    throwOnError: true,
  });

  const raw = unwrapData(response.data);
  return EmailTemplateSchema.parse(raw ?? body);
}
