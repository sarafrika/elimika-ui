import {
  HIRING_STAGES,
  isClassCreatedStatus,
  isExitStatus,
  isLiveApplication,
  stageIndexOf,
  statusLabel,
} from '@/components/profile-job-marketplace/application-status';
import {
  isHiredApplication,
  sessionsPhrase,
} from '@/components/profile-job-marketplace/hired-jobs';
import { type ApiDateInput, parseApiDate } from '@/lib/date';
import type {
  ClassMarketplaceJobApplication,
  ClassMarketplaceJobApplicationEvent,
  ClassMarketplaceJobSummary,
} from '@/services/client';

import type { ReadinessTone } from '../job-readiness';

type Application = ClassMarketplaceJobApplication;
type ApplicationEvent = ClassMarketplaceJobApplicationEvent;

/** Viewer-local dates, parsed the way the API sends them (UTC without a zone designator). */
const local = (value: ApiDateInput) => parseApiDate(value)?.local() ?? null;

/** "Sep 2" */
export const shortDate = (value: ApiDateInput) => local(value)?.format('MMM D') ?? null;

/** "Sep 2, 2026" */
export const longDate = (value: ApiDateInput) => local(value)?.format('MMM D, YYYY') ?? null;

/** "Thu, Oct 1 at 10:00 AM" */
export const dayAndTime = (value: ApiDateInput) =>
  local(value)?.format('ddd, MMM D [at] h:mm A') ?? null;

export const isFuture = (value: ApiDateInput, now = Date.now()) => {
  const date = parseApiDate(value);
  return Boolean(date && date.valueOf() > now);
};

type JobSummary = ClassMarketplaceJobSummary | null | undefined;

export const organisationOf = (job: JobSummary) =>
  job?.organisation_name?.trim() || 'the organisation';

const DELIVERY_LABELS: Record<string, string> = {
  ONLINE: 'Online',
  IN_PERSON: 'In person',
  HYBRID: 'Hybrid',
};

export const deliveryLabel = (job: JobSummary) => DELIVERY_LABELS[job?.location_type ?? ''] ?? null;

/** "Online · meeting link shared when the class is created", "In person · Main Campus" */
export function whereLabel(job: JobSummary) {
  if (job?.location_type === 'ONLINE') {
    return 'Online · meeting link shared when the class is created';
  }
  return [deliveryLabel(job), job?.branch_name].filter(Boolean).join(' · ') || 'To be confirmed';
}

/** "6 sessions · first on Fri, Oct 9 at 6:00 PM" */
export function scheduleLabel(job: JobSummary) {
  const sessions = sessionsPhrase(job?.session_count, '');
  const first = dayAndTime(job?.first_session_start);
  const parts = [sessions, first ? `first on ${first}` : null].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'To be confirmed';
}

/** Live and still with the organisation: hired and class-created rows belong to the Hired tab. */
export const isInProgressApplication = (status?: string | null) =>
  isLiveApplication(status) && !isHiredApplication(status);

export const isClosedApplication = (status?: string | null) => isExitStatus(status);

export function isJobOpen(job?: ClassMarketplaceJobSummary | null) {
  return job?.status === 'open';
}

export function stageTone(status?: string | null): ReadinessTone {
  const key = (status ?? '').toLowerCase();
  if (key === 'offered' || isHiredApplication(key)) return 'success';
  if (isLiveApplication(key)) return 'brand';
  return 'muted';
}

export const stageLabel = statusLabel;

export type TrackerState = 'done' | 'current' | 'upcoming';

/** Five segments for the funnel; a hire fills the whole bar. */
export function trackerStates(status?: string | null): TrackerState[] {
  const index = isClassCreatedStatus(status) ? HIRING_STAGES.length : stageIndexOf(status);
  const hired = isHiredApplication(status);
  return HIRING_STAGES.map((_, position) => {
    if (position < index || (hired && position === index)) return 'done';
    return position === index ? 'current' : 'upcoming';
  });
}

