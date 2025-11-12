'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCount } from '@/lib/metrics';
import type { AdminDashboardStats } from '@/services/client/types.gen';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface VerificationSnapshotProps {
  statistics?: AdminDashboardStats;
}

export function VerificationSnapshot({ statistics }: VerificationSnapshotProps) {
  const compliance = statistics?.compliance_metrics;
  const organization = statistics?.organization_metrics;

  const items = [
    {
      label: 'Verified instructors',
      value: formatCount(compliance?.verified_instructors),
      sublabel: `${formatCount(compliance?.pending_instructor_verifications)} pending checks`,
      accent: 'success' as const,
    },
    {
      label: 'Verified course creators',
      value: formatCount(compliance?.verified_course_creators),
      sublabel: `${formatCount(compliance?.pending_course_creator_verifications)} waiting review`,
      accent: 'secondary' as const,
    },
    {
      label: 'Expiring instructor documents',
      value: formatCount(compliance?.expiring_instructor_documents_30d),
      sublabel: 'Next 30 days',
      accent: 'warning' as const,
    },
    {
      label: 'Pending organization approvals',
      value: formatCount(organization?.pending_approvals),
      sublabel: `${formatCount(organization?.total_organizations)} total orgs`,
      accent: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-base font-semibold'>Compliance Snapshot</CardTitle>
        <CardDescription>
          Verification pipelines across instructors, creators, and organizations.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {items.map(item => (
          <div
            key={item.label}
            className='flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3'
          >
            <div>
              <p className='text-sm font-medium'>{item.label}</p>
              <p className='text-muted-foreground text-xs'>{item.sublabel}</p>
            </div>
            <Badge variant={item.accent} className='gap-1 text-sm font-semibold'>
              {item.accent === 'success' ? (
                <ShieldCheck className='h-3.5 w-3.5' />
              ) : (
                <ShieldAlert className='h-3.5 w-3.5' />
              )}
              {item.value}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
