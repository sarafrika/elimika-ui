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
        uuid: 'item',
        type,
        title: 'Training item',
        ...(status ? { my_application: { uuid: 'application', status } } : {}),
      })!;
      const html = renderToStaticMarkup(
        createElement(ApplyItemCard, {
          item,
          index: 0,
          selected: false,
          onDetails: () => undefined,
          onChoose: () => undefined,
        })
      );
      if (status === 'approved') {
        assert.match(html, />View approval<\/button>/);
        assert.match(html, />View rate cards<\/button>/);
        assert.doesNotMatch(html, />Apply<\/button>/);
        assert.doesNotMatch(html, />Track application<\/a>/);
      } else if (status === 'pending') {
        assert.ok(html.includes('Pending review'));
        assert.match(html, />Track application<\/a>/);
        assert.doesNotMatch(html, />Apply<\/button>/);
        assert.doesNotMatch(html, />View approval<\/button>/);
        assert.doesNotMatch(html, />View rate cards<\/button>/);
      } else {
        assert.match(html, status === 'revoked' ? />Reapply<\/button>/ : />Apply<\/button>/);
        assert.doesNotMatch(html, /<button[^>]*disabled=""[^>]*>Apply<\/button>/);
        if (status === 'revoked') {
          assert.match(html, /Revoked/);
          assert.match(html, />Track application<\/a>/);
        }
      }
    });
  }
}
