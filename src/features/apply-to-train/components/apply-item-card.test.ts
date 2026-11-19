import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toApplyItem } from '../types';
import { ApplyItemCard } from './apply-item-card';

for (const type of ['course', 'programme'] as const) {
  for (const status of [null, 'pending', 'approved', 'revoked'] as const) {
    test(`${type} card renders the correct CTA for ${status ?? 'unapplied'}`, () => {
      const item = toApplyItem({
        uuid: 'item', type, title: 'Training item',
        ...(status ? { my_application: { uuid: 'application', status } } : {}),
      })!;
      const html = renderToStaticMarkup(createElement(ApplyItemCard, {
        item, index: 0, selected: false,
        onDetails: () => undefined, onChoose: () => undefined,
      }));
      if (status === 'pending' || status === 'approved') {
        assert.match(html, /<button[^>]*disabled=""[^>]*>Apply<\/button>/);
        assert.ok(html.includes(status === 'pending' ? 'Pending review' : 'Approved'));
      } else {
        assert.match(html, status === 'revoked' ? />Reapply<\/button>/ : />Apply<\/button>/);
        assert.doesNotMatch(html, /<button[^>]*disabled=""[^>]*>Apply<\/button>/);
        if (status === 'revoked') assert.match(html, /Revoked/);
      }
    });
  }
}
