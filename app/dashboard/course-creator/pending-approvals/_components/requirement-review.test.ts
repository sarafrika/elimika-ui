import assert from 'node:assert/strict';
import test from 'node:test';

import {
  emptyReviewDraft,
  reviewDecisionNotes,
  reviewItemsForApplicant,
  reviewSummary,
} from './requirement-review';

test('organisations can be approved without skills wallet or lesson plan reviews', () => {
  const draft = emptyReviewDraft();
  const items = reviewItemsForApplicant('organisation');
  assert.equal(items.some(item => item.id === 'skills-wallet'), false);
  assert.equal(items.some(item => item.id === 'lesson-plan'), false);
  for (const { id } of items) draft.requirements[id].status = 'approved';

  assert.deepEqual(reviewSummary(draft, 'organisation'), {
    reviewed: items.length,
    allApproved: true,
    hasDeclined: false,
    hasInfoRequest: false,
  });
  assert.equal(reviewDecisionNotes(draft, 'organisation').includes('Skills wallet:'), false);
  assert.equal(reviewDecisionNotes(draft, 'organisation').includes('Lesson plan:'), false);
});

test('saved organisation wallet and lesson plan decisions do not affect approval or notes', () => {
  const draft = emptyReviewDraft();
  for (const { id } of reviewItemsForApplicant('organisation'))
    draft.requirements[id].status = 'approved';
  draft.requirements['skills-wallet'].comment = 'Old wallet comment';
  draft.requirements['lesson-plan'].comment = 'Old lesson plan comment';

  for (const status of ['declined', 'information_requested'] as const) {
    draft.requirements['skills-wallet'].status = status;
    draft.requirements['lesson-plan'].status = status;
    const summary = reviewSummary(draft, 'organisation');
    assert.equal(summary.allApproved, true);
    assert.equal(summary.hasDeclined, false);
    assert.equal(summary.hasInfoRequest, false);
    assert.equal(reviewDecisionNotes(draft, 'organisation').includes('Old wallet comment'), false);
    assert.equal(reviewDecisionNotes(draft, 'organisation').includes('Old lesson plan comment'), false);
  }
});

test('instructors still require skills wallet and lesson plan approval', () => {
  const draft = emptyReviewDraft();
  for (const { id } of reviewItemsForApplicant('organisation'))
    draft.requirements[id].status = 'approved';

  assert.equal(reviewSummary(draft, 'instructor').allApproved, false);
  draft.requirements['skills-wallet'].status = 'approved';
  assert.equal(reviewSummary(draft, 'instructor').allApproved, false);
  draft.requirements['lesson-plan'].status = 'approved';
  assert.equal(reviewSummary(draft, 'instructor').allApproved, true);
  assert.match(reviewDecisionNotes(draft, 'instructor'), /Skills wallet: Approved/);
  assert.match(reviewDecisionNotes(draft, 'instructor'), /Lesson plan: Approved/);
});
