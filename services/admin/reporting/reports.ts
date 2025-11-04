import { client } from '@/services/client/client.gen';

import {
  ReportDefinition,
  ReportDefinitionListSchema,
  ReportJob,
  ReportJobListSchema,
  ReportJobResponseSchema,
} from './schemas';

const unwrap = <T>(parser: (payload: unknown) => T) => (payload: unknown): T => {
  try {
    return parser(payload);
  } catch (error) {
    if (typeof payload === 'object' && payload !== null && 'data' in (payload as Record<string, unknown>)) {
      return parser((payload as { data: unknown }).data);
    }
    throw error;
  }
};

export async function listAvailableReports(): Promise<ReportDefinition[]> {
  const response = await client.get<{ data?: unknown }, unknown, true>({
    url: '/api/v1/admin/reports',
    throwOnError: true,
  });

  return unwrap(ReportDefinitionListSchema.parse)(response.data);
}

export async function triggerReportJob(
  reportType: string,
  parameters?: Record<string, unknown>
): Promise<ReportJob> {
  const response = await client.post<{ data?: unknown }, unknown, true>({
    url: `/api/v1/admin/reports/${encodeURIComponent(reportType)}`,
    body: parameters ?? {},
    headers: {
      'Content-Type': 'application/json',
    },
    throwOnError: true,
  });

  return unwrap(ReportJobResponseSchema.parse)(response.data);
}

export async function getReportJob(jobId: string): Promise<ReportJob> {
  const response = await client.get<{ data?: unknown }, unknown, true>({
    url: `/api/v1/admin/reports/jobs/${encodeURIComponent(jobId)}`,
    throwOnError: true,
  });

  return unwrap(ReportJobResponseSchema.parse)(response.data);
}

export async function listRecentReportJobs(): Promise<ReportJob[]> {
  const response = await client.get<{ data?: unknown }, unknown, true>({
    url: '/api/v1/admin/reports/jobs',
    throwOnError: true,
  });

  return unwrap(ReportJobListSchema.parse)(response.data);
}

export async function cancelReportJob(jobId: string): Promise<ReportJob> {
  const response = await client.delete<{ data?: unknown }, unknown, true>({
    url: `/api/v1/admin/reports/jobs/${encodeURIComponent(jobId)}`,
    throwOnError: true,
  });

  return unwrap(ReportJobResponseSchema.parse)(response.data);
}
