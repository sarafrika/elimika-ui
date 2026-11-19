import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classRegistrationState } from './class-registration-state';

const now = new Date('2026-11-19T12:00:00Z');
const future = '2026-12-01T12:00:00Z';
const past = '2026-11-01T12:00:00Z';

test('an open class is immediately enrollable without an effect setting flags', () => {
  const state = classRegistrationState({ endStateKnown: true, endsAt: future }, now);
  assert.equal(state.isRegistrationPeriodUndefined, true);
  assert.equal(state.canEnrollClass, true);
});

test('a registration deadline without a start date is still an open window', () => {
  const state = classRegistrationState(
    {
      endStateKnown: true,
      endsAt: future,
      registrationEnd: future,
    },
    now
  );
  assert.equal(state.isRegistrationOngoing, true);
  assert.equal(state.canEnrollClass, true);
});

test('upcoming and expired registration windows cannot be joined', () => {
  for (const dates of [{ registrationStart: future }, { registrationEnd: past }]) {
    const state = classRegistrationState({ ...dates, endStateKnown: true, endsAt: future }, now);
    assert.equal(state.isRegistrationOngoing, false);
    assert.equal(state.canEnrollClass, false);
  }
});

test('ended or completed classes remain closed regardless of registration dates', () => {
  for (const dates of [{ endsAt: past }, { completed: true, endsAt: future }]) {
    const state = classRegistrationState({ ...dates, endStateKnown: true }, now);
    assert.equal(state.isClassEnded, true);
    assert.equal(state.canEnrollClass, false);
  }
});

test('an undated class waits for its schedule, then becomes enrollable as soon as it is known', () => {
  assert.equal(classRegistrationState({ endStateKnown: false }, now).canEnrollClass, false);
  assert.equal(
    classRegistrationState({ endStateKnown: true, endsAt: future }, now).canEnrollClass,
    true
  );
});

test('a cold listing can open enrollment review before its schedule resolves', () => {
  const firstVisit = classRegistrationState({ endStateKnown: false }, now);
  assert.equal(firstVisit.canViewEnrollment, true);
  assert.equal(firstVisit.canEnrollClass, false);
  const loaded = classRegistrationState({ endStateKnown: true, endsAt: future }, now);
  assert.equal(loaded.canViewEnrollment, true);
  assert.equal(loaded.canEnrollClass, true);
});

test('known closed classes cannot open enrollment even when other listing data is unresolved', () => {
  for (const dates of [
    { endsAt: past },
    { registrationEnd: past },
    { registrationStart: future },
    { completed: true },
  ]) {
    assert.equal(
      classRegistrationState({ ...dates, endStateKnown: false }, now).canViewEnrollment,
      false
    );
  }
});
