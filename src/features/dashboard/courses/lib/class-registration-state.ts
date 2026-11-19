type ClassRegistrationDates = {
  registrationStart?: Date | string | null;
  registrationEnd?: Date | string | null;
  endsAt?: Date | string | null;
  endStateKnown: boolean;
  completed?: boolean;
};

/** Derive registration eligibility together so its message and action always agree. */
export function classRegistrationState(
  { registrationStart, registrationEnd, endsAt, endStateKnown, completed }: ClassRegistrationDates,
  now = new Date()
) {
  const start = registrationStart ? new Date(registrationStart) : null;
  const end = registrationEnd ? new Date(registrationEnd) : null;
  const classEnd = endsAt ? new Date(endsAt) : null;
  const isRegistrationPeriodUndefined = !start && !end;
  const isRegistrationOngoing =
    !isRegistrationPeriodUndefined && (!start || now >= start) && (!end || now <= end);
  const isClassEnded = Boolean(completed) || (classEnd !== null && now >= classEnd);
  const registrationAllowsEntry =
    !isClassEnded && (isRegistrationOngoing || isRegistrationPeriodUndefined);

  return {
    isRegistrationOngoing,
    isRegistrationPeriodUndefined,
    isClassEnded,
    // Opening the review page performs no enrollment. Its schedule and the
    // server validate enrollment; an unresolved listing request must not trap
    // the learner behind a disabled navigation link until a refresh.
    canViewEnrollment: registrationAllowsEntry,
    canEnrollClass: endStateKnown && registrationAllowsEntry,
  };
}
