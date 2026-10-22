import { expect, test } from '@playwright/test';
import {
  CLASS_ID,
  COURSE_ID,
  INSTRUCTOR,
  LEARNERS,
  mockInstructorWorkbook,
} from '../fixtures/session-report';
import { MockApi, paged } from '../support/api';
import { signIn } from '../support/session';

const REPORT = new RegExp(`^/api/v1/timetable/classes/${CLASS_ID}/report$`);
test('the class report totals graded assessments per lesson, skips missing scores and exports the same totals', async ({
  page,
  context,
  baseURL,
}) => {
  await signIn(context, INSTRUCTOR, baseURL as string);
  const api = mockInstructorWorkbook(new MockApi())
    .get(REPORT, {
      class_definition_uuid: CLASS_ID,
      class_title: 'Drums D4',
      sessions: [
        {
          instance_uuid: 'i1',
          lesson_number: 1,
          start_time: '2026-10-05T07:00:00Z',
          report_status: 'submitted',
          class_average: 27.5,
          max_score: 30,
        },
        {
          instance_uuid: 'i2',
          lesson_number: 2,
          start_time: '2026-10-12T07:00:00Z',
          report_status: 'draft',
          overdue: true,
          max_score: 30,
        },
      ],
      students: [
        {
          student_uuid: LEARNERS.amani.uuid,
          cells: [
            { instance_uuid: 'i1', attendance: 'ATTENDED', score_status: 'submitted', score: 27.5 },
            { instance_uuid: 'i2', attendance: 'ATTENDED', score_status: 'draft', score: 21 },
          ],
          average: 27.5,
          average_percentage: 91.67,
          band: 'Merit',
        },
        {
          student_uuid: LEARNERS.brian.uuid,
          cells: [{ instance_uuid: 'i1', attendance: 'ABSENT', score_status: 'none' }],
          band: null,
        },
      ],
    })
    .get(/^\/api\/v1\/courses\/lessons$/, [
      { uuid: 'lesson-1', course_uuid: COURSE_ID, lesson_number: 1, title: 'Lesson 1' },
      { uuid: 'lesson-2', course_uuid: COURSE_ID, lesson_number: 2, title: 'Lesson 2' },
    ])
    .get(/^\/api\/v1\/classes\/assessment-schedules$/, {
      assignment_schedules: [
        {
          lesson_uuid: 'lesson-1',
          assignment_uuid: 'assignment-1',
          class_definition_uuid: CLASS_ID,
        },
        {
          lesson_uuid: 'lesson-1',
          assignment_uuid: 'assignment-2',
          class_definition_uuid: CLASS_ID,
        },
        {
          lesson_uuid: 'lesson-2',
          assignment_uuid: 'assignment-3',
          class_definition_uuid: CLASS_ID,
        },
      ],
      quiz_schedules: [
        { lesson_uuid: 'lesson-1', quiz_uuid: 'quiz-1', class_definition_uuid: CLASS_ID },
        { lesson_uuid: 'lesson-1', quiz_uuid: 'quiz-2', class_definition_uuid: CLASS_ID },
      ],
    })
    .get(
      new RegExp(`^/api/v1/courses/${COURSE_ID}/enrollments$`),
      paged([
        {
          uuid: 'enrollment-a',
          student_uuid: LEARNERS.amani.uuid,
          course_uuid: COURSE_ID,
          status: 'ACTIVE',
        },
        {
          uuid: 'enrollment-b',
          student_uuid: LEARNERS.brian.uuid,
          course_uuid: COURSE_ID,
          status: 'ACTIVE',
        },
      ])
    )
    .get(new RegExp(`^/api/v1/courses/${COURSE_ID}/grade-bands$`), [
      { name: 'Merit', min_percentage: 80 },
      { name: 'Pass', min_percentage: 70 },
    ])
    .get(
      /^\/api\/v1\/assignments\/submissions\/search$/,
      paged([
        {
          enrollment_uuid: 'enrollment-a',
          assignment_uuid: 'assignment-1',
          status: 'GRADED',
          score: 10,
          max_score: 20,
        },
        {
          enrollment_uuid: 'enrollment-a',
          assignment_uuid: 'assignment-2',
          status: 'GRADED',
          score: 15,
          max_score: 20,
        },
        {
          enrollment_uuid: 'enrollment-a',
          assignment_uuid: 'assignment-3',
          status: 'GRADED',
          score: 18,
          max_score: 20,
        },
      ])
    )
    .get(
      /^\/api\/v1\/quizzes\/attempts\/search$/,
      paged([
        {
          enrollment_uuid: 'enrollment-a',
          quiz_uuid: 'quiz-1',
          status: 'GRADED',
          score: 5,
          max_score: 10,
        },
        { enrollment_uuid: 'enrollment-a', quiz_uuid: 'quiz-2', status: 'GRADED' },
      ])
    );
  await api.install(page);
  await page.goto(`/dashboard/instructor/training-hub/classes/${CLASS_ID}/report`);

  const grid = page.getByTestId('class-report');
  const amani = grid.getByRole('row', { name: /Amani Wekesa/ });
  await expect(amani).toContainText('30 / 50');
  await expect(amani).toContainText('18 / 20');
  await expect(amani).toContainText('75%');
  await expect(amani).toContainText('Pass');
  await expect(amani).not.toContainText('21*');
  await expect(grid.getByRole('row', { name: /Class average/ })).toContainText('30 / 50');
  await expect(grid.getByRole('row', { name: /Brian Otieno/ })).toContainText('Absent');
  await expect(grid.getByText('Overdue')).toBeVisible();

  const download = page.waitForEvent('download');
  await grid.getByRole('button', { name: 'CSV' }).click();
  expect((await download).suggestedFilename()).toBe('Drums D4-report.csv');
  const stream = await (await download).createReadStream();
  if (!stream) throw new Error('The CSV download could not be read.');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString('utf8');
  expect(csv).toContain('30 / 50');
  expect(csv).toContain('18 / 20');
  expect(csv).toContain('75%');
  expect(csv).toContain('Pass');
  // Grade requests are batched across the entire grid, never one per learner or lesson.
  expect(api.callsTo('GET', /^\/api\/v1\/assignments\/submissions\/search$/)).toHaveLength(1);
  expect(api.callsTo('GET', /^\/api\/v1\/quizzes\/attempts\/search$/)).toHaveLength(1);
});
