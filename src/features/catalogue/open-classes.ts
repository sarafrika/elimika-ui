import { asRecord } from '@/lib/error-utils';

/**
 * `GET /api/v1/courses/{courseUuid}/open-classes` (operationId `getCourseOpenClasses`,
 * anonymous OK): the classes a learner can still join for one course, with the lowest fee.
 *
 * The generated client does not know this endpoint yet. These hand-written types mirror the
 * backend contract field for field (snake_case, as the API sends them), so swapping to the
 * generated types is a rename.
 */
export const courseOpenClassesUrl = (courseUuid: string) =>
  `/api/v1/courses/${encodeURIComponent(courseUuid)}/open-classes`;

export type OpenClassLocationType = 'IN_PERSON' | 'ONLINE' | 'HYBRID';
export type OpenClassSessionFormat = 'GROUP' | 'INDIVIDUAL';
/** Seat availability as a band: the public page never shows seat numbers. */
export type OpenClassAvailability = 'OPEN' | 'FEW_LEFT' | 'FULL';

export type OpenClassSummary = {
  uuid: string;
  title?: string | null;
  location_type?: OpenClassLocationType | null;
  session_format?: OpenClassSessionFormat | null;
  place_name?: string | null;
  area?: string | null;
  fee?: number | null;
  currency_code?: string | null;
  availability?: OpenClassAvailability | null;
  starts_on?: string | null;
  ends_on?: string | null;
  registration_closes_on?: string | null;
  branch_name?: string | null;
};

export type CourseOpenClasses = {
  price_from: number | null;
  currency_code: string | null;
  open_class_count: number;
  classes: OpenClassSummary[];
};

/** What the page shows before the endpoint exists, and when a course has no open class. */
export const NO_OPEN_CLASSES: CourseOpenClasses = {
  price_from: null,
  currency_code: null,
  open_class_count: 0,
  classes: [],
};

const toNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const toText = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null);

const LOCATION_TYPES: readonly OpenClassLocationType[] = ['IN_PERSON', 'ONLINE', 'HYBRID'];
const SESSION_FORMATS: readonly OpenClassSessionFormat[] = ['GROUP', 'INDIVIDUAL'];
const AVAILABILITIES: readonly OpenClassAvailability[] = ['OPEN', 'FEW_LEFT', 'FULL'];

const toEnum = <T extends string>(allowed: readonly T[], value: unknown): T | null => {
  if (typeof value !== 'string') return null;
  const upper = value.toUpperCase();
  return allowed.find(option => option === upper) ?? null;
};

function toOpenClass(value: unknown): OpenClassSummary | null {
  const record = asRecord(value);
  const uuid = toText(record?.uuid);
  if (!record || !uuid) return null;
  return {
    uuid,
    title: toText(record.title),
    location_type: toEnum(LOCATION_TYPES, record.location_type),
    session_format: toEnum(SESSION_FORMATS, record.session_format),
    place_name: toText(record.place_name),
    area: toText(record.area),
    fee: toNumber(record.fee),
    currency_code: toText(record.currency_code),
    availability: toEnum(AVAILABILITIES, record.availability),
    starts_on: toText(record.starts_on),
    ends_on: toText(record.ends_on),
    registration_closes_on: toText(record.registration_closes_on),
    branch_name: toText(record.branch_name),
  };
}

/**
 * The payload out of `ApiResponse<CourseOpenClasses>`, or null when the body is not that
 * shape. Rows that are not classes are dropped rather than trusted. FULL classes are
 * listed but count toward neither `price_from` nor `open_class_count` (the server's rule).
 */
export function toCourseOpenClasses(body: unknown): CourseOpenClasses | null {
  const data = asRecord(asRecord(body)?.data);
  if (!data || !Array.isArray(data.classes)) return null;
  const classes = data.classes.flatMap(row => toOpenClass(row) ?? []);
  return {
    price_from: toNumber(data.price_from),
    currency_code: toText(data.currency_code),
    open_class_count:
      toNumber(data.open_class_count) ??
      classes.filter(item => item.availability !== 'FULL').length,
    classes,
  };
}