export type NotSelectedReason = 'another-instructor' | 'job-closed';

function reasonFromNote(note: string | null | undefined): NotSelectedReason | null {
  const text = (note ?? '').toLowerCase();
  if (text.includes('another instructor')) return 'another-instructor';
  if (/expired|cancelled|canceled|closed/.test(text)) return 'job-closed';
  return null;
}

/** The backend writes the closing reason into the note; the job status settles anything else. */
export function notSelectedReason(
  note: string | null | undefined,
  job?: ClassMarketplaceJobSummary | null
): NotSelectedReason {
  const fromNote = reasonFromNote(note);
  if (fromNote) return fromNote;
  return job?.status === 'filled' || job?.status === 'awaiting_class'
    ? 'another-instructor'
    : 'job-closed';
}

export type NextStep = { title: string; detail: string | null; emphasis: boolean };

/** When the application closed: the last review stamp, else the last update. */
export const closedAt = (application: Application) =>
  application.reviewed_at ?? application.updated_date ?? null;

/** The Next step column of My applications. */
export function applicationNextStep(application: Application, now = Date.now()): NextStep {
  const job = application.job;
  const org = organisationOf(job);
  const status = (application.status ?? '').toLowerCase();
  const closed = shortDate(closedAt(application));

  switch (status) {
    case 'pending':
      return { title: `Waiting for ${org} to review`, detail: null, emphasis: false };
    case 'shortlisted':
      return {
        title: `Waiting for ${org}`,
        detail: 'They may invite you to an interview',
        emphasis: false,
      };
    case 'interviewing': {
      const when = dayAndTime(application.interview_at);
      if (!when) {
        return {
          title: 'Interview being arranged',
          detail: `${org} will confirm the time`,
          emphasis: false,
        };
      }
      const upcoming = isFuture(application.interview_at, now);
      return {
        title: `Interview on ${when}`,
        detail: upcoming ? 'Keep that time free' : `Waiting for ${org} to decide`,
        emphasis: upcoming,
      };
    }
    case 'offered':
      return {
        title: `${org} is ready to hire you`,
        detail: `${sessionsAre(job?.session_count, 'blocked', 'Your')} the moment they confirm`,
        emphasis: false,
      };
    case 'hired':
      return {
        title: `${org} hired you`,
        detail: 'They are creating the class',
        emphasis: false,
      };
    case 'assigned':
      return { title: 'The class is created', detail: null, emphasis: false };
    case 'rejected':
      return {
        title: 'Not selected for this job',
        detail: closed ? `Closed ${closed}` : null,
        emphasis: false,
      };
    case 'not_selected':
      return {
        title:
          notSelectedReason(application.review_notes, job) === 'another-instructor'
            ? 'Another instructor was hired'
            : 'The job closed',
        detail: closed ? `Closed ${closed}` : null,
        emphasis: false,
      };
    case 'withdrawn':
      return {
        title: closed ? `You withdrew on ${closed}` : 'You withdrew',
        detail: isJobOpen(job) ? 'The job is still open' : null,
        emphasis: false,
      };
    default:
      return { title: statusLabel(status), detail: null, emphasis: false };
  }
}

/** The soonest interview still ahead, for the banner above the table. */
export function soonestInterview(applications: Application[], now = Date.now()) {
  let soonest: Application | null = null;
  for (const application of applications) {
    if (application.status !== 'interviewing' || !isFuture(application.interview_at, now)) continue;
    const at = parseApiDate(application.interview_at)?.valueOf() ?? 0;
    const best = parseApiDate(soonest?.interview_at)?.valueOf() ?? Number.POSITIVE_INFINITY;
    if (at < best) soonest = application;
  }
  return soonest;
}

/** Events from the newest application or reapplication onwards, newest first. */
export function currentCycle(events: ApplicationEvent[]) {
  const start = events.findIndex(
    event => event.event_type === 'applied' || event.event_type === 'reapplied'
  );
  return start === -1 ? events : events.slice(0, start + 1);
}

