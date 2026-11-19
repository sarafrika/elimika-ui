import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { programMinimumTrainingFee } from '@/lib/program-training-fee';
import { formatRateAmount } from '@/lib/rate-card';
import { StepDelivery } from './components/step-delivery';
import { type DeliveryDraft, validateDelivery } from './delivery-model';

const minimumFee = programMinimumTrainingFee({ price: 750 });

test('instructor programme delivery displays the programme configured fee', () => {
  const draft: DeliveryDraft = {
    methods: ['private_online'],
    card: { currency: 'KES', private_online_hourly_rate: 750 },
  };
  const html = renderToStaticMarkup(createElement(StepDelivery, {
    draft,
    onChange: () => undefined,
    validation: validateDelivery(draft, minimumFee),
    showErrors: true,
    minimumFee,
    creator: 'Programme creator',
    groups: [],
    lessons: [],
  }));
  assert.ok(html.includes(formatRateAmount(750, 'KES')));
});

test('rates are validated against the programme fee rather than member-course amounts', () => {
  const draft: DeliveryDraft = {
    methods: ['private_online'],
    card: { private_online_hourly_rate: 200 },
  };
  assert.equal(minimumFee, 750);
  assert.ok(validateDelivery(draft, minimumFee).count > 0);
  assert.equal(validateDelivery({ ...draft, card: { private_online_hourly_rate: 750 } }, minimumFee).count, 0);
});
