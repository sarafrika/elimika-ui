import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApplyCatalogueResponse } from '@/services/client';
import { catalogueRequests, mergeCataloguePages, type CatalogueFilters } from './catalogue-model';
import { applyToTrainReducer, initialApplyToTrainState } from './model';
import { canReapply, isLocked, toApplyItem } from './types';

const filters: CatalogueFilters = { q: '', show: 'all', fit: 'all', category: null, page: 0 };

test('all available requests both unapplied and applied results within the page budget', () => {
  const requests = catalogueRequests(filters, '');
  assert.deepEqual(requests.map(query => query.fit), ['open', 'applied']);
  assert.equal(requests.reduce((total, query) => total + Number(query.size), 0), 24);
  assert.deepEqual(catalogueRequests({ ...filters, page: 2 }, 'piano').map(query => query.page), ['2', '2']);
  assert.equal(catalogueRequests({ ...filters, fit: 'skills' }, '').length, 1);
});

test('unapplied, pending, approved and revoked entries are retained with pagination', () => {
  const pages: ApplyCatalogueResponse[] = [
    {
      content: [{ uuid: 'new', type: 'course', title: 'New course' }],
      metadata: { totalPages: 2, totalElements: BigInt(15) },
      facets: { show: { all: BigInt(15), courses: BigInt(15), programmes: BigInt(0) } },
    },
    {
      content: [
        { uuid: 'pending', type: 'course', my_application: { uuid: 'a', status: 'pending' } },
        { uuid: 'approved', type: 'programme', my_application: { uuid: 'b', status: 'approved' } },
        { uuid: 'revoked', type: 'programme', my_application: { uuid: 'c', status: 'revoked' } },
      ],
      metadata: { totalPages: 4, totalElements: BigInt(38) },
      facets: { show: { all: BigInt(38), courses: BigInt(10), programmes: BigInt(28) } },
    },
  ];
  const catalogue = mergeCataloguePages(pages);
  assert.equal(catalogue.items.length, 4);
  assert.deepEqual(catalogue.items.map(item => item.application?.status ?? null), [null, 'pending', 'approved', 'revoked']);
  assert.equal(catalogue.total, 53);
  assert.equal(catalogue.totalPages, 4);
  assert.equal(catalogue.facets.show.all, 53);
});

test('an overlapping applied result takes precedence so it cannot appear applyable', () => {
  const { items } = mergeCataloguePages([
    { content: [{ uuid: 'same', type: 'course' }] },
    { content: [{ uuid: 'same', type: 'course', my_application: { uuid: 'a', status: 'pending' } }] },
  ]);
  assert.equal(items.length, 1);
  assert.equal(isLocked(items[0]!), true);
});

for (const type of ['course', 'programme'] as const) {
  for (const status of ['pending', 'approved', 'revoked', 'rejected'] as const) {
    test(`${type} with ${status} status has the correct application eligibility`, () => {
      const item = toApplyItem({ uuid: 'item', type, my_application: { uuid: 'application', status } })!;
      const locked = status === 'pending' || status === 'approved';
      assert.equal(isLocked(item), locked);
      assert.equal(canReapply(item), !locked);
      const state = initialApplyToTrainState(null);
      const next = applyToTrainReducer(state, { type: 'choose', item });
      if (locked) {
        assert.equal(next, state);
      } else {
        assert.equal(next.item?.uuid, 'item');
        assert.equal(next.step, 'groups');
        assert.deepEqual(next.answers, []);
      }
    });
  }
}
