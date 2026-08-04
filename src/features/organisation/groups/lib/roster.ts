import { type ApiDateInput, dayjs } from '@/lib/date';
import type { StudentGroup, StudentGroupRosterEntry } from '@/services/client';

/** Page sizes offered in the roster pagination footer. */
export const PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** A stream (one concrete group) offered inside a tier. */
export type StreamOption = {
  groupUuid: string;
  /** Stream label shown in the dropdown, e.g. "Stream A". */
  label: string;
  /** Branch name, used to disambiguate identical labels across branches. */
  branchName?: string | null;
  memberCount: number;
};

/** One tier pill in the filter rail. */
export type TierOption = {
  uuid: string;
  name: string;
  order: number;
  streams: StreamOption[];
};

/**
 * The label a group contributes to its tier's stream dropdown. Groups created
 * before streams existed have no `group_type`, so fall back to the group name.
 */
export function streamLabelOf(group: StudentGroup): string {
  return group.group_type?.trim() || group.name?.trim() || 'Unnamed group';
}

/**
 * Derive the tier pills from the organisation's groups.
 *
 * The group DTO carries denormalised `tier`, `tier_uuid` and `tier_order`
 * precisely so the rail needs no second fetch, and `tier_order` is what keeps
 * the pills in schooling order — sorting by name gives "Form 1, Grade 10,
 * Kindergarten". Groups with no tier are legacy/unassigned and cannot be
 * filtered server-side, so they get no pill.
 */
export function buildTierOptions(groups: StudentGroup[]): TierOption[] {
  const byTier = new Map<string, TierOption>();

  for (const group of groups) {
    const tierUuid = group.tier_uuid;
    if (!tierUuid) continue;

    let tier = byTier.get(tierUuid);
    if (!tier) {
      tier = {
        uuid: tierUuid,
        name: group.tier?.trim() || 'Untitled level',
        order: group.tier_order ?? Number.MAX_SAFE_INTEGER,
        streams: [],
      };
      byTier.set(tierUuid, tier);
    }

    if (group.uuid) {
      tier.streams.push({
        groupUuid: group.uuid,
        label: streamLabelOf(group),
        branchName: group.branch_name,
        memberCount: Number(group.member_count ?? 0),
      });
    }
  }

  const tiers = [...byTier.values()];
  for (const tier of tiers) {
    // Identical stream labels can appear once per branch; disambiguate those.
    const seen = new Map<string, number>();
    for (const stream of tier.streams) {
      seen.set(stream.label, (seen.get(stream.label) ?? 0) + 1);
    }
    for (const stream of tier.streams) {
      if ((seen.get(stream.label) ?? 0) > 1 && stream.branchName) {
        stream.label = `${stream.label} · ${stream.branchName}`;
      }
    }
    tier.streams.sort((a, b) => a.label.localeCompare(b.label));
  }

  return tiers.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** Age in whole years, derived client-side — the roster API returns only `dob`. */
export function ageFromDob(dob: ApiDateInput): number | null {
  if (dob === null || dob === undefined || dob === '') return null;
  // A date of birth is a calendar date, not an instant: read it in UTC so it
  // never shifts a day across time zones.
  const born = dayjs.utc(dob as string | number | Date);
  if (!born.isValid()) return null;
  const years = dayjs.utc().diff(born, 'year');
  return years >= 0 && years < 150 ? years : null;
}

export function rosterInitials(entry: StudentGroupRosterEntry): string {
  const source = entry.full_name?.trim() || entry.email?.trim() || '';
  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0] ?? '')
    .join('')
    .toUpperCase();
  return initials || '?';
}

export function rosterDisplayName(entry: StudentGroupRosterEntry): string {
  return entry.full_name?.trim() || entry.email?.trim() || 'Student';
}

/**
 * Institution code for the institution-local reference number. Kept identical
 * to the organisation Students page so the same learner shows the same ref on
 * both screens.
 */
export const INSTITUTION_CODE = 'ELM';
