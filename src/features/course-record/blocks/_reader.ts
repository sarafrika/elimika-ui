/**
 * The reader's shared vocabulary.
 *
 * View models and the content-kind table — the two things the tree, the pane and
 * the rail all speak. Nothing here fetches, and nothing here decides what a
 * viewer may see: that is `COURSE_ACCESS_CAPABILITIES`, which
 * {@link courseReaderLicenceSet} reads rather than re-deciding.
 *
 * Keep it small. Copy tables belong with the block that renders them.
 */

import type { LucideIcon } from 'lucide-react';
import { CircleHelp, FileText, Link as LinkIcon, Mic, Video } from 'lucide-react';

import { type CourseAccess, courseCapability } from '../types';

/* ────────────────────────────────────────────────────────────────────────────
 * Content kinds
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The five content kinds. Deliberately the same five strings the curriculum tab
 * normalises to, so a route can hand the same value to either surface.
 */
export type CourseReaderItemKind = 'video' | 'document' | 'quiz' | 'audio' | 'link';

export interface CourseReaderKindStyle {
  /** Chip copy in the pane header: "Video", "Document", "Quiz". */
  label: string;
  /** Tint for the pane's kind chip. */
  chip: string;
  icon: LucideIcon;
}

/**
 * Content-type tints are the one sanctioned exception to "brand tokens only":
 * they are categorical marks, not brand surfaces, so they stay put while
 * `[data-dashboard-domain]` re-hues `--primary` around them.
 */
export const COURSE_READER_KINDS: Record<CourseReaderItemKind, CourseReaderKindStyle> = {
  video: { label: 'Video', chip: 'bg-chart-2/15 text-chart-2', icon: Video },
  document: { label: 'Document', chip: 'bg-[var(--info)]/10 text-[var(--info)]', icon: FileText },
  quiz: { label: 'Quiz', chip: 'bg-chart-3/20 text-chart-3', icon: CircleHelp },
  audio: { label: 'Audio', chip: 'bg-chart-4/15 text-chart-4', icon: Mic },
  link: { label: 'Link', chip: 'bg-muted text-muted-foreground', icon: LinkIcon },
};

/** Anything unrecognised reads as a document, which is what the artboard does. */
export function courseReaderKind(kind: CourseReaderItemKind | undefined): CourseReaderKindStyle {
  return (kind && COURSE_READER_KINDS[kind]) || COURSE_READER_KINDS.document;
}

/* ────────────────────────────────────────────────────────────────────────────
 * View models
 * ────────────────────────────────────────────────────────────────────────── */

/** One content item — a row in the tree, and the thing the pane renders. */
export interface CourseReaderItem {
  uuid: string;
  title: string;
  kind: CourseReaderItemKind;
  /** Right-hand meta: "18:24", "15 min read", "PDF". */
  length?: string;
  /** Renders the "Required" chip in the pane header. */
  required?: boolean;
}

/**
 * One lesson in the tree.
 *
 * `items` is present only for the lesson the response opened — the tree lists
 * what it was given and never asks for the rest.
 */
export interface CourseReaderLesson {
  uuid: string;
  /** Position in the course; the numbered square. */
  number: number;
  title: string;
  /** Learner only. Drives the completion tick, which no other viewer sees. */
  completed?: boolean;
  items?: readonly CourseReaderItem[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Licence sets
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Which licence the reader states, named the way the capability map already
 * names it — plus `owner`, the one viewer who reads their own material and so
 * carries no licence at all.
 */
export type CourseReaderLicenceSetId = 'owner' | 'admin' | 'trainer' | 'learner';

/**
 * Read off the capability map, never re-derived from the viewer's domain.
 *
 * `null` means this viewer has no licence to state — which for the three gated
 * states is correct, because the content items are not transmitted to them at
 * all and the reader is not a page they can reach.
 */
export function courseReaderLicenceSet(access: CourseAccess): CourseReaderLicenceSetId | null {
  const capability = courseCapability(access);
  // The creator's `licenceSet` is null because they hold no licence: the
  // material is theirs. Everyone else reads under the set the map names.
  return capability.canEdit ? 'owner' : capability.licenceSet;
}
