import assert from 'node:assert/strict';
import test from 'node:test';
import type { UserNotification } from '@/services/notifications';
import { getNotificationUrlPath } from './dashboard-notifications';

const note = (type: string, action_url: string, metadata: Record<string, string> = {}) =>
  ({ type, action_url, metadata }) as unknown as UserNotification;

test('payment receipts fall through to the role’s normalised transactions page', () => {
  const receipt = note('ORDER_PAYMENT_RECEIPT', '/dashboard/transactions');
  assert.equal(getNotificationUrlPath(receipt, 'student'), '/dashboard/student/wallet');
  assert.equal(getNotificationUrlPath(receipt, 'organisation'), '/dashboard/organisation/revenue');
});

test('non-student class reminders use the normalised action url', () => {
  const reminder = note('UPCOMING_CLASS_REMINDER', '/dashboard/classes/c1', {
    class_definition_uuid: 'c1',
  });
  assert.equal(
    getNotificationUrlPath(reminder, 'instructor'),
    '/dashboard/instructor/classes/class-training/c1'
  );
  assert.equal(
    getNotificationUrlPath(reminder, 'organisation_user'),
    '/dashboard/organisation/classes?highlight=c1'
  );
});
