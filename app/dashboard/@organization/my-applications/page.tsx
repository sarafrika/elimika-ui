'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useOrganisation } from '@/context/organisation-context';
import { searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MyApplicationsPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch applications for this organization
  const { data, isLoading, refetch } = useQuery({
    ...searchTrainingApplicationsOptions({
      body: {
        searchCriteria: [
          {
            key: 'applicant_uuid',
            operation: 'EQUAL',
            value: organisation?.uuid,
          },
          ...(statusFilter
            ? [{ key: 'status', operation: 'EQUAL', value: statusFilter }]
            : []),
        ],
        pageable: {
          page,
          size: pageSize,
        },
      },
    }),
    enabled: !!organisation?.uuid,
  });

  const applications = data?.data?.content || [];
  const totalApplications = data?.data?.totalElements || 0;
  const totalPages = Math.ceil(totalApplications / pageSize);

  // Filter by search query (client-side)
  const filteredApplications = applications.filter((app: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      app.course_name?.toLowerCase().includes(searchLower) ||
      app.application_notes?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const stats = {
    total: totalApplications,
    pending: applications.filter((app: any) => app.status === 'PENDING').length,
    approved: applications.filter((app: any) => app.status === 'APPROVED').length,
    rejected: applications.filter((app: any) => app.status === 'REJECTED').length,
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending',
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-muted-foreground',
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          variant: 'default' as const,
          icon: CheckCircle2,
          color: 'text-primary',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-destructive',
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: FileText,
          color: 'text-muted-foreground',
        };
    }
  };

  if (isLoading && !data) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex items-start gap-4'>
          <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg border'>
            <FileText className='text-primary h-6 w-6' />
          </div>
          <div>
            <h1 className='text-2xl font-bold'>My Training Applications</h1>
            <p className='text-muted-foreground'>Track and manage your submitted applications</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-muted-foreground text-2xl font-bold'>{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-primary text-2xl font-bold'>{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-destructive text-2xl font-bold'>{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search by course name...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All statuses</SelectItem>
                <SelectItem value='PENDING'>Pending</SelectItem>
                <SelectItem value='APPROVED'>Approved</SelectItem>
                <SelectItem value='REJECTED'>Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className='flex min-h-[300px] flex-col items-center justify-center py-12'>
            <FileText className='text-muted-foreground mb-4 h-12 w-12' />
            <h3 className='mb-2 text-lg font-semibold'>No Applications Found</h3>
            <p className='text-muted-foreground mb-4 text-center text-sm'>
              {statusFilter || searchQuery
                ? 'Try adjusting your filters or search query'
                : "You haven't submitted any training applications yet"}
            </p>
            {!statusFilter && !searchQuery && (
              <Button onClick={() => router.push('/dashboard/courses')}>Browse Courses</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredApplications.map((application: any) => {
              const statusConfig = getStatusConfig(application.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={application.uuid} className='flex flex-col'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <CardTitle className='line-clamp-2 text-base'>
                          {application.course_name || 'Unknown Course'}
                        </CardTitle>
                      </div>
                      <Badge variant={statusConfig.variant} className='shrink-0'>
                        <StatusIcon className='mr-1 h-3 w-3' />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='flex flex-1 flex-col gap-4'>
                    {/* Course Description */}
                    {application.course_description && (
                      <div className='text-muted-foreground text-sm'>
                        <RichTextRenderer
                          htmlString={application.course_description}
                          maxChars={100}
                        />
                      </div>
                    )}

                    <Separator />

                    {/* Rate Card Summary */}
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-sm'>
                        <DollarSign className='text-muted-foreground h-4 w-4' />
                        <span className='text-muted-foreground'>Rate Card</span>
                      </div>
                      <div className='grid grid-cols-2 gap-2 text-xs'>
                        <div className='bg-muted/20 rounded-lg border p-2'>
                          <div className='text-muted-foreground'>Private Online</div>
                          <div className='font-semibold'>
                            {application.rate_card?.currency || 'USD'}{' '}
                            {application.rate_card?.private_online_rate || 0}
                          </div>
                        </div>
                        <div className='bg-muted/20 rounded-lg border p-2'>
                          <div className='text-muted-foreground'>Group Online</div>
                          <div className='font-semibold'>
                            {application.rate_card?.currency || 'USD'}{' '}
                            {application.rate_card?.group_online_rate || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Application Notes */}
                    {application.application_notes && (
                      <>
                        <Separator />
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2 text-sm'>
                            <BookOpen className='text-muted-foreground h-4 w-4' />
                            <span className='text-muted-foreground'>Notes</span>
                          </div>
                          <p className='line-clamp-2 text-sm'>{application.application_notes}</p>
                        </div>
                      </>
                    )}

                    {/* Review Notes (if approved/rejected) */}
                    {application.review_notes && (
                      <>
                        <Separator />
                        <div className='bg-primary/5 rounded-lg border p-3'>
                          <div className='text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase'>
                            Review Notes
                          </div>
                          <p className='text-sm'>{application.review_notes}</p>
                        </div>
                      </>
                    )}

                    {/* Submission Date */}
                    {application.created_at && (
                      <div className='text-muted-foreground mt-auto flex items-center gap-2 pt-2 text-xs'>
                        <Calendar className='h-3 w-3' />
                        Submitted {new Date(application.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className='py-4'>
                <div className='flex items-center justify-between'>
                  <p className='text-muted-foreground text-sm'>
                    Showing {page * pageSize + 1}-
                    {Math.min((page + 1) * pageSize, totalApplications)} of {totalApplications}{' '}
                    applications
                  </p>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
