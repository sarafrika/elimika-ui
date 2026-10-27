/** The printable academic report for one learner's programme. */
export function programmeReportPrintHref(programUuid: string, studentUuid: string) {
  return `/programme-report/${programUuid}/${studentUuid}`;
}
