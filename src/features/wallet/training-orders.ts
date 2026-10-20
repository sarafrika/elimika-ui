import type {
  ClassBatchSummary,
  ClassDefinition,
  Course,
  Enrollment,
  RevenueSaleLineItemDto,
  ScheduledInstance,
} from '@/services/client';

export type TrainingWalletRole = 'instructor' | 'course_creator';
export type ClassFinanceMetadata = ClassBatchSummary &
  Partial<
    Pick<
      ClassDefinition,
      | 'rate_basis'
      | 'marketplace_job_uuid'
      | 'instructor_pay'
      | 'location_name'
      | 'scheduled_session_count'
      | 'completed_session_count'
      | 'duration_minutes'
    >
  > & { hasFullDefinition?: boolean };

export type RateRange = { min: number; max: number };

export type TrainingOrder = {
  id: string;
  classUuid: string;
  classTitle: string;
  courseUuid?: string | null;
  course?: Course;
  definition?: ClassFinanceMetadata;
  currency: string;
  students: number | null;
  paidStudents: number | null;
  studentCountSource: 'active' | 'paid' | 'unavailable';
  studentCountComplete: boolean;
  total: number | null;
  pending: number | null;
  refunded: number | null;
  orderCount: number;
  sessions: number | null;
  completedSessions: number | null;
  feePerLesson: number | null;
  feePerLessonRange: RateRange | null;
  hourlyRate: number | null;
  hourlyRateRange: RateRange | null;
  configuredPrice: number | null;
  rateBasis: ClassDefinition['rate_basis'];
  share: number | null;
};

export function finiteAmount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export function orderPaymentState(status?: string) {
  switch (status?.trim().toUpperCase()) {
    case 'CAPTURED':
    case 'COMPLETED':
    case 'PAID':
    case 'SUCCEEDED':
      return 'paid';
    case 'REFUNDED':
      return 'refunded';
    case 'CANCELED':
    case 'CANCELLED':
      return 'cancelled';
    case 'PENDING':
    case 'AWAITING_PAYMENT':
    case 'AUTHORIZED':
    case 'FAILED':
    case 'DECLINED':
      return 'unpaid';
    default:
      return 'unknown';
  }
}

/** Distinct paid learners and their courses across all loaded class sales. */
export function trainingEnrollmentKpis(
  sales: readonly RevenueSaleLineItemDto[],
  salesComplete: boolean,
  courseUuid?: string
) {
  const students = new Set<string>();
  const courses = new Set<string>();
  let studentsComplete = salesComplete;
  let coursesComplete = salesComplete;
  for (const sale of sales) {
    if (courseUuid && sale.course_uuid && sale.course_uuid !== courseUuid) continue;
    if (!sale.class_definition_uuid || !sale.course_uuid) {
      studentsComplete = false;
      coursesComplete = false;
      continue;
    }
    const state = orderPaymentState(sale.payment_status);
    if (state === 'unknown') {
      studentsComplete = false;
      coursesComplete = false;
    }
    if (state !== 'paid') continue;
    courses.add(sale.course_uuid);
    if (sale.student_uuid) students.add(sale.student_uuid);
    else studentsComplete = false;
  }
  return {
    students: students.size,
    courses: courses.size,
    studentsComplete,
    coursesComplete,
  };
}

/** Sum class sale amounts by payment status without repeating lines or whole-cart totals. */
export function trainingOrderKpis(sales: readonly RevenueSaleLineItemDto[], currency: string) {
  const currencyCode = currency.trim().toUpperCase();
  const lines = uniqueSaleLines(
    sales.filter(sale => sale.order_currency_code?.trim().toUpperCase() === currencyCode)
  );
  const statusesAvailable = lines.every(line => orderPaymentState(line.payment_status) !== 'unknown');
  const all = sumAmounts(lines);
  const amount = (state: ReturnType<typeof orderPaymentState>) =>
    statusesAvailable
      ? sumAmounts(lines.filter(line => orderPaymentState(line.payment_status) === state))
      : null;
  return {
    all,
    complete: amount('paid'),
    cancelled: amount('cancelled'),
    incomplete: amount('unpaid'),
    refunds: amount('refunded'),
    totalsAvailable: statusesAvailable && all != null,
  };
}

