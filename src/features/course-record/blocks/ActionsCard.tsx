import {
  Calendar,
  Check,
  Download,
  FileText,
  Flag,
  PenLine,
  Send,
  Users,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import {
  type CourseAccess,
  type CourseRailAction,
  type CourseRecordIconName,
  courseCapability,
  fillCourseCopy,
} from '../types';

/**
 * The per-viewer action list that closes the rail.
 *
 * Both the title and the three actions come from the capability map — the
 * creator gets "Creator actions", the applicant "Before you apply" — so this
 * block never asks who is looking. It maps the map's icon slugs to `lucide`
 * components (the map stays JSX-free so server code can import it), fills the
 * labels' `{token}`s, and renders each row as whatever it was given a target
 * for: a link, a button, or plain text when the caller wired neither.
 */

const ACTION_ICONS: Record<CourseRecordIconName, ReactNode> = {
  calendar: <Calendar className='size-[15px]' />,
  check: <Check className='size-[15px]' />,
  document: <FileText className='size-[15px]' />,
  download: <Download className='size-[15px]' />,
  flag: <Flag className='size-[15px]' />,
  pen: <PenLine className='size-[15px]' />,
  send: <Send className='size-[15px]' />,
  users: <Users className='size-[15px]' />,
  video: <Video className='size-[15px]' />,
};

/** An action from the capability map, plus wherever the caller sends it. */
export interface CourseRailActionItem extends CourseRailAction {
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
}

export interface ActionsCardProps {
  /** From the API. Supplies the title and the actions through the capability map. */
  access: CourseAccess;
  /**
   * Fills the labels' tokens: `{pendingApplications}` (creator),
   * `{previousVersion}` (admin) and `{openClasses}` (prospect). An unsupplied
   * token drops out of the label rather than printing itself.
   */
  vars?: Record<string, string | number | null | undefined>;
  /**
   * Overrides the capability map's actions — pass these to add an `href` or an
   * `onSelect`, keeping the map's label and icon.
   */
  actions?: readonly CourseRailActionItem[];
  className?: string;
}

/** 44px on a phone, the artboard's 38px from `md` up. */
const ACTION_ROW =
  'flex h-11 w-full items-center gap-2.5 rounded-[11px] border px-3 text-left text-[13px] font-medium md:h-[38px]';

export function ActionsCard({ access, vars, actions, className }: ActionsCardProps) {
  const capability = courseCapability(access);
  const rows: readonly CourseRailActionItem[] = actions ?? capability.railActions;

  return (
    <Card className={cn('gap-0 px-[18px] py-4', className)}>
      <h3 className='mb-[11px] text-sm font-bold'>{capability.railActionsTitle}</h3>

      <div className='flex flex-col gap-2'>
        {rows.map(action => (
          <ActionRow key={action.label} action={action} vars={vars} />
        ))}
      </div>
    </Card>
  );
}

function ActionRow({
  action,
  vars,
}: {
  action: CourseRailActionItem;
  vars: Record<string, string | number | null | undefined> | undefined;
}) {
  const label = fillCourseCopy(action.label, vars ?? {});
  const body = (
    <>
      <span className='text-muted-foreground inline-flex flex-none' aria-hidden>
        {ACTION_ICONS[action.icon]}
      </span>
      {label}
    </>
  );

  if (action.href && !action.disabled) {
    return (
      <Link href={action.href} className={cn(ACTION_ROW, 'hover:bg-muted/50 transition-colors')}>
        {body}
      </Link>
    );
  }

  if (action.onSelect) {
    return (
      <button
        type='button'
        onClick={action.onSelect}
        disabled={action.disabled}
        className={cn(
          ACTION_ROW,
          'hover:bg-muted/50 transition-colors disabled:pointer-events-none disabled:opacity-50'
        )}
      >
        {body}
      </button>
    );
  }

  // No target: the artboard's row is a statement of what is available, and a
  // dead button would only invite a click that goes nowhere.
  return <div className={cn(ACTION_ROW, action.disabled && 'opacity-50')}>{body}</div>;
}
