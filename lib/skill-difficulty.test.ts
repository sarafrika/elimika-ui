import assert from 'node:assert/strict';
import test from 'node:test';
import { skillDifficultyOptions, toSkillProficiency } from './skill-difficulty';

test('fetched difficulty levels supply ordered labels and API proficiency values rather than UUIDs', () => {
  assert.deepEqual(
    skillDifficultyOptions([
      { uuid: 'advanced-id', name: 'ADVANCED', display_name: 'Advanced course', level_order: 3 },
      { uuid: 'beginner-id', name: 'Beginner', level_order: 1 },
      { uuid: 'intermediate-id', name: 'Intermediate', level_order: 2 },
    ]),
    [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced course' },
    ]
  );
});

test('a configured difficulty unsupported by the skills API cannot be submitted as proficiency', () => {
  assert.deepEqual(
    skillDifficultyOptions([
      { uuid: 'custom-id', name: 'Professional', level_order: 1 },
      { uuid: 'expert-id', name: 'Expert', level_order: 2 },
      { uuid: 'duplicate-id', name: ' expert ', level_order: 3 },
    ]),
    [{ value: 'expert', label: 'Expert' }]
  );
  assert.equal(toSkillProficiency('beginner-id'), undefined);
  assert.equal(toSkillProficiency(undefined), undefined);
  assert.deepEqual(skillDifficultyOptions([]), []);
});