export type ProgressStep = {
  key: string;
  label: string;
  state: TrackerState | 'reached';
  hint: string | null;
};

const STEP_LABELS = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Hired'] as const;
const STEP_EVENTS: readonly (readonly string[])[] = [
  ['applied', 'reapplied'],
  ['shortlisted'],
  ['interviewing'],
  ['offered'],
  ['hired'],
];

/** The five funnel steps with their dates; a closed application keeps the steps it reached. */
export function progressSteps(application: Application, events: ApplicationEvent[]) {
  const cycle = currentCycle(events);
  const states = trackerStates(application.status);
  const closed = isExitStatus(application.status);
  const eventFor = (types: readonly string[]) =>
    cycle.find(event => types.includes(event.event_type ?? ''));

  return STEP_LABELS.map((label, index): ProgressStep => {
    const event = eventFor(STEP_EVENTS[index] ?? []);
    const reached = Boolean(event) || (index === 0 && Boolean(application.created_date));
    const state = closed ? (reached ? 'reached' : 'upcoming') : (states[index] ?? 'upcoming');

    let hint = shortDate(event?.created_date ?? (index === 0 ? application.created_date : null));
    if (index === 2) {
      const interviewAt = application.interview_at ?? event?.interview_at;
      hint = dayAndTime(interviewAt) ?? hint;
    }
    if (!hint && state === 'upcoming' && !closed) {
      if (index === 3) hint = 'If they choose you';
      if (index === 4) hint = 'Sessions blocked on your calendar';
    }
    return { key: label, label, state, hint };
  });
}

export type EventTone = 'brand' | 'success' | 'warning' | 'muted';

const EVENT_TITLES: Record<string, string> = {
  applied: 'You applied',
  reapplied: 'You applied again',
  shortlisted: 'Shortlisted',
  interviewing: 'Invited to an interview',
  offered: 'Offer made',
  hired: 'You were hired',
  assigned: 'Class created',
  rejected: 'Not selected',
  not_selected: 'Not selected',
  withdrawn: 'You withdrew',
};

const APPLICANT_EVENTS = ['applied', 'reapplied', 'withdrawn'];
const DEFAULT_WITHDRAWAL_NOTE = 'The instructor withdrew this application.';

export type TimelineEntry = {
  key: string;
  title: string;
  date: string | null;
  actor: string | null;
  note: string | null;
  interview: string | null;
  tone: EventTone;
};

