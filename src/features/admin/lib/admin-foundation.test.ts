import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adminRoutes } from './admin-routes';
import { buildConfirm, confirmEffects } from './confirm-effects';
import {
  applySearchState,
  booleanParam,
  enumParam,
  numberParam,
  stringParam,
  withPageReset,
} from '../state/search-state';

test('admin routes carry the segment and drop empty filters', () => {
  assert.equal(adminRoutes.overview(), '/dashboard/admin/overview');
  assert.equal(adminRoutes.inbox(), '/dashboard/admin/inbox');
  assert.equal(adminRoutes.inbox('documents'), '/dashboard/admin/inbox?type=documents');
  assert.equal(
    adminRoutes.inbox('documents', 'doc-1'),
    '/dashboard/admin/inbox?type=documents&item=doc-1'
  );
  assert.equal(adminRoutes.people({ q: '', role: 'instructor' }), '/dashboard/admin/people?role=instructor');
});

test('a person link defaults to the overview tab and can open review mode', () => {
  assert.equal(adminRoutes.person('u-1'), '/dashboard/admin/people/u-1?tab=overview');
  assert.equal(
    adminRoutes.person('u-1', 'verification', { queue: 'documents', item: 'doc-9' }),
    '/dashboard/admin/people/u-1?tab=verification&review=documents&item=doc-9'
  );
});

test('platform routes keep their nested segments', () => {
  assert.equal(adminRoutes.categories(), '/dashboard/admin/platform/categories');
  assert.equal(adminRoutes.rules({ rule: 'new' }), '/dashboard/admin/platform/rules?rule=new');
  assert.equal(adminRoutes.config('difficulty'), '/dashboard/admin/platform/config?tab=difficulty');
});

test('search params parse with fallbacks and serialise away defaults', () => {
  const role = enumParam(['all', 'instructor'] as const, 'all');
  assert.equal(role.parse('instructor'), 'instructor');
  assert.equal(role.parse('nonsense'), 'all');
  assert.equal(role.serialise('all'), undefined);
  assert.equal(role.serialise('instructor'), 'instructor');

  assert.equal(numberParam(0).parse('3'), 3);
  assert.equal(numberParam(0).parse('abc'), 0);
  assert.equal(numberParam(0).serialise(0), undefined);
  assert.equal(stringParam().parse(null), '');
  assert.equal(booleanParam().parse('true'), true);
});

test('applying a patch removes undefined parameters', () => {
  const next = applySearchState(new URLSearchParams('q=kevin&page=3'), {
    q: undefined,
    status: 'active',
  });
  assert.equal(next.toString(), 'page=3&status=active');
});

test('changing a filter resets paging but paging itself does not', () => {
  assert.deepEqual(withPageReset({ q: 'kevin' }), { q: 'kevin', page: undefined });
  assert.deepEqual(withPageReset({ page: '4' }), { page: '4' });
});

test('every confirm action names the subject and states real effects', () => {
  for (const action of Object.keys(confirmEffects) as Array<keyof typeof confirmEffects>) {
    const content = buildConfirm(action, {
      name: 'Kevin Otieno',
      detail: 'teaching certificate',
      confirmValue: 'kotieno',
    });
    assert.ok(
      content.title.includes('Kevin Otieno') || content.title.includes('teaching certificate'),
      `${action} names what it acts on`
    );
    assert.ok(content.title.endsWith('?'), `${action} asks a question`);
    assert.ok(content.effects.length > 0, `${action} lists what happens`);
    assert.ok(content.confirmLabel.length > 0, `${action} labels its button`);
  }
});

test('destructive actions ask the admin to type the record name', () => {
  const content = buildConfirm('deactivateAccount', { name: 'Kevin Otieno', confirmValue: 'kotieno' });
  assert.equal(content.tone, 'danger');
  assert.equal(content.typeToConfirm, 'kotieno');
});

test('actions the API does not fully perform carry a warning', () => {
  const rejectOrg = buildConfirm('rejectOrganisation', { name: 'Nairobi Music Academy' });
  assert.ok(rejectOrg.warnings?.some(warning => warning.includes('changes nothing')));

  const deactivate = buildConfirm('deactivateAccount', { name: 'Kevin Otieno' });
  assert.ok(deactivate.warnings?.some(warning => warning.includes('already open')));
});
