import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  analyseSmsTemplate,
  insertPlaceholder,
  nonGsmCharacters,
  placeholdersIn,
  type SmsPlaceholder,
  segmentCount,
} from './sms-template-checks';

const paid: SmsPlaceholder[] = [
  { name: 'amount', label: 'Amount paid', sample: 'KES 10,500', max_length: 11, required: true },
  { name: 'class', label: 'Class title', sample: 'Flower Gardening', max_length: 32, required: false },
  { name: 'order', label: 'Order number', sample: 'ELM-HH48B3', max_length: 10, required: true },
  { name: 'mpesa', label: 'M-Pesa receipt', sample: 'UK42C120ZR', max_length: 10, required: false },
  {
    name: 'first_session',
    label: 'First session',
    sample: 'Sat 14 Nov 09:00',
    max_length: 16,
    required: false,
  },
];
const DEFAULT =
  'Elimika: Paid {amount} for {class}. Order {order}, M-Pesa {mpesa}. First class {first_session}. See you there!';

test('the default payment wording passes in one segment', () => {
  const result = analyseSmsTemplate(DEFAULT, paid, false);
  assert.equal(result.blocking, false);
  assert.equal(result.issues[0]?.tone, 'ok');
  assert.equal(result.limit, 160);
  assert.equal(result.segments, 1);
  assert.ok(result.worstLength <= 160);
  assert.match(result.preview, /Paid KES 10,500 for Flower Gardening\. Order ELM-HH48B3/);
});

test('an unknown placeholder blocks saving', () => {
  const result = analyseSmsTemplate('Paid {amount} for {order} by {name}', paid, false);
  assert.equal(result.blocking, true);
  assert.deepEqual(
    result.issues.map(issue => issue.tag),
    ['Unknown']
  );
});

test('a removed required placeholder blocks, and says why for security codes', () => {
  const code: SmsPlaceholder[] = [
    { name: 'code', label: 'Code', sample: '482913', max_length: 6, required: true },
  ];
  const result = analyseSmsTemplate('Your Elimika code is ready.', code, true);
  assert.equal(result.blocking, true);
  assert.match(result.issues[0]?.text ?? '', /never reaches the user/);
});

test('a stray brace blocks', () => {
  const result = analyseSmsTemplate('Paid {amount for {order}', paid, false);
  assert.ok(result.issues.some(issue => issue.tag === 'Braces'));
  assert.equal(result.blocking, true);
});

test('worst case over 160 plain characters blocks', () => {
  const result = analyseSmsTemplate(`${DEFAULT} ${'x'.repeat(60)}`, paid, false);
  assert.ok(result.worstLength > 160);
  assert.equal(result.blocking, true);
  assert.equal(result.segments, 2);
});

test('a non-GSM character warns and drops to 70-character segments', () => {
  const result = analyseSmsTemplate('Paid {amount} — order {order}', paid, false);
  assert.equal(result.blocking, false);
  assert.equal(result.limit, 70);
  assert.deepEqual(nonGsmCharacters('Paid — “ok”'), ['—', '“', '”']);
});

test('placeholders are listed once each', () => {
  assert.deepEqual(placeholdersIn('{order} {amount} {order}'), ['order', 'amount']);
});

test('segment counts follow the concatenated sizes', () => {
  assert.equal(segmentCount(160, false), 1);
  assert.equal(segmentCount(161, false), 2);
  assert.equal(segmentCount(70, true), 1);
  assert.equal(segmentCount(135, true), 3);
});

test('inserting a placeholder pads it from the words around it', () => {
  assert.deepEqual(insertPlaceholder('Order', 'order'), { text: 'Order {order}', caret: 13 });
  assert.deepEqual(insertPlaceholder('Order paid', 'order', 5), {
    text: 'Order {order} paid',
    caret: 13,
  });
  assert.deepEqual(insertPlaceholder('Order .', 'order', 6), { text: 'Order {order}.', caret: 13 });
});
