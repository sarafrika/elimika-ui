import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CLASS_OVERVIEW_TABS,
  CLASS_OVERVIEW_TAB_LABELS,
  mergeCourseSkills,
} from './class-overview';

test('class overview tabs run Overview, Schedule, Curriculum, Students, Skills', () => {
  assert.deepEqual(
    CLASS_OVERVIEW_TABS.map(tab => CLASS_OVERVIEW_TAB_LABELS[tab]),
    ['Overview', 'Schedule', 'Curriculum', 'Students', 'Skills']
  );
});

test('mergeCourseSkills keeps one entry per skill with the higher weight', () => {
  const merged = mergeCourseSkills([
    [
      { skill_uuid: 'a', skill_name: 'Algebra', weight: 2 },
      { skill_uuid: 'b', skill_name: 'Botany', weight: 5 },
    ],
    undefined,
    [
      { skill_uuid: 'a', skill_name: 'Algebra', weight: 4 },
      { skill_uuid: 'c', skill_name: 'Chemistry', weight: 4 },
    ],
  ]);
  assert.deepEqual(
    merged.map(skill => [skill.skill_uuid, skill.weight]),
    [
      ['b', 5],
      ['a', 4],
      ['c', 4],
    ]
  );
});

test('mergeCourseSkills skips skills without any identity', () => {
  assert.deepEqual(mergeCourseSkills([[{ weight: 3 }]]), []);
});
