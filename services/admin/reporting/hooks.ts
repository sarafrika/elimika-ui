import { useMemo } from 'react';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';

import {
  cancelReportJob,
  getReportJob,
  listAvailableReports,
  listRecentReportJobs,
  triggerReportJob,
} from './reports';
import { ReportDefinition, ReportJob } from './schemas';

export function useAdminReports() {
  return useQuery<ReportDefinition[]>({
    queryKey: ['admin', 'reports', 'definitions'],
    queryFn: listAvailableReports,
    staleTime: 1000 * 60 * 10,
  });
}

export function useAdminReportHistory() {
  return useQuery<ReportJob[]>({
    queryKey: ['admin', 'reports', 'jobs'],
    queryFn: listRecentReportJobs,
    staleTime: 1000 * 30,
  });
}

export function useAdminStartReportJob() {
  return useMutation({
    mutationFn: ({
      reportType,
      parameters,
    }: {
      reportType: string;
      parameters?: Record<string, unknown>;
    }) => triggerReportJob(reportType, parameters),
  });
}

export function useAdminCancelReportJob() {
  return useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => cancelReportJob(jobId),
  });
}

export function useAdminReportJobPollers(jobs: Array<{ jobId: string }>) {
  const queries = useQueries({
    queries: jobs.map(job => ({
      queryKey: ['admin', 'reports', 'job', job.jobId],
      queryFn: () => getReportJob(job.jobId),
      refetchInterval: query => {
        const status = query.state.data?.status ?? query.state.data?.message;
        if (!status) {
          return 4000;
        }
        const normalized = String(status).toLowerCase();
        const terminal = ['completed', 'failed', 'cancelled', 'canceled', 'expired'];
        return terminal.includes(normalized) ? false : 4000;
      },
    })),
  });

  return useMemo(
    () =>
      queries.map((queryResult, index) => ({
        jobId: jobs[index]?.jobId,
        data: queryResult.data,
        status: queryResult.data?.status,
        isLoading: queryResult.isLoading,
        isFetching: queryResult.isFetching,
        error: queryResult.error,
        refetch: queryResult.refetch,
      })),
    [jobs, queries]
  );
}
