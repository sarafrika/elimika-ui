import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ageOnDate, childSchema, guardianRegistrationSchema } from './validation';

const today = new Date(2026, 10, 27);

test('age changes on the birthday, and invalid calendar dates are rejected', () => {
  assert.equal(ageOnDate('2008-11-28', today), 17);
  assert.equal(ageOnDate('2008-11-27', today), 18);
  assert.equal(ageOnDate('2021-11-27', today), 5);
  assert.equal(ageOnDate('2021-11-28', today), 4);
  assert.ok(Number.isNaN(ageOnDate('2018-02-30', today)));
  assert.ok(Number.isNaN(ageOnDate('', today)));
});

function dobAtAge(age: number) {
  const now = new Date();
  return `${now.getFullYear() - age}-01-01`;
}

test('child registration accepts ages 5–17 and only parent or guardian relationships', () => {
  const child = {
    first_name: ' John ',
    last_name: ' Doe ',
    dob: dobAtAge(10),
    relationship_type: 'PARENT',
  };
  assert.deepEqual(childSchema.parse(child), { ...child, first_name: 'John', last_name: 'Doe' });
  assert.ok(
    childSchema.safeParse({ ...child, relationship_type: 'GUARDIAN', middle_name: 'Kamau' }).success
  );
  for (const age of [4, 18])
    assert.ok(!childSchema.safeParse({ ...child, dob: dobAtAge(age) }).success);
  assert.ok(!childSchema.safeParse({ ...child, relationship_type: 'SPONSOR' }).success);
  assert.ok(!childSchema.safeParse({ ...child, first_name: ' ' }).success);
});

test('guardian registration requires adulthood, invited email, password length and terms', () => {
  const guardian = {
    first_name: 'Mary',
    last_name: 'Doe',
    email: 'mary@example.com',
    dob: dobAtAge(30),
    password: 'password-123',
    terms_accepted: true,
  };
  assert.ok(guardianRegistrationSchema.safeParse(guardian).success);
  for (const invalid of [
    { dob: dobAtAge(17) },
    { dob: '2035-01-01' },
    { email: 'invalid' },
    { password: 'short' },
    { password: 'a'.repeat(129) },
    { terms_accepted: false },
  ])
    assert.ok(!guardianRegistrationSchema.safeParse({ ...guardian, ...invalid }).success);
});
