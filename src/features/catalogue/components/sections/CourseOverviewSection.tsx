import { Briefcase, Check, FileText, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CourseTrainingRequirement,
  ProvidedByEnum,
  RequirementTypeEnum2,
} from '@/services/client';
import { sanitizeRichText, toBulletLines } from '@/src/features/catalogue/format';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';
import { SectionCard, SectionHeading } from './RecordSurfaces';

/**
 * The overview region of the public course record: **About this course**, the
 * **What you'll learn / Prerequisites** pair, and **Training requirements**
 * grouped by who has to provide them.
 *
 * The same three regions the record view's overview tab stacks, in the same
 * order and at the same measurements. There are no tabs here — the public page
 * is server-rendered so a crawler and a first paint both get the whole record —
 * so the regions stack down the body column instead.
 */

/** Who has to bring a training requirement, in the order the section groups them. */
const REQUIREMENT_PROVIDER_ORDER: readonly ProvidedByEnum[] = [
  'organisation',
  'instructor',
  'course_creator',
  'student',
];

/** Reads into "Provided by …". */
const REQUIREMENT_PROVIDER_LABELS: Record<ProvidedByEnum, string> = {
  organisation: 'the training provider',
  instructor: 'the instructor',
  course_creator: 'the course creator',
  student: 'the learner',
};

const REQUIREMENT_TYPE_LABELS: Record<RequirementTypeEnum2, string> = {
  material: 'Material',
  equipment: 'Equipment',
  facility: 'Facility',
  other: 'Other',
};

export function CourseOverviewSection({ detail }: { detail: PublicCourseDetail }) {
  const { course } = detail;

  const description = sanitizeRichText(course.description);
  const objectives = toBulletLines(course.objectives);
  const prerequisites = toBulletLines(course.prerequisites);
  const groups = groupRequirements(course.training_requirements);

  return (
    <>
      <SectionCard>
        <SectionHeading icon={<Sparkles className='size-4' />}>About this course</SectionHeading>
        {description ? (
          /* The creator's rich text, stripped of scripts, inline handlers and
             javascript: URLs by `sanitizeRichText` and injected on the server so
             a crawler reads the description in the delivered HTML. */
          <div
            className='text-foreground/80 mt-2.5 text-sm leading-[1.65]'
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : (
          <p className='text-muted-foreground mt-2.5 text-sm leading-[1.65]'>
            The creator has not written a description for this course yet.
          </p>
        )}
      </SectionCard>

      {objectives.length > 0 || prerequisites.length > 0 ? (
        <div className='grid gap-[18px] md:grid-cols-2'>
          {objectives.length > 0 ? (
            <SectionCard>
              <SectionHeading icon={<Target className='size-4' />} className='mb-3'>
                What you&apos;ll learn
              </SectionHeading>
              <ul className='flex flex-col gap-[9px]'>
                {objectives.map(line => (
                  <li
                    key={line}
                    className='text-foreground/80 flex gap-[9px] text-[13px] leading-[1.5]'
                  >
                    <Check
                      className='text-success mt-0.5 size-[15px] flex-none stroke-[2.5]'
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {prerequisites.length > 0 ? (
            <SectionCard>
              <SectionHeading icon={<FileText className='size-4' />} className='mb-3'>
                Prerequisites
              </SectionHeading>
              <ul className='flex flex-col gap-[9px]'>
                {prerequisites.map(line => (
                  <li
                    key={line}
                    className='text-foreground/80 flex gap-[9px] text-[13px] leading-[1.5]'
                  >
                    <span
                      className='bg-muted-foreground/70 mt-[7px] size-[5px] flex-none rounded-full'
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </div>
      ) : null}

      {groups.length > 0 ? (
        <SectionCard>
          <div className='mb-1 flex flex-wrap items-center justify-between gap-3'>
            <SectionHeading icon={<Briefcase className='size-4' />}>
              Training requirements
            </SectionHeading>
            <span className='text-muted-foreground text-xs'>What a delivery site must provide</span>
          </div>

          <div className='mt-3 flex flex-col gap-4'>
            {groups.map(group => (
              <div key={group.key}>
                <div className='text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.06em] uppercase'>
                  {group.heading}
                </div>
                <div className='grid gap-2.5 sm:grid-cols-2'>
                  {group.items.map((requirement, index) => (
                    <RequirementCard
                      key={requirement.uuid ?? `${group.key}-${index}`}
                      requirement={requirement}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </>
  );
}

function RequirementCard({ requirement }: { requirement: CourseTrainingRequirement }) {
  const mandatory = requirement.is_mandatory === true;
  const type = REQUIREMENT_TYPE_LABELS[requirement.requirement_type];
  const quantity = formatQuantity(requirement.quantity, requirement.unit);
  const meta = [type, quantity].filter(Boolean).join(' · ');

  return (
    <div className='rounded-lg border px-[13px] py-[11px]'>
      <div className='flex items-center justify-between gap-2'>
        <span className='min-w-0 truncate text-[13px] font-semibold'>{requirement.name}</span>
        <span
          className={cn(
            'flex-none rounded-[8px] px-[7px] py-0.5 text-[10px] font-bold tracking-[0.04em] uppercase',
            mandatory ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
          )}
        >
          {mandatory ? 'Mandatory' : 'Optional'}
        </span>
      </div>
      {meta ? <div className='text-muted-foreground mt-1 text-xs'>{meta}</div> : null}
      {requirement.description ? (
        <div className='text-muted-foreground mt-1 text-xs leading-[1.5]'>
          {requirement.description}
        </div>
      ) : null}
    </div>
  );
}

interface RequirementGroup {
  key: string;
  heading: string;
  items: CourseTrainingRequirement[];
}

/**
 * Group by `provided_by`, in {@link REQUIREMENT_PROVIDER_ORDER}, with the rows
 * that name no provider last under their own heading.
 */
function groupRequirements(
  requirements: readonly CourseTrainingRequirement[] | null | undefined
): RequirementGroup[] {
  if (!requirements || requirements.length === 0) return [];

  const buckets = new Map<string, CourseTrainingRequirement[]>();
  for (const requirement of requirements) {
    const key = requirement.provided_by ?? 'unstated';
    const bucket = buckets.get(key);
    if (bucket) bucket.push(requirement);
    else buckets.set(key, [requirement]);
  }

  const groups: RequirementGroup[] = [];
  for (const provider of REQUIREMENT_PROVIDER_ORDER) {
    const items = buckets.get(provider);
    if (!items) continue;
    groups.push({
      key: provider,
      heading: `Provided by ${REQUIREMENT_PROVIDER_LABELS[provider]}`,
      items,
    });
  }

  const unstated = buckets.get('unstated');
  if (unstated) groups.push({ key: 'unstated', heading: 'Provider not stated', items: unstated });

  return groups;
}

/** "2 units", "1 per learner", or nothing when no quantity was given. */
function formatQuantity(quantity: number | undefined, unit: string | undefined): string {
  if (quantity === undefined) return unit ?? '';
  if (unit) return `${quantity} ${unit}`;
  return `${quantity} ${quantity === 1 ? 'unit' : 'units'}`;
}
