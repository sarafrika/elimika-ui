import { type MockApi, paged } from '../support/api';
import type { E2eUser } from '../support/session';

// Anonymised Drums D4-style term: six graded lessons (29,29,29,30,27,21 of 30) and one ungraded.
export const COURSE_UUID = '22222222-2222-4222-8222-222222222222';
export const ENROLLMENT_UUID = '44444444-4444-4444-8444-444444444444';
export const STUDENT_UUID = '55555555-5555-4555-8555-555555555555';

export const STUDENT_USER: E2eUser = {
  uuid: '00000000-0000-4000-8000-0000000000a1',
  name: 'Amani Wekesa',
  email: 'amani@e2e.test',
  domains: ['student'],
};
export const PARENT_USER: E2eUser = {
  uuid: '00000000-0000-4000-8000-0000000000b1',
  name: 'Grace Wekesa',
  email: 'grace@e2e.test',
  domains: ['parent'],
};
export const CREATOR_USER: E2eUser = {
  uuid: '00000000-0000-4000-8000-0000000000c1',
  name: 'Course Author',
  email: 'author@e2e.test',
  domains: ['course_creator'],
};

const criteria = (points: number[]) =>
  ['Technique', 'Tonal Quality', 'Rhythm', 'Pitch', 'Synchronisation', 'Presentation'].map((name, i) => ({
    criteria_uuid: `c${i}`,
    criteria_name: name,
    scoring_level_name: `Level ${points[i]}`,
    points: points[i],
  }));

const graded = (n: number, title: string, points: number[]) => ({
  lesson_uuid: `lesson-${n}`,
  lesson_number: n,
  lesson_title: title,
  attendance: 'ATTENDED',
  marks: [
    {
      line_item_uuid: `li-${n}`,
      component: 'Lesson performance',
      status: 'graded',
      score: points.reduce((a, b) => a + b, 0),
      max_score: 30,
      criteria: criteria(points),
      revision_count: 1,
    },
  ],
});

export function progressReport(comment = '<p><strong>Good progress.</strong> Practise these:</p><ul><li>Left-hand finger speed</li></ul>') {
  return {
    course_uuid: COURSE_UUID,
    course_name: 'Introduction to Piano',
    enrollment_uuid: ENROLLMENT_UUID,
    student_uuid: STUDENT_UUID,
    final_grade: 91.67,
    final_grade_label: 'Merit',
    result_status: 'IN_PROGRESS',
    progress_percentage: 85.71,
    average_lesson_score: 27.5,
    lesson_max_score: 30,
    instructor_comments: comment,
    lessons: [
      graded(1, 'Review / piano orientation', [5, 5, 5, 5, 5, 4]),
      graded(2, 'Melodies from earlier sessions', [5, 5, 5, 5, 4, 5]),
      graded(3, 'Grand staff', [5, 4, 5, 5, 5, 5]),
      graded(4, 'Scales: C major', [5, 5, 5, 5, 5, 5]),
      graded(5, 'Simple chords', [5, 4, 4, 5, 4, 5]),
      graded(6, 'Playing with a metronome', [4, 3, 4, 3, 3, 4]),
      {
        lesson_uuid: 'lesson-7',
        lesson_number: 7,
        lesson_title: 'Recital piece',
        attendance: 'ABSENT',
        marks: [{ line_item_uuid: 'li-7', component: 'Lesson performance', status: 'ungraded', max_score: 30, criteria: [], revision_count: 0 }],
      },
    ],
  };
}

export const MALICIOUS_COMMENT =
  '<p>Nice work</p><img src="x" onerror="window.__xss = true"><script>window.__xss = true</script>';

/** The shell's identity calls: bootstrap plus the role row the profile context looks up. */
export function mockShell(api: MockApi, user: E2eUser, roleRow?: { path: RegExp; row: Record<string, unknown> }) {
  const [first, ...rest] = user.name.split(' ');
  api.get(/^\/api\/v1\/me\/bootstrap$/, {
    user: { uuid: user.uuid, first_name: first, last_name: rest.join(' '), email: user.email, user_domain: user.domains },
    profiles: user.domains.includes('student') ? { student_uuid: STUDENT_UUID } : {},
  });
  api.get(/^\/api\/v1\/users\/me$/, {
    uuid: user.uuid,
    first_name: first,
    last_name: rest.join(' '),
    email: user.email,
    user_domain: user.domains,
  });
  api.get(/^\/api\/v1\/notifications\/counts/, { unread_count: 0, popup_count: 0 });
  if (roleRow) api.get(roleRow.path, paged([roleRow.row]));
}
