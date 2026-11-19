import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ProgramRequirement } from '@/services/client';
import { applyReducer, initialApplyState, programRequirementPrompt } from './apply-model';
import { StepRequirements } from './step-requirements';

const requirement: ProgramRequirement = {
  uuid: 'venue',
  program_uuid: 'program',
  requirement_type: 'TRAINING_CENTER',
  requirement_text: 'Provide a training venue',
};
const initial = applyReducer(initialApplyState('organisation'), {
  type: 'initAnswers',
  requirements: [programRequirementPrompt(requirement)],
});

for (const has of [null, 'yes', 'no'] as const) {
  test(`programme requirement offers course-style choices when the answer is ${has}`, () => {
    const state = has === null ? initial : applyReducer(initial, {
      type: 'answerHas', uuid: 'venue', has,
    });
    const html = renderToStaticMarkup(createElement(StepRequirements, {
      state,
      dispatch: () => undefined,
      contentKind: 'program',
      requirements: [],
      programRequirements: [requirement],
    }));
    assert.match(html, /Do you have Provide a training venue\?/);
    assert.match(html, />Yes<\/button>/);
    assert.match(html, />No<\/button>/);
    if (has === 'no') {
      assert.match(html, />Lease<\/button>/);
      assert.match(html, />Hire<\/button>/);
    } else {
      assert.doesNotMatch(html, />Lease<\/button>/);
    }
  });
}