export function timelineEntry(event: ApplicationEvent, index: number): TimelineEntry {
  const type = event.event_type ?? '';
  const note = event.note?.trim() || null;
  const tone: EventTone =
    type === 'withdrawn'
      ? 'warning'
      : type === 'rejected' || type === 'not_selected'
        ? 'muted'
        : type === 'hired' || type === 'assigned'
          ? 'success'
          : 'brand';
  let title = EVENT_TITLES[type] ?? statusLabel(type);
  if (type === 'not_selected') {
    const reason = reasonFromNote(note);
    if (reason === 'another-instructor') title = 'Another instructor was hired';
    if (reason === 'job-closed') title = 'The job closed';
  }

  return {
    key: event.uuid ?? `${type}-${index}`,
    title,
    date: longDate(event.created_date),
    actor: APPLICANT_EVENTS.includes(type) ? null : event.actor_name?.trim() || null,
    note: note === DEFAULT_WITHDRAWAL_NOTE ? null : note,
    interview: type === 'interviewing' ? dayAndTime(event.interview_at) : null,
    tone,
  };
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "the 6 sessions are pencilled", "your session is blocked" */
export function sessionsAre(count: number | null | undefined, participle: string, owner = 'the') {
  if (count === 1) return `${owner} session is ${participle}`;
  const number = typeof count === 'number' && count > 1 ? `${count} ` : '';
  return `${owner} ${number}sessions are ${participle}`;
}

export type NoteTone = 'info' | 'success' | 'warning' | 'muted';

export type ApplicationNote = { tone: NoteTone; title: string; body: string };

/** The note under the progress stepper: what happens next, or how the application ended. */
export function applicationNote(
  application: Application,
  events: ApplicationEvent[],
  now = Date.now()
): ApplicationNote {
  const job = application.job;
  const org = organisationOf(job);
  const count = job?.session_count;
  const status = (application.status ?? '').toLowerCase();
  const released = `${releasedSessions(count, 'pencilled', true)}.`;

  switch (status) {
    case 'pending':
      return {
        tone: 'info',
        title: `Next: ${org} reviews your application.`,
        body: `${capitalise(sessionsAre(count, 'pencilled'))} into your calendar while you wait. They become blocked only if you’re hired.`,
      };
    case 'shortlisted':
      return {
        tone: 'info',
        title: 'You’re on the shortlist.',
        body: `${org} may invite you to an interview next.`,
      };
    case 'interviewing': {
      const when = dayAndTime(application.interview_at);
      if (!when) {
        return {
          tone: 'info',
          title: 'You’re invited to an interview.',
          body: `${org} will confirm the time.`,
        };
      }
      return isFuture(application.interview_at, now)
        ? {
            tone: 'info',
            title: `Next: interview on ${when}.`,
            body: `${org} will get in touch with the details. Keep that time free.`,
          }
        : {
            tone: 'info',
            title: `Your interview was on ${when}.`,
            body: `${org} will let you know what they decide.`,
          };
    }
    case 'offered':
      return {
        tone: 'success',
        title: `${org} is ready to hire you.`,
        body: `Once they confirm, ${sessionsAre(count, 'blocked', 'your')} on your calendar.`,
      };
    case 'hired':
      return {
        tone: 'success',
        title: 'You’re hired.',
        body: `${capitalise(sessionsAre(count, 'blocked', 'your'))} on your calendar. ${org} is creating the class.`,
      };
    case 'assigned':
      return {
        tone: 'success',
        title: 'The class is created.',
        body: `${org} created the class, and its sessions are on your calendar.`,
      };
    case 'withdrawn':
      return {
        tone: 'warning',
        title: 'You withdrew this application.',
        body: `${released} ${
          isJobOpen(job)
            ? 'You can apply again while the job is open.'
            : 'The job is no longer taking applications.'
        }`,
      };
    case 'rejected':
      return {
        tone: 'muted',
        title: 'Not selected for this job.',
        body: `${org} decided not to go ahead with your application. ${released}`,
      };
    case 'not_selected': {
      const note =
        events.find(event => event.event_type === 'not_selected')?.note ?? application.review_notes;
      return notSelectedReason(note, job) === 'another-instructor'
        ? { tone: 'muted', title: 'Another instructor was hired.', body: released }
        : { tone: 'muted', title: 'The job closed.', body: released };
    }
    default:
      return { tone: 'muted', title: statusLabel(status), body: '' };
  }
}

/** What the application is doing to the instructor's diary right now. */
export function calendarSummary(application: Application) {
  const count = application.job?.session_count;
  const status = (application.status ?? '').toLowerCase();
  if (status === 'assigned') return 'The class sessions are on your calendar.';
  if (status === 'hired') {
    return `${capitalise(sessionsAre(count, 'blocked'))} on your calendar, so nothing else can be booked into them.`;
  }
  if (isLiveApplication(status)) {
    return `${capitalise(sessionsAre(count, 'pencilled'))} in. They become blocked only if you’re hired, so you can still take bookings for those times.`;
  }
  return `${releasedSessions(count, 'pencilled', true)} from your calendar.`;
}

/** "The 6 pencilled sessions are released", with the count left out when it is unknown. */
export function releasedSessions(
  count: number | null | undefined,
  kind: 'pencilled' | 'blocked',
  past = false
) {
  const one = count === 1;
  const number = typeof count === 'number' && count > 1 ? `${count} ` : '';
  const verb = one ? (past ? 'was' : 'is') : past ? 'were' : 'are';
  return `The ${number}${kind} session${one ? '' : 's'} ${verb} released`;
}
