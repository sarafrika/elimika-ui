'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { extractEntity } from '@/lib/api-helpers';
import { format } from 'date-fns';
import { BookOpen, CheckCircle2, ShieldAlert, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  getCourseByUuidOptions,
  getClassDefinitionOptions,
  resolveByCourseOrClassOptions,
} from '@/services/client/@tanstack/react-query.gen';

export function CataloguePreviewSummary({
  breadcrumbBase = { title: 'Catalogue', href: '/dashboard/catalogue' },
}: {
  breadcrumbBase?: { title: string; href: string };
}) {
  const params = useParams();
  const routeId = params?.id as string | undefined;
  const { replaceBreadcrumbs } = useBreadcrumb();

  const catalogueQuery = useQuery({
    ...resolveByCourseOrClassOptions({
      query: { course_uuid: routeId, class_uuid: routeId },
    }),
    enabled: Boolean(routeId),
  });

  const resolvedCourseId = catalogueQuery.data?.data?.course_uuid ?? routeId;
  const resolvedClassId = catalogueQuery.data?.data?.class_definition_uuid ?? undefined;

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: resolvedCourseId ?? '' } }),
    enabled: Boolean(resolvedCourseId),
  });

  const classQuery = useQuery({
    ...getClassDefinitionOptions({
      path: { uuid: resolvedClassId ?? '' },
    }),
    enabled: Boolean(resolvedClassId),
  });

  const catalogueItem = catalogueQuery.data?.data;
  const course = extractEntity(courseQuery.data);
  const classDefinition = extractEntity(classQuery.data);

  if (routeId) {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'catalogue', title: breadcrumbBase.title, url: breadcrumbBase.href },
      {
        id: 'preview',
        title: 'Summary',
        url: `/dashboard/course-management/preview/${routeId}`,
        isLast: true,
      },
    ]);
  }

  if (catalogueQuery.isLoading || courseQuery.isLoading) {
    return (
      <div className='mx-auto max-w-5xl space-y-6 p-6'>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='mt-2 h-4 w-64' />
          </CardHeader>
          <CardContent className='space-y-3'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-1/2' />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!catalogueItem) {
    return (
      <div className='mx-auto max-w-5xl space-y-6 p-6'>
        <Card className='border-destructive/30 bg-destructive/5'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-destructive'>
              <ShieldAlert className='h-5 w-5' />
              Catalogue entry not found
            </CardTitle>
            <CardDescription>
              We could not resolve a catalogue mapping for this course. Ensure it is published to the
              catalogue.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isActive = catalogueItem.active !== false;
  const isPublic = catalogueItem.publicly_visible !== false;

  return (
    <div className='mx-auto max-w-5xl space-y-6 p-6'>
      <Card>
        <CardHeader className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div className='space-y-2'>
            <Badge variant='outline' className='gap-2'>
              <ShoppingBag className='h-4 w-4' />
              Catalogue summary
            </Badge>
            <CardTitle className='text-2xl font-semibold'>
              {course?.title ?? course?.name ?? 'Catalogue item'}
            </CardTitle>
            <CardDescription>
              {course?.description ? (
                <HTMLTextPreview htmlContent={course.description} />
              ) : (
                'No course summary provided.'
              )}
            </CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Badge variant={isActive ? 'success' : 'secondary'} className='gap-1'>
              {isActive ? <CheckCircle2 className='h-3.5 w-3.5' /> : <ShieldAlert className='h-3.5 w-3.5' />}
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant={isPublic ? 'outline' : 'secondary'} className='gap-1'>
              {isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <Detail
            label='Course'
            value={
              catalogueItem.course_uuid
                ? course?.title ??
                  course?.name ??
                  classDefinition?.course_uuid ??
                  catalogueItem.course_uuid
                : '—'
            }
          />
          <Detail
            label='Class'
            value={
              catalogueItem.class_definition_uuid
                ? classDefinition?.title ??
                  classDefinition?.name ??
                  classDefinition?.uuid ??
                  catalogueItem.class_definition_uuid
                : '—'
            }
          />
          <Detail label='Product code' value={catalogueItem.product_code ?? '—'} />
          <Detail label='Variant code' value={catalogueItem.variant_code ?? '—'} />
          <Detail label='Currency' value={catalogueItem.currency_code ?? '—'} />
          <Detail
            label='Created'
            value={
              catalogueItem.created_date
                ? format(new Date(catalogueItem.created_date), 'dd MMM yyyy, HH:mm')
                : '—'
            }
          />
          <Detail
            label='Updated'
            value={
              catalogueItem.updated_date
                ? format(new Date(catalogueItem.updated_date), 'dd MMM yyyy, HH:mm')
                : '—'
            }
          />
          <Detail
            label='Type'
            value={
              catalogueItem.course_uuid
                ? 'Course'
                : catalogueItem.class_definition_uuid
                  ? 'Class'
                  : 'Item'
            }
            icon={<BookOpen className='h-4 w-4 text-muted-foreground' />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className='rounded-lg border border-border/60 bg-muted/40 p-3 text-sm'>
      <p className='text-muted-foreground flex items-center gap-1 text-xs uppercase tracking-wide'>
        {icon}
        {label}
      </p>
      <p className='mt-1 break-all font-semibold text-foreground'>{value}</p>
    </div>
  );
}
