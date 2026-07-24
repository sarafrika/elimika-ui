// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CheckCircle, Clock, Eye, FileText, Inbox, MoreHorizontal, Trash2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';

const normStatus = (status?: string): 'Pending' | 'Approved' | 'Denied' => {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved') return 'Approved';
  if (s === 'rejected' || s === 'revoked') return 'Denied';
  return 'Pending';
};

export default function ApprovalsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: Boolean(organisationUuid),
  });

  const applications = applicationsQuery.data?.data?.content ?? [];
  const [rows, setRows] = useState(() =>
    applications.map(app => ({
      id: app.uuid,
      requester: app.course_name ?? app.course_title ?? app.course_uuid ?? 'Training request',
      type: 'Training request',
      description: app.course_name ?? app.course_uuid ?? '—',
      date: app.created_date ? dayjs(app.created_date).format('ddd, DD MMM, HH:mm') : '—',
      status: normStatus(app.status),
    }))
  );
  useEffect(() => {
    setRows(
      applications.map(app => ({
        id: app.uuid,
        requester: app.course_name ?? app.course_title ?? app.course_uuid ?? 'Training request',
        type: 'Training request',
        description: app.course_name ?? app.course_uuid ?? '—',
        date: app.created_date ? dayjs(app.created_date).format('ddd, DD MMM, HH:mm') : '—',
        status: normStatus(app.status),
      }))
    );
  }, [applicationsQuery.data]);

  const pending = rows.filter(r => r.status === 'Pending').length;
  const approved = rows.filter(r => r.status === 'Approved').length;
  const denied = rows.filter(r => r.status === 'Denied').length;

  const stats = [
    { label: 'Pending', value: pending, color: 'bg-warning/10 text-warning' },
    { label: 'Approved', value: approved, color: 'bg-success/10 text-success' },
    { label: 'Denied', value: denied, color: 'bg-destructive/10 text-destructive' },
    { label: 'Total', value: rows.length, color: 'bg-primary/10 text-primary' },
  ];

  const handleDecision = (id: string, decision: 'Approved' | 'Denied') => {
    const req = rows.find(r => r.id === id);
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status: decision } : r)));
    toast[decision === 'Approved' ? 'success' : 'warning'](
      `${decision} — ${req?.requester ?? 'request'}`,
      { description: req?.description }
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        title="Approvals & Workflows"
        description="Review fund requests, course approvals, and instructor assignments."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.color}`}>
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Approval requests</h3>
        {applicationsQuery.isLoading ? null : rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No approvals" description="There are no pending approval requests." />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Requester</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Description</TableHead>
                  <TableHead className="whitespace-nowrap">Submission Date</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(req => {
                  const isPending = req.status === 'Pending';
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="whitespace-nowrap font-medium">{req.requester}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline">{req.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate whitespace-nowrap text-muted-foreground">
                        {req.description}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{req.date}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={req.status === 'Approved' ? 'secondary' : req.status === 'Denied' ? 'destructive' : 'outline'}
                          className="gap-1"
                        >
                          {isPending ? <Clock className="h-3 w-3" /> : req.status === 'Denied' ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isPending}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDecision(req.id, 'Approved')}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDecision(req.id, 'Denied')}>
                              <XCircle className="mr-2 h-4 w-4" /> Deny
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast.info('View request', { description: `Opening request: ${req.requester}.` })}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => toast.error('Request removed', { description: `${req.requester}'s request has been removed.` })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
