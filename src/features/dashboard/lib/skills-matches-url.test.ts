import assert from 'node:assert/strict';
import { test } from 'node:test';
import { instructorApplyToTrainHref } from '@/src/features/apply-to-train/links';
import { findWorkFilteredHref } from '@/src/features/instructor-jobs/find-work/find-work-filters';
import {
  applicationPageHref,
  findWorkHref,
  hiredJobsHref,
  jobPageHref,
  myApplicationsHref,
} from '@/src/features/instructor-jobs/job-routes';
import { isSkillsMatchTab, skillsMatchesHref } from './skills-matches-url';

const parse = (href: string) => new URL(href, 'https://elimika.test');

test('the overview is the default, and only the six requested tabs are recognised', () => {
  assert.equal(skillsMatchesHref(), '/dashboard/instructor/skills-matches');
  for (const tab of [
    'all-matches',
    'jobs',
    'apply-to-train',
    'projects',
    'workshop',
    'my-applications',
  ]) {
    assert.equal(isSkillsMatchTab(tab), true);
  }
  for (const tab of [null, '', 'hired', 'unknown']) assert.equal(isSkillsMatchTab(tab), false);
});

test('legacy redirects keep repeated filters and override a conflicting tab', () => {
  const href = skillsMatchesHref('jobs', {
    tab: 'schedule',
    q: 'design & technology',
    category: ['category-1', 'category-2'],
    ignored: undefined,
  });
  const url = parse(href);
  assert.equal(url.pathname, '/dashboard/instructor/skills-matches');
  assert.equal(url.searchParams.get('tab'), 'jobs');
  assert.equal(url.searchParams.get('q'), 'design & technology');
  assert.deepEqual(url.searchParams.getAll('category'), ['category-1', 'category-2']);
  assert.equal(url.searchParams.has('ignored'), false);
});

test('changing tabs does not mutate incoming query parameters', () => {
  const params = new URLSearchParams({ tab: 'jobs', course: 'course-1' });
  const overview = parse(skillsMatchesHref('all-matches', params));
  assert.equal(overview.searchParams.has('tab'), false);
  assert.equal(overview.searchParams.get('course'), 'course-1');
  assert.equal(params.get('tab'), 'jobs');
});

test('job filters and clearing filters both stay on the Jobs tab', () => {
  const url = parse(findWorkFilteredHref({ organisation: 'org-1', ready: 'ready' }));
  assert.equal(url.searchParams.get('tab'), 'jobs');
  assert.equal(url.searchParams.get('organisation'), 'org-1');
  assert.equal(url.searchParams.get('ready'), 'ready');
  assert.equal((url.href.match(/\?/g) ?? []).length, 1);
  const cleared = parse(findWorkFilteredHref({}));
  assert.equal(cleared.searchParams.get('tab'), 'jobs');
  assert.equal(cleared.searchParams.has('organisation'), false);
});

test('training application links preserve course selection and editing context', () => {
  const url = parse(
    instructorApplyToTrainHref({ kind: 'program', uuid: 'program-1' }, 'application-1')
  );
  assert.equal(url.pathname, '/dashboard/instructor/skills-matches');
  assert.equal(url.searchParams.get('tab'), 'apply-to-train');
  assert.equal(url.searchParams.get('kind'), 'program');
  assert.equal(url.searchParams.get('item'), 'program-1');
  assert.equal(url.searchParams.get('application'), 'application-1');
  const reset = parse(instructorApplyToTrainHref());
  assert.equal(reset.searchParams.get('tab'), 'apply-to-train');
  assert.equal(reset.searchParams.has('item'), false);
});

test('job navigation enters Skills Matches while detail and hired routes stay accessible', () => {
  assert.equal(parse(findWorkHref()).searchParams.get('tab'), 'jobs');
  assert.equal(parse(myApplicationsHref()).searchParams.get('tab'), 'my-applications');
  assert.equal(jobPageHref('job/1'), '/dashboard/instructor/opportunities/job%2F1');
  assert.equal(
    applicationPageHref('application-1'),
    '/dashboard/instructor/opportunities/my-applications/application-1'
  );
  assert.equal(hiredJobsHref(), '/dashboard/instructor/opportunities/hired');
});
