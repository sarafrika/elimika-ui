'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/services/api/base-url';
import { configQuery } from '../lib/admin-queries';
import type { SmsPlaceholder } from '../lib/sms-template-checks';

/** One SMS the platform sends, with its editable wording and the placeholders it may use. */
export interface SmsTemplate {
  key: string;
  name: string;
  group: string;
  trigger: string;
  security: boolean;
  enabled: boolean;
  body: string;
  default_body: string;
  edited: boolean;
  updated_by_name: string | null;
  updated_at: string | null;
  placeholders: SmsPlaceholder[];
}

export interface SmsTestResult {
  sent: boolean;
  to_masked: string | null;
}

const BASE_PATH = '/api/v1/admin/sms-templates';
const smsTemplatesKey = ['admin', 'sms-templates'] as const;

/** Calls the API through the authenticated proxy; a failure throws the API's own message. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? `SMS templates request failed with ${response.status}`);
  }
  return body?.data as T;
}

export function useSmsTemplates() {
  const query = useQuery({
    queryKey: smsTemplatesKey,
    queryFn: () => request<SmsTemplate[]>(''),
    ...configQuery,
  });
  return { templates: query.data ?? [], query };
}

/** Writes the returned template into the cached list, so the page shows it without a refetch. */
function useTemplateWrite<V>(call: (values: V) => Promise<SmsTemplate>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: call,
    onSuccess: updated => {
      queryClient.setQueryData<SmsTemplate[]>(smsTemplatesKey, current =>
        current?.map(template => (template.key === updated.key ? updated : template))
      );
      return queryClient.invalidateQueries({ queryKey: smsTemplatesKey });
    },
  });
}

export function useSaveSmsTemplate() {
  return useTemplateWrite((values: { key: string; body: string; enabled: boolean }) =>
    request<SmsTemplate>(`/${encodeURIComponent(values.key)}`, {
      method: 'PUT',
      body: JSON.stringify({ body: values.body, enabled: values.enabled }),
    })
  );
}

export function useResetSmsTemplate() {
  return useTemplateWrite((key: string) =>
    request<SmsTemplate>(`/${encodeURIComponent(key)}`, { method: 'DELETE' })
  );
}

export function useSendSmsTest() {
  return useMutation({
    mutationFn: (key: string) =>
      request<SmsTestResult>(`/${encodeURIComponent(key)}/test`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
  });
}
