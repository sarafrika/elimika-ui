import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ProgramRequirement } from '@/services/client';
import {
  answerErrors,
  applyToTrainReducer,
  initialApplyToTrainState,
  instructorRequirementPrompts,
} from '../model';
import { StepRequirements } from './step-requirements';

const requirements: ProgramRequirement[] = [
  {
    uuid: 'qualification', program_uuid: 'program', requirement_type: 'INSTRUCTOR',
    requirement_text: 'Teaching qualification',
  },
  {
    uuid: 'venue', program_uuid: 'program', requirement_type: 'TRAINING_CENTER',
    requirement_text: 'Training venue',
  },
];
const prompts = instructorRequirementPrompts('program', [], requirements);
const initial = applyToTrainReducer(initialApplyToTrainState(null), {
  type: 'initAnswers', requirements: prompts,
});

test('programme answers include only requirements assigned to the instructor', () => {
  assert.deepEqual(prompts.map(prompt => prompt.uuid), ['qualification']);
  assert.equal(answerErrors(initial.answers).length, 1);
});

test('No requires an acquisition choice and switching to Yes clears it', () => {
  let state = applyToTrainReducer(initial, {
    type: 'answerHas', uuid: 'qualification', has: 'no',
  });
  assert.equal(answerErrors(state.answers).length, 1);
  state = applyToTrainReducer(state, {
    type: 'answerAcquisition', uuid: 'qualification', acquisition: 'hire',
  });
  assert.deepEqual(answerErrors(state.answers), []);
  state = applyToTrainReducer(state, {
    type: 'answerHas', uuid: 'qualification', has: 'yes',
  });
  assert.deepEqual(answerErrors(state.answers), []);
  const answer = state.answers[0];
  assert.ok(answer);
  assert.equal(answer.acquisition, undefined);
});

for (const has of [null, 'yes', 'no'] as const) {
  test(`programme requirements render Yes/No controls for ${has ?? 'unanswered'}`, () => {
    const state = has === null ? initial : applyToTrainReducer(initial, {
      type: 'answerHas', uuid: 'qualification', has,
    });
    const html = renderToStaticMarkup(createElement(StepRequirements, {
      kind: 'program', creator: 'the programme creator', answers: state.answers,
      dispatch: () => undefined, courseRequirements: [], programRequirements: requirements,
      loading: false, error: null, onRetry: () => undefined, showErrors: true,
    }));
    assert.match(html, /Do you have Teaching qualification\?/);
    assert.doesNotMatch(html, /Training venue/);
    assert.match(html, new RegExp(`aria-pressed="${has === 'yes'}"[^>]*>Yes</button>`));
    assert.match(html, new RegExp(`aria-pressed="${has === 'no'}"[^>]*>No</button>`));
    if (has === 'no') {
      assert.match(html, />Leasing<\/button>/);
      assert.match(html, />Hiring<\/button>/);
      assert.match(html, /Choose leasing or hiring/);
    } else {
      assert.doesNotMatch(html, />Leasing<\/button>/);
    }
  });
}
