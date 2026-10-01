'use client';

import { BookOpen, Check, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  type CoursePageModel,
  type RequirementRow,
  requirementMeta,
  splitRequirementName,
} from '@/src/features/catalogue/course-page';

function PanelCard({
  title,
  hint,
  className,
  children,
}: {
  title: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'bg-card flex min-w-0 flex-col gap-3.5 rounded-[14px] border px-5 py-5 sm:px-[22px]',
        className
      )}
    >
      <div className='flex flex-col gap-0.5'>
        <h2 className='text-[17px] font-semibold'>{title}</h2>
        {hint ? <span className='text-muted-foreground text-[13px]'>{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

/* Overview --------------------------------------------------------------------------- */

const lessonsPhrase = (model: CoursePageModel) => {
  const count = model.lessons.length;
  const parts = [`${count} ${count === 1 ? 'lesson' : 'lessons'}`];
  if (model.durationHours) parts.push(`${model.durationHours} hours`);
  else if (model.durationLabel) parts.push(model.durationLabel);
  return parts.join(' · ');
};

export function OverviewPanel({
  model,
  provided,
}: {
  model: CoursePageModel;
  provided: readonly RequirementRow[];
}) {
  // Only what the record states: the platform's certificate, the syllabus and the kit.
  const walkAway = [
    {
      title: 'A certificate',
      detail: 'Issued on completion and verifiable from your profile.',
    },
    ...(model.lessons.length > 0
      ? [{ title: lessonsPhrase(model), detail: 'Every lesson is listed in the syllabus.' }]
      : []),
    ...(provided.length > 0
      ? [
          {
            title: 'Kit and space provided',
            detail: provided
              .slice(0, 3)
              .map(row => splitRequirementName(row.name).title)
              .join(', ')
              .concat(provided.length > 3 ? `, and ${provided.length - 3} more.` : '.'),
          },
        ]
      : []),
  ];

  return (
    <div className='grid items-start gap-[18px] lg:grid-cols-3'>
      {model.descriptionHtml ? (
        <PanelCard title='About this course' className='lg:col-span-2'>
          <HTMLTextPreview
            htmlContent={model.descriptionHtml}
            className='text-foreground/85 max-w-prose text-[15px] leading-6'
          />
        </PanelCard>
      ) : null}

      <section
        className={cn(
          'border-success/30 bg-success/5 flex min-w-0 flex-col gap-3 rounded-[14px] border px-5 py-5 sm:px-[22px]',
          !model.descriptionHtml && 'lg:col-start-3'
        )}
      >
        <h2 className='text-[17px] font-semibold'>What you walk away with</h2>
        {walkAway.map(item => (
          <div key={item.title} className='flex gap-2.5 text-sm leading-5'>
            <Check className='text-success mt-px size-[18px] shrink-0' aria-hidden />
            <span>
              <b className='font-semibold'>{item.title}</b>
              <br />
              <span className='text-muted-foreground'>{item.detail}</span>
            </span>
          </div>
        ))}
      </section>

      {model.objectives.length > 0 ? (
        <PanelCard title="What you'll learn" className='lg:col-span-2'>
          <ul className='grid gap-x-7 gap-y-3 sm:grid-cols-2'>
            {model.objectives.map(line => (
              <li key={line} className='flex max-w-prose gap-2.5 text-sm leading-[21px]'>
                <Check className='text-primary mt-px size-[18px] shrink-0' aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </PanelCard>
      ) : null}

      {model.prerequisites.length > 0 ? (
        <PanelCard title='Before you start'>
          <ul className='text-foreground/85 flex max-w-prose list-disc flex-col gap-2 pl-[18px] text-sm leading-[21px]'>
            {model.prerequisites.map(line => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </PanelCard>
      ) : null}
    </div>
  );
}

/* Requirements ----------------------------------------------------------------------- */

function RequirementList({ rows, empty }: { rows: readonly RequirementRow[]; empty: string }) {
  if (rows.length === 0) {
    return <p className='text-muted-foreground text-sm'>{empty}</p>;
  }
  return (
    <ul className='grid [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-2.5'>
      {rows.map((row, index) => {
        const { title, detail } = splitRequirementName(row.name);
        const meta = requirementMeta(row);
        const mandatory = row.is_mandatory !== false;
        return (
          <li
            key={`${title}-${index}`}
            className='flex items-start gap-3 rounded-xl border px-3.5 py-3'
          >
            <div className='flex min-w-0 grow flex-col gap-0.5'>
              <span className='text-sm font-semibold'>{title}</span>
              {detail ? <span className='text-muted-foreground text-[13px]'>{detail}</span> : null}
              {meta ? <span className='text-muted-foreground text-xs'>{meta}</span> : null}
            </div>
            <span
              className={cn(
                'inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[11px] font-bold tracking-[0.06em] uppercase',
                mandatory ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
              )}
            >
              {mandatory ? 'Required' : 'Optional'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function RequirementsPanel({
  provided,
  bring,
}: {
  provided: readonly RequirementRow[];
  bring: readonly RequirementRow[];
}) {
  if (provided.length === 0 && bring.length === 0) {
    return (
      <EmptyState
        variant='card'
        title='No requirements listed'
        description='The course creator has not listed any equipment, materials or space for this course.'
      />
    );
  }
  return (
    <div className='grid items-start gap-[18px] xl:grid-cols-2'>
      <PanelCard
        title='Provided by the training provider'
        hint='What every class venue must have ready.'
      >
        <RequirementList rows={provided} empty='Nothing listed for the training provider.' />
      </PanelCard>
      <PanelCard title='Bring yourself' hint='What each learner brings to class.'>
        <RequirementList rows={bring} empty='Nothing to bring: everything is provided.' />
      </PanelCard>
    </div>
  );
}

/* Syllabus --------------------------------------------------------------------------- */

export function SyllabusPanel({ model }: { model: CoursePageModel }) {
  if (model.lessons.length === 0) {
    return (
      <EmptyState
        variant='card'
        icon={BookOpen}
        title='No lessons published yet'
        description='The syllabus appears here once the course creator publishes its lessons.'
      />
    );
  }
  return (
    <div className='flex flex-col gap-3.5'>
      <div className='border-primary/20 bg-primary/5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-sm'>
        <Lock className='text-primary size-[18px] shrink-0' aria-hidden />
        <span className='min-w-0 grow basis-64'>
          Every lesson title and objective is listed so you know what you are buying. Lesson
          material opens when your enrolment is confirmed.
        </span>
        <span className='text-muted-foreground text-[13px]'>{lessonsPhrase(model)}</span>
      </div>
      <ol className='grid [grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))] gap-3.5'>
        {model.lessons.map(lesson => (
          <li
            key={`${lesson.number}-${lesson.title}`}
            className='bg-card flex items-start gap-3.5 rounded-[14px] border p-4'
          >
            <span className='bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-[10px] font-mono text-sm font-semibold'>
              {lesson.number}
            </span>
            <div className='flex min-w-0 flex-col gap-1'>
              <h3 className='text-[15px] font-semibold'>{lesson.title}</h3>
              {lesson.objective ? (
                <p className='text-muted-foreground line-clamp-3 text-[13px] leading-[19px]'>
                  {lesson.objective}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
