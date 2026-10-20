import { expect, test } from '@playwright/test';
import { CLASS_ID, INSTRUCTOR, LEARNERS, LESSON_ID, mockInstructorWorkbook, SESSION_ID } from '../fixtures/session-report';
import { MockApi } from '../support/api';
import { signIn } from '../support/session';

const SEAT = '00000000-0000-4000-8000-000000000601';
const ATTENDANCE = new RegExp(`^/api/v1/enrollment/${SEAT}/attendance$`);
const RECORD = new RegExp(`^/api/v1/timetable/schedule/${SESSION_ID}/record$`);

test.describe('Instructor · Class register', () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    await signIn(context, INSTRUCTOR, baseURL as string);
    const api = mockInstructorWorkbook(new MockApi())
      .get(new RegExp(`^/api/v1/classes/${CLASS_ID}/enrollments$`), [
        { uuid: SEAT, student_uuid: LEARNERS.amani.uuid, scheduled_instance_uuid: SESSION_ID, status: 'ENROLLED' },
      ])
      .get(RECORD, { instance_uuid: SESSION_ID, topic_covered: '', instructor_remarks: '' })
      .on('PUT', RECORD, request => request.postDataJSON())
      .on('PUT', ATTENDANCE, null);
    await api.install(page);
    test.info().annotations.push({ type: 'api', description: 'mocked' });
    (page as unknown as { api: MockApi }).api = api;
    await page.goto(`/dashboard/instructor/classes/training/${CLASS_ID}?lesson=${LESSON_ID}&schedule=${SESSION_ID}`);
    await page.getByRole('button', { name: 'Full register' }).click();
  });

  test('marking attendance sends the instrument condition and the rich-text comment in the body', async ({ page }) => {
    const api = (page as unknown as { api: MockApi }).api;
    const register = page.getByRole('dialog', { name: 'Class register' });
    await register.getByRole('combobox', { name: 'Instrument condition for Amani Wekesa' }).click();
    // Keyboard choice: the list re-positions while the rich-text editors below it finish loading.
    await expect(page.getByRole('option', { name: 'Needs repair' })).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const comment = register.getByRole('group', { name: 'Comment on Amani Wekesa' }).locator('[contenteditable="true"]');
    await comment.click();
    await comment.pressSequentially('Loose snare');
    await register.getByRole('button', { name: 'Mark present' }).click();

    await expect.poll(() => api.callsTo('PUT', ATTENDANCE).length).toBe(1);
    const body = api.callsTo('PUT', ATTENDANCE)[0]?.body as { attended: boolean; instrument_condition: string; comment: string };
    expect(body.attended).toBe(true);
    expect(body.instrument_condition).toBe('NEEDS_REPAIR');
    expect(body.comment).toContain('<p>Loose snare</p>');
    expect(api.callsTo('PUT', ATTENDANCE)[0]?.search).toBe('');
  });

  test('what was taught saves as rich text', async ({ page }) => {
    const api = (page as unknown as { api: MockApi }).api;
    const register = page.getByRole('dialog', { name: 'Class register' });
    const topic = register.getByRole('group', { name: 'Topic covered' }).locator('[contenteditable="true"]');
    await topic.click();
    await topic.pressSequentially('Paradiddles');
    await register.getByRole('button', { name: 'Save', exact: true }).click();

    await expect.poll(() => api.callsTo('PUT', RECORD).length).toBe(1);
    expect((api.callsTo('PUT', RECORD)[0]?.body as { topic_covered: string }).topic_covered).toContain('<p>Paradiddles</p>');
  });
});