export function uniqueSaleLines(sales: readonly RevenueSaleLineItemDto[]) {
  const seen = new Set<string>();
  return sales.filter(sale => {
    // Missing line ids cannot safely be deduplicated by price/student: a learner may buy twice.
    if (!sale.line_item_id) return true;
    const key = `${sale.order_id}:${sale.line_item_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sumAmounts(lines: readonly RevenueSaleLineItemDto[]) {
  if (lines.some(line => finiteAmount(line.total) == null)) return null;
  return lines.reduce((sum, line) => sum + (line.total ?? 0), 0);
}

export function revenueShare(course: Course | undefined, role: TrainingWalletRole) {
  if (!course) return null;
  const creator = finiteAmount(course.creator_share_percentage);
  const instructor = finiteAmount(course.instructor_share_percentage);
  if (creator == null || instructor == null || Math.abs(creator + instructor - 100) > 0.01)
    return null;
  return role === 'course_creator' ? creator : instructor;
}

export function sessionHours(session: Pick<ScheduledInstance, 'start_time' | 'end_time'>) {
  const hours =
    (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 3_600_000;
  return Number.isFinite(hours) && hours > 0 ? hours : null;
}

/** Ordinary class pricing defaults to per_hour in the API contract. Marketplace
 * classes must retain the basis carried over from their job. Batch summaries
 * omit both fields, so only a full definition can establish the default safely. */
export function classRateBasis(definition: ClassFinanceMetadata | undefined) {
  return (
    definition?.rate_basis ??
    (definition?.hasFullDefinition && !definition.marketplace_job_uuid ? 'per_hour' : undefined)
  );
}

function rateRange(values: number[]): RateRange | null {
  if (!values.length) return null;
  return values.reduce<RateRange>(
    (range, value) => ({
      min: Math.min(range.min, value),
      max: Math.max(range.max, value),
    }),
    { min: values[0]!, max: values[0]! }
  );
}

export function classRates(
  definition: ClassFinanceMetadata | undefined,
  sessions: readonly ScheduledInstance[]
) {
  const price = finiteAmount(definition?.sale_price);
  const durations = sessions.filter(session => session.status !== 'CANCELLED').map(sessionHours);
  const defaultHours =
    definition?.default_start_time && definition.default_end_time
      ? sessionHours({
        start_time: definition.default_start_time,
        end_time: definition.default_end_time,
      })
      : null;
  const hours = durations.length ? durations : defaultHours != null ? [defaultHours] : [];
  const validHours = hours.filter((value): value is number => value != null);
  const knownHours = hours.length > 0 && validHours.length === hours.length;
  const basis = classRateBasis(definition);
  // The orders listing uses the configured sale price as the hourly rate.
  // Batch summaries may omit rate_basis, so it must not gate this calculation.
  const feePerLessonRange =
    price != null && knownHours
      ? rateRange(validHours.map(duration => price * duration))
      : null;
  const hourlyRateRange = price == null ? null : rateRange([price]);
  return {
    configuredPrice: price,
    rateBasis: basis,
    feePerLesson:
      feePerLessonRange?.min === feePerLessonRange?.max ? (feePerLessonRange?.min ?? null) : null,
    feePerLessonRange,
    hourlyRate:
      hourlyRateRange?.min === hourlyRateRange?.max ? (hourlyRateRange?.min ?? null) : null,
    hourlyRateRange,
  };
}

/** Aggregate all loaded checkouts by class AND currency; never add whole-cart totals. */
export function buildTrainingOrders({
  sales,
  classMap,
  courseMap,
  schedules,
  role,
  schedulesAvailable = true,
  salesComplete = false,
}: {
  sales: readonly RevenueSaleLineItemDto[];
  classMap: Readonly<Record<string, ClassFinanceMetadata>>;
  courseMap: Readonly<Record<string, Course>>;
  schedules: readonly ScheduledInstance[];
  role: TrainingWalletRole;
  schedulesAvailable?: boolean;
  salesComplete?: boolean;
}): TrainingOrder[] {
  const groups = new Map<string, RevenueSaleLineItemDto[]>();
  for (const sale of uniqueSaleLines(sales)) {
    if (!sale.class_definition_uuid || !sale.order_currency_code?.trim()) continue;
    const key = `${sale.class_definition_uuid}:${sale.order_currency_code.trim().toUpperCase()}`;
    const lines = groups.get(key) ?? [];
    lines.push(sale);
    groups.set(key, lines);
  }
  return [...groups].map(([id, lines]) => {
    const first = lines[0]!;
    const classUuid = first.class_definition_uuid!;
    const definition = classMap[classUuid];
    const courseUuid = definition?.course_uuid ?? first.course_uuid;
    const course = courseUuid ? courseMap[courseUuid] : undefined;
    const instances = schedules.filter(
      session => session.class_definition_uuid === classUuid && session.status !== 'CANCELLED'
    );
    const paid = lines.filter(line => orderPaymentState(line.payment_status) === 'paid');
    const unknown = lines.some(line => orderPaymentState(line.payment_status) === 'unknown');
    const activeStudents =
      definition?.enrolled_count == null ? null : finiteAmount(Number(definition.enrolled_count));
    const paidStudents = paid.every(line => Boolean(line.student_uuid))
      ? new Set(paid.map(line => line.student_uuid)).size
      : null;
    const students = activeStudents ?? paidStudents;
    const studentCountSource =
      activeStudents != null ? 'active' : paidStudents != null ? 'paid' : 'unavailable';
    const rates = classRates(definition, instances);

    return {
      id,
      classUuid,
      classTitle: definition?.title || first.title || 'Class details unavailable',
      courseUuid,
      course,
      definition,
      currency: first.order_currency_code!.trim().toUpperCase(),
      students,
      paidStudents,
      studentCountSource,
      studentCountComplete:
        studentCountSource === 'active' || (studentCountSource === 'paid' && salesComplete),
      total: unknown ? null : sumAmounts(paid),
      pending: sumAmounts(
        lines.filter(line => orderPaymentState(line.payment_status) === 'unpaid')
      ),
      refunded: sumAmounts(
        lines.filter(line => orderPaymentState(line.payment_status) === 'refunded')
      ),
      orderCount: new Set(lines.flatMap(line => (line.order_id ? [line.order_id] : []))).size,
      sessions: schedulesAvailable
        ? instances.length
        : definition?.scheduled_session_count == null
          ? null
          : Number(definition.scheduled_session_count),
      completedSessions: schedulesAvailable
        ? instances.filter(session => session.status === 'COMPLETED').length
        : definition?.completed_session_count == null
          ? null
          : Number(definition.completed_session_count),
      ...rates,
      share: revenueShare(course, role),
    };
  });
}

export function activeEnrollment(enrollment: Enrollment) {
  return (
    enrollment.status === 'ENROLLED' ||
    enrollment.status === 'ATTENDED' ||
    enrollment.status === 'ABSENT'
  );
}

/** Estimates use confirmed attendance and capped actual teaching time; settlement remains server-owned. */
export function lessonEarnings({
  session,
  definition,
  course,
  enrollments,
  role,
  attendanceAvailable,
}: {
  session: ScheduledInstance;
  definition: ClassDefinition;
  course?: Course;
  enrollments: readonly Enrollment[];
  role: TrainingWalletRole;
  attendanceAvailable: boolean;
}) {
  const hours = sessionHours(session);
  const actualHours =
    session.started_at && session.concluded_at
      ? sessionHours({ start_time: session.started_at, end_time: session.concluded_at })
      : null;
  const registrations = enrollments.filter(
    enrollment =>
      enrollment.scheduled_instance_uuid === session.uuid && activeEnrollment(enrollment)
  );
  const byStudent = new Map(registrations.map(enrollment => [enrollment.student_uuid, enrollment]));
  const students = [...byStudent.values()];
  const attendanceComplete =
    attendanceAvailable &&
    students.every(
      enrollment => enrollment.status === 'ATTENDED' || enrollment.status === 'ABSENT'
    );
  const attended = attendanceComplete
    ? students.filter(enrollment => enrollment.status === 'ATTENDED').length
    : null;
  const price = finiteAmount(definition.sale_price);
  const basis = classRateBasis({ ...definition, hasFullDefinition: true });
  const fee =
    price == null
      ? null
      : basis === 'per_session'
        ? price
        : basis === 'per_hour' && hours != null
          ? price * hours
          : null;
  const share = revenueShare(course, role);
  const completion = hours != null && actualHours != null ? Math.min(1, actualHours / hours) : null;
  const gross = fee != null && attended != null ? fee * attended : null;
  const cancelled = session.status === 'CANCELLED';
  const earnedGross = cancelled
    ? 0
    : session.status !== 'COMPLETED' || gross == null || completion == null
      ? null
      : gross * completion;
  // An employed instructor's agreed session pay is separate from the organisation's course share.
  const employed = role === 'instructor' && Boolean(definition.organisation_uuid);
  const instructorPay = finiteAmount(definition.instructor_pay);
  const payable = cancelled
    ? 0
    : employed
      ? session.status === 'COMPLETED' && instructorPay != null
        ? instructorPay
        : null
      : earnedGross != null && share != null
        ? (earnedGross * share) / 100
        : null;
  return {
    hours,
    actualHours,
    attended,
    enrolled: attendanceAvailable ? students.length : null,
    fee,
    gross,
    earnedGross,
    share,
    payable,
    employed,
  };
}
