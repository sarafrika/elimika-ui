import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { validateRateCard } from '@/lib/rate-card';
import { RateCardGrid } from './rate-card-grid';

test('minimum fees appear in red under both editable inputs and describe those inputs', () => {
  const html = renderToStaticMarkup(
    createElement(RateCardGrid, {
      mode: 'edit',
      value: { private_online_hourly_rate: 50 },
      minimum: 100,
    })
  );
  assert.equal((html.match(/Minimum training fee:/g) ?? []).length, 2);
  assert.equal((html.match(/class="text-destructive mt-1 text-xs"/g) ?? []).length, 2);
  assert.equal((html.match(/aria-describedby="[^"]+-minimum"/g) ?? []).length, 2);
  assert.equal((html.match(/min="100"/g) ?? []).length, 2);
});

test('below-minimum rates display a linked field error immediately', () => {
  const value = { private_online_hourly_rate: 50 };
  const html = renderToStaticMarkup(
    createElement(RateCardGrid, {
      mode: 'edit',
      value,
      minimum: 100,
      errors: validateRateCard(value, 100).cells,
    })
  );
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="[^"]+-error"/);
  assert.match(html, /At least .*100.*minimum training fee/);
});

test('no minimum hint is shown when the creator has not set a floor', () => {
  const html = renderToStaticMarkup(
    createElement(RateCardGrid, {
      mode: 'edit',
      value: { private_online_hourly_rate: 50 },
      minimum: null,
    })
  );
  assert.doesNotMatch(html, /Minimum training fee:/);
});

test('a valid hourly rate clears the warning, including the blank optional daily input', () => {
  for (const rate of [100, 150]) {
    const html = renderToStaticMarkup(
      createElement(RateCardGrid, {
        mode: 'edit',
        value: { private_online_hourly_rate: rate },
        minimum: 100,
      })
    );
    assert.doesNotMatch(html, /Minimum training fee:/);
    assert.doesNotMatch(html, /aria-describedby="[^"]+-minimum"/);
  }
});

test('a valid hourly rate does not hide an invalid daily rate warning', () => {
  const value = { private_online_hourly_rate: 150, private_online_daily_rate: 50 };
  const html = renderToStaticMarkup(
    createElement(RateCardGrid, {
      mode: 'edit',
      value,
      minimum: 100,
      errors: validateRateCard(value, 100).cells,
    })
  );
  assert.match(html, /At least .*100.*minimum training fee/);
  assert.match(html, /aria-invalid="true"/);
});
