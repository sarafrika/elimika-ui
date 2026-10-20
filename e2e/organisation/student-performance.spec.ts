import { expect, test } from '@playwright/test';
import { ADMIN, COURSE, ENROLMENT, mockOrganisationSession, ORG, STUDENTS } from '../fixtures/organisation';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const amani = STUDENTS.amani;

test('the school sees a learner’s submitted grades read-only, never drafts', async ({ page, context, baseURL }) => {
  await signIn(context, ADMIN, baseURL as string);
  const api = mockOrganisationSession(new MockApi())
    .get(new RegExp(`^/api/v1/students/${amani.uuid}$`), amani)
    .get(new RegExp(`^/api/v1/enrollment/organisations/${ORG}/student-summaries$`), [
      { student_uuid: amani.uuid, user_uuid: amani.user_uuid, total: 1, completed: 0 },
    ])
    .get(new RegExp(`^/api/v1/enrollment/organisations/${ORG}/students/${amani.uuid}/performance$`), [])
    .get(new RegExp(`^/api/v1/courses/enrollments/students/${amani.uuid}$`), paged([
      { enrollment_uuid: ENROLMENT, course_uuid: COURSE, course_name: 'Violin Foundations', enrollment_status: 'ACTIVE' },
    ]))
    .get(new RegExp(`^/api/v1/courses/${COURSE}/gradebook/enrollments/${ENROLMENT}/progress-report$`), {
      course_name: 'Violin Foundations',
      final_grade: 91,
      final_grade_label: 'Distinction',
      result_status: 'IN_PROGRESS',
      lessons: [
        { lesson_uuid: 'l1', lesson_number: 1, lesson_title: 'Posture and hold', attendance: 'ATTENDED', marks: [{ status: 'graded', score: 27, max_score: 30 }] },
        // A draft mark arrives without a score; the school must never see a number for it.
        { lesson_uuid: 'l2', lesson_number: 2, lesson_title: 'Bowing', attendance: 'ATTENDED', marks: [{ status: 'draft', score: 12, max_score: 30 }] },
      ],
    });
  await api.install(page);
  await page.goto(`/dashboard/organisation/students/${amani.uuid}?tab=performance`);

  const grades = page.getByRole('region', { name: 'Grades' });
  await expect(grades).toContainText('the school cannot change them');
  await expect(grades).toContainText('Violin Foundations');
  await expect(grades).toContainText('27 / 30');
  await expect(grades).not.toContainText('12 / 30');
  await expect(grades.getByRole('button', { name: /feedback|edit|regrade/i })).toHaveCount(0);
  await expect(grades.locator('textarea, [contenteditable="true"]')).toHaveCount(0);
  expect(api.callsTo('POST', /feedback|grade/)).toHaveLength(0);
});
