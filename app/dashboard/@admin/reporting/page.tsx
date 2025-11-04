'use client';

import * as React from 'react';

import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/card';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { ScrollArea } from '@ui/scroll-area';
import { Separator } from '@ui/separator';

import {
  ReportDefinition,
  useAdminCancelReportJob,
  useAdminReportHistory,
  useAdminReportJobPollers,
  useAdminReports,
  useAdminStartReportJob,
} from '@/services/admin/reporting';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function isTerminalStatus(status?: string) {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return ['completed', 'failed', 'cancelled', 'canceled', 'expired'].includes(normalized);
}

type ActiveJob = {
  jobId: string;
  reportType: string;
  parameters?: Record<string, unknown>;
};

export default function AdminReportingPage() {
  const { data: reports = [], isLoading: isLoadingReports } = useAdminReports();
  const { data: history = [] } = useAdminReportHistory();
  const startReport = useAdminStartReportJob();
  const cancelReport = useAdminCancelReportJob();

  const [activeJobs, setActiveJobs] = React.useState<ActiveJob[]>([]);

  const jobPollers = useAdminReportJobPollers(activeJobs);

  const trackedJobs = React.useMemo(() => {
    const historyJobs = history.map(job => ({
      jobId: job.jobId,
      reportType: job.reportType ?? 'unknown',
      parameters: job.parameters,
    }));

    const combined = [...historyJobs];
    activeJobs.forEach(job => {
      if (!combined.some(existing => existing.jobId === job.jobId)) {
        combined.unshift(job);
      }
    });
    return combined;
  }, [activeJobs, history]);

  const jobStatusMap = new Map(jobPollers.map(result => [result.jobId, result]));

  const handleStartReport = React.useCallback(
    async (report: ReportDefinition, formData: FormData) => {
      const parameters = Object.fromEntries(Array.from(formData.entries()));
      try {
        const job = await startReport.mutateAsync({
          reportType: report.type,
          parameters,
        });
        toast.success(`Report queued: ${report.name}`);
        setActiveJobs(previous => [{ jobId: job.jobId, reportType: report.type, parameters }, ...previous]);
      } catch (_error) {
        toast.error('Unable to start the report. Please try again.');
      }
    },
    [startReport]
  );

  const handleCancelJob = React.useCallback(
    async (jobId: string) => {
      try {
        await cancelReport.mutateAsync({ jobId });
        toast.success('Report job cancelled');
      } catch (_error) {
        toast.error('Unable to cancel the report job.');
      }
    },
    [cancelReport]
  );

  return (
    <div className='space-y-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Reporting</h1>
        <p className='text-muted-foreground'>
          Launch data exports for finance, compliance, and engagement teams. Jobs run asynchronously and can
          be cancelled at any time.
        </p>
      </header>
      <div className='grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]'>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle className='text-base'>Available reports</CardTitle>
            <CardDescription>
              Configure the parameters and queue a job. A download link appears when processing is complete.
            </CardDescription>
          </CardHeader>
          <Separator />
          <ScrollArea className='h-[640px]'>
            <CardContent className='space-y-4 pt-6'>
              {isLoadingReports ? (
                <p className='text-sm text-muted-foreground'>Loading report catalog…</p>
              ) : reports.length > 0 ? (
                reports.map(report => (
                  <ReportLauncher
                    key={report.type}
                    report={report}
                    onStart={handleStartReport}
                    isSubmitting={startReport.isPending}
                  />
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>No reports available.</p>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle>Job activity</CardTitle>
            <CardDescription>Monitor progress and access completed exports.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className='space-y-4 pt-6'>
            {trackedJobs.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Start a report to see it tracked here.</p>
            ) : (
              <div className='space-y-4'>
                {trackedJobs.map(job => {
                  const statusResult = jobStatusMap.get(job.jobId);
                  const status = statusResult?.data?.status ?? history.find(item => item.jobId === job.jobId)?.status;
                  const downloadUrl = statusResult?.data?.downloadUrl ?? history.find(item => item.jobId === job.jobId)?.downloadUrl;
                  const isLoading = statusResult?.isLoading || statusResult?.isFetching;
                  const isTerminal = isTerminalStatus(status);

                  return (
                    <div
                      key={job.jobId}
                      className={cn(
                        'rounded-md border border-border/70 p-4 text-sm transition-colors',
                        status?.toLowerCase() === 'failed' && 'border-destructive/60 bg-destructive/10',
                        status?.toLowerCase() === 'completed' && 'border-emerald-500/60 bg-emerald-500/5'
                      )}
                    >
                      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                        <div>
                          <div className='text-base font-semibold text-foreground'>{job.reportType}</div>
                          <div className='text-xs text-muted-foreground'>Job ID: {job.jobId}</div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <span className='text-xs uppercase tracking-wide text-muted-foreground'>
                            {status ?? 'pending'}
                          </span>
                          {!isTerminal ? (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => statusResult?.refetch()}
                              disabled={isLoading}
                            >
                              Refresh
                            </Button>
                          ) : null}
                          {!isTerminal ? (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleCancelJob(job.jobId)}
                              disabled={cancelReport.isPending}
                            >
                              Cancel
                            </Button>
                          ) : null}
                          {downloadUrl ? (
                            <Button variant='secondary' size='sm' asChild>
                              <a href={downloadUrl} target='_blank' rel='noopener noreferrer'>
                                Download
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className='flex justify-between border-t border-border bg-muted/40 px-6 py-4 text-xs text-muted-foreground'>
            <span>{trackedJobs.length} job(s) tracked</span>
            <span>Polls pause automatically once jobs complete.</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

type ReportLauncherProps = {
  report: ReportDefinition;
  onStart: (report: ReportDefinition, formData: FormData) => Promise<void>;
  isSubmitting: boolean;
};

function ReportLauncher({ report, onStart, isSubmitting }: ReportLauncherProps) {
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      await onStart(report, formData);
      form.reset();
    },
    [onStart, report]
  );

  return (
    <div className='rounded-lg border border-border/60 bg-muted/30 p-4'>
      <div className='space-y-1'>
        <h3 className='text-sm font-semibold text-foreground'>{report.name}</h3>
        {report.description ? (
          <p className='text-sm text-muted-foreground'>{report.description}</p>
        ) : null}
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className='mt-4 space-y-3'>
        {report.parameters?.map(parameter => (
          <div key={parameter.name} className='space-y-1 text-sm'>
            <Label htmlFor={`${report.type}-${parameter.name}`}>{parameter.label ?? parameter.name}</Label>
            <Input
              id={`${report.type}-${parameter.name}`}
              name={parameter.name}
              defaultValue={parameter.defaultValue as string | undefined}
              placeholder={parameter.description ?? ''}
              required={parameter.required ?? false}
            />
          </div>
        ))}
        <div className='flex items-center justify-between pt-2'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Queuing…' : 'Run report'}
          </Button>
          <Button type='button' variant='ghost' size='sm' onClick={() => formRef.current?.reset()}>
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
