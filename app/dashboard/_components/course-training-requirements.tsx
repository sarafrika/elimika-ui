'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CourseTrainingRequirement, ProvidedByEnum } from '@/services/client';

type ViewerRole = 'admin' | 'course_creator' | 'instructor' | 'organization' | 'student';

type Props = {
  requirements?: CourseTrainingRequirement[] | null;
  viewerRole?: ViewerRole;
  title?: string;
  description?: string;
  className?: string;
};

const PROVIDER_LABELS: Record<string, string> = {
  course_creator: 'Course creator',
  instructor: 'Instructor',
  organisation: 'Organisation',
  student: 'Student',
};

const PROVIDER_ORDER: ProvidedByEnum[] = [
  'student',
  'organisation',
  'instructor',
  'course_creator',
];

const FULL_ACCESS_ROLES = new Set<ViewerRole>([
  'admin',
  'course_creator',
  'instructor',
  'organization',
]);

export function CourseTrainingRequirements({
  requirements,
  viewerRole,
  title = 'Training Requirements',
  description = 'Resources and participation requirements for this course.',
  className,
}: Props) {
  const visibleRequirements = (requirements ?? []).filter(requirement => {
    if (!requirement?.name?.trim()) return false;
    if (!viewerRole || !FULL_ACCESS_ROLES.has(viewerRole)) {
      return requirement.provided_by === 'student';
    }
    return true;
  });

  const isEmpty = visibleRequirements.length === 0;

  const groupedRequirements = PROVIDER_ORDER.map(provider => ({
    provider,
    label: PROVIDER_LABELS[provider],
    items: visibleRequirements.filter(req => req.provided_by === provider),
  })).filter(group => group.items.length > 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium">No requirements yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {viewerRole && FULL_ACCESS_ROLES.has(viewerRole)
                ? 'Add training requirements to guide participants.'
                : 'There are no requirements for this course.'}
            </p>
          </div>
        ) : (
          groupedRequirements.map(group => (
            <section key={group.provider} className="space-y-3">

              {/* HEADER */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {group.label}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {group.items.length} requirement{group.items.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* RESPONSIVE GRID */}
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                {group.items.map(requirement => (
                  <div
                    key={requirement.uuid ?? `${group.provider}-${requirement.name}`}
                    className="bg-muted/30 border-border/60 rounded-xl border p-4 space-y-2 min-w-0"
                  >

                    {/* TITLE + BADGE */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold break-words">
                          {requirement.name}
                        </p>
                        <p className="text-muted-foreground text-xs capitalize">
                          {String(requirement.requirement_type ?? 'requirement').replaceAll('_', ' ')}
                        </p>
                      </div>

                      <Badge
                        variant={requirement.is_mandatory ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {requirement.is_mandatory ? 'Mandatory' : 'Optional'}
                      </Badge>
                    </div>

                    {/* QUANTITY */}
                    {(requirement.quantity || requirement.unit) && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Quantity:</span>{' '}
                        {[requirement.quantity, requirement.unit].filter(Boolean).join(' ')}
                      </p>
                    )}

                    {/* DESCRIPTION */}
                    {requirement.description && (
                      <p className="text-muted-foreground text-sm break-words">
                        {requirement.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}