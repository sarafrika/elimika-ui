import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InstructorDeliverycards } from './InstructorDeliverycards';
import { instructorDeliveryRates } from './instructor-delivery-rates';

test('an offering without approved rates has no selectable services', () => {
  assert.deepEqual(instructorDeliveryRates(), []);
  assert.deepEqual(
    instructorDeliveryRates({ private_online_hourly_rate: 0, group_online_daily_rate: -10 }),
    []
  );
});

test('hourly and daily rates stay attached to their service and billing basis', () => {
  const rates = instructorDeliveryRates({
    currency: 'KES',
    private_online_hourly_rate: 1200,
    private_online_daily_rate: 6000,
    group_online_hourly_rate: null,
  });
  assert.equal(rates.length, 2);
  assert.ok(rates.every(rate => rate.delivery === 'ONLINE' && rate.service === 'private-online'));
  assert.equal(rates.find(rate => rate.basis === 'per_hour')?.amount, 1200);
  assert.equal(rates.find(rate => rate.basis === 'per_day')?.amount, 6000);
});

test('hybrid services use approved in-person rates without exposing unapproved methods', () => {
  const rates = instructorDeliveryRates({ group_inperson_hourly_rate: 850 });
  assert.equal(rates.length, 2);
  assert.deepEqual(
    rates.map(rate => rate.delivery),
    ['IN_PERSON', 'HYBRID']
  );
  assert.ok(
    rates.every(
      rate => rate.service === 'group' && rate.basis === 'per_hour' && rate.amount === 850
    )
  );
});

test('the cards show the selected approved service without separate delivery or billing steps', () => {
  const html = renderToStaticMarkup(
    createElement(InstructorDeliverycards, {
      rateCard: { currency: 'KES', private_online_hourly_rate: 1200 },
      value: { delivery: 'ONLINE', service: 'private-online', basis: 'per_hour' },
      onChange: () => undefined,
    })
  );
  assert.match(html, /Which service\?/);
  assert.match(html, /KES 1,200 \/ hour/);
  assert.equal((html.match(/role="radio"/g) ?? []).length, 1);
  assert.equal((html.match(/aria-checked="true"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /How is it delivered\?|How are learners billed\?|Instructor pay/);
});
