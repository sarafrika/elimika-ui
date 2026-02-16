'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, ShieldAlert, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { extractEntity } from '@/lib/api-helpers';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
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

  const catalogueItem = catalogueQuery.data?.data[0];
  const course = extractEntity(courseQuery.data);
  const classDefinition = extractEntity(classQuery.data);

  const breadcrumbs = useMemo(
    () =>
      routeId
        ? [
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            { id: 'catalogue', title: breadcrumbBase.title, url: breadcrumbBase.href },
            {
              id: 'preview',
              title: 'Summary',
              url: `/dashboard/course-management/preview/${routeId}`,
              isLast: true,
            },
          ]
        : null,
    [routeId, breadcrumbBase.href, breadcrumbBase.title]
  );

  useEffect(() => {
    if (breadcrumbs) {
      replaceBreadcrumbs(breadcrumbs);
    }
  }, [breadcrumbs, replaceBreadcrumbs]);

  if (catalogueQuery.isLoading || courseQuery.isLoading) {
    return (
      <div className='mx-auto w-full max-w-6xl space-y-6 p-6'>
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
      <div className='mx-auto w-full max-w-6xl space-y-6 p-6'>
        <Card className='border-destructive/30 bg-destructive/5'>
          <CardHeader>
            <CardTitle className='text-destructive flex items-center gap-2'>
              <ShieldAlert className='h-5 w-5' />
              Catalogue entry not found
            </CardTitle>
            <CardDescription>
              We could not resolve a catalogue mapping for this course. Ensure it is published to
              the catalogue.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isActive = catalogueItem.active !== false;
  const isPublic = catalogueItem.publicly_visible !== false;
  const pricing = (catalogueItem as { price?: number | string | null }).price ?? null;
  const priceLabel =
    pricing !== null && pricing !== undefined
      ? formatMoney(pricing, catalogueItem.currency_code)
      : 'No price set';

  const typeLabel = useMemo(() => {
    if (catalogueItem.course_uuid) return 'Course';
    if (catalogueItem.class_definition_uuid) return 'Class';
    return 'Item';
  }, [catalogueItem.class_definition_uuid, catalogueItem.course_uuid]);

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 p-6'>
      <Card>
        <CardHeader className='space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='outline' className='gap-2'>
              <ShoppingBag className='h-4 w-4' />
              Catalogue summary
            </Badge>
            <Badge variant={isActive ? 'success' : 'secondary'} className='gap-1'>
              {isActive ? (
                <CheckCircle2 className='h-3.5 w-3.5' />
              ) : (
                <ShieldAlert className='h-3.5 w-3.5' />
              )}
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant={isPublic ? 'secondary' : 'outline'} className='gap-1'>
              {isPublic ? 'Public' : 'Private'}
            </Badge>
            <Badge variant='outline'>{typeLabel}</Badge>
          </div>
          <CardTitle className='text-2xl font-semibold'>
            {course?.title ?? course?.name ?? classDefinition?.title ?? 'Catalogue item'}
          </CardTitle>
          <CardDescription>
            {course?.description ? (
              <HTMLTextPreview htmlContent={course.description} />
            ) : (
              'No course summary provided.'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
            <Detail label='Product code' value={catalogueItem.product_code ?? '—'} />
            <Detail label='Variant code' value={catalogueItem.variant_code ?? '—'} />
            <Detail label='Course ID' value={catalogueItem.course_uuid ?? '—'} />
            <Detail label='Class ID' value={catalogueItem.class_definition_uuid ?? '—'} />
            <Detail label='Currency' value={catalogueItem.currency_code ?? '—'} />
            <Detail label='Created' value={formatDate(catalogueItem.created_date)} />
            <Detail label='Updated' value={formatDate(catalogueItem.updated_date)} />
          </div>

          <div className='bg-muted/40 rounded-xl border p-4'>
            <p className='text-muted-foreground text-xs tracking-wide uppercase'>Pricing</p>
            <p className='text-foreground mt-1 text-lg font-semibold'>{priceLabel}</p>
            <p className='text-muted-foreground text-sm'>
              {catalogueItem.currency_code
                ? `Currency: ${catalogueItem.currency_code}`
                : 'Default currency applies.'}
            </p>
          </div>

          <div className='bg-card/80 rounded-xl border p-4'>
            <p className='text-muted-foreground text-xs tracking-wide uppercase'>Linked records</p>
            <div className='mt-3 grid gap-3 md:grid-cols-2'>
              <LinkedItem
                label='Course'
                value={
                  catalogueItem.course_uuid
                    ? (course?.title ?? course?.name ?? catalogueItem.course_uuid)
                    : '—'
                }
                href={
                  catalogueItem.course_uuid
                    ? `/dashboard/course-management/preview/${catalogueItem.course_uuid}`
                    : undefined
                }
              />
              <LinkedItem
                label='Class'
                value={
                  catalogueItem.class_definition_uuid
                    ? (classDefinition?.title ??
                      classDefinition?.name ??
                      catalogueItem.class_definition_uuid)
                    : '—'
                }
                href={
                  catalogueItem.class_definition_uuid
                    ? `/dashboard/trainings/overview/${catalogueItem.class_definition_uuid}`
                    : undefined
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className='border-border/60 bg-muted/30 rounded-lg border border-dashed p-3 text-sm'>
      <p className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</p>
      <p className='text-foreground mt-1 font-semibold break-all'>{value}</p>
    </div>
  );
}

function LinkedItem({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!href) {
    return (
      <div className='border-border/60 bg-muted/20 rounded-lg border p-3'>
        <p className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</p>
        <p className='text-foreground mt-1 font-semibold'>{value}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className='border-border/60 bg-muted/10 hover:border-primary/50 hover:bg-primary/5 rounded-lg border p-3 transition'
    >
      <p className='text-muted-foreground flex items-center gap-1 text-xs tracking-wide uppercase'>
        {label}
        <ExternalLink className='h-3.5 w-3.5' />
      </p>
      <p className='text-foreground mt-1 font-semibold'>{value}</p>
    </Link>
  );
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return '—';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMoney = (amount: number | string | undefined | null, currency = 'KES') => {
  if (amount === undefined || amount === null) return 'No price set';
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(numeric)) return 'No price set';

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};
