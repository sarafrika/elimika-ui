'use client';

import { searchSubmissionsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

const mockGrades = [
  {
    uuid: 's1u2b3m4-5i6s-7s8i-9o10-abcdefghijkl',
    enrollment_uuid: "e1n2r3o4-5l6l-7m8e-9n10-abcdefghijkl",
    assignment_uuid: "a1s2s3g4-5n6m-7e8n-9t10-abcdefghijkl",
    submission_text:
      'This is my analysis of the music theory concepts covered in the lesson...',
    file_urls: [
      'https://storage.sarafrika.com/submissions/audio_example.mp3',
      'https://storage.sarafrika.com/submissions/written_analysis.pdf',
    ],
    submitted_at: '2024-04-10T14:30:00',
    status: 'GRADED',
    score: 85,
    max_score: 100,
    percentage: 85,
    instructor_comments:
      'Excellent analysis of the chord progressions. The audio example demonstrates good understanding of the concepts. Minor improvement needed in identifying secondary dominants.',
    graded_at: '2024-04-12T16:45:00',
    grade_display: '85.00 / 100.00 (85%)',
    submission_status_display: 'Graded - Instructor Feedback Available',
    file_count_display: '2 files attached',
    submission_category: 'Mixed Media Submission',
  },
  {
    uuid: 's1u2b3m4-5i6s-7s8i-9o10-abcdabghijkl',
    enrollment_uuid: "e1n2r3o4-5l6l-7m8e-9n10-abcdefghijkl",
    assignment_uuid: "a1s2s3g4-5n6m-7e8n-9t10-abcdefghijkl",
    submission_text:
      'This is my analysis of the music theory concepts covered in the lesson...',
    file_urls: [
      'https://storage.sarafrika.com/submissions/audio_example.mp3',
      'https://storage.sarafrika.com/submissions/written_analysis.pdf',
    ],
    submitted_at: '2024-04-10T14:30:00',
    status: 'GRADED',
    score: 85,
    max_score: 100,
    percentage: 85,
    instructor_comments:
      'Excellent analysis of the chord progressions. The audio example demonstrates good understanding of the concepts. Minor improvement needed in identifying secondary dominants.',
    graded_at: '2024-04-12T16:45:00',
    grade_display: '85.00 / 100.00 (85%)',
    submission_status_display: 'Graded - Instructor Feedback Available',
    file_count_display: '2 files attached',
    submission_category: 'Mixed Media Submission',
  },
  {
    uuid: 's1u2b3m4-5i6s-7s8i-9o10-abcdabghijkl',
    enrollment_uuid: "e1n2r3o4-5l6l-7m8e-9n10-abcdefghijkl",
    assignment_uuid: "a1s2s3g4-5n6m-7e8n-9t10-abcdefghijkl",
    submission_text:
      'This is my analysis of the music theory concepts covered in the lesson...',
    file_urls: [
      'https://storage.sarafrika.com/submissions/audio_example.mp3',
      'https://storage.sarafrika.com/submissions/written_analysis.pdf',
    ],
    submitted_at: '2024-04-10T14:30:00',
    status: 'GRADED',
    score: 85,
    max_score: 100,
    percentage: 85,
    instructor_comments:
      'Excellent analysis of the chord progressions. The audio example demonstrates good understanding of the concepts. Minor improvement needed in identifying secondary dominants.',
    graded_at: '2024-04-12T16:45:00',
    grade_display: '85.00 / 100.00 (85%)',
    submission_status_display: 'Graded - Instructor Feedback Available',
    file_count_display: '2 files attached',
    submission_category: 'Mixed Media Submission',
  },
];

export default function GradesPage() {
  const { data } = useQuery(searchSubmissionsOptions({ query: { pageable: {}, searchParams: { enrollmentUuid: "student enrollment id here" } } }))

  return (
    <div className="space-y-6">
      {mockGrades.length === 0 ? (
        <div className="text-center text-gray-500 border border-dashed p-6 rounded-md">
          No graded assignments yet.
        </div>
      ) : (
        <div className="space-y-6">
          {mockGrades.map((grade, index) => (
            <div
              key={grade.uuid}
              className="border rounded-md p-4 shadow-sm bg-white space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">Assignment {index + 1}</h2>
                  <p className="text-sm text-gray-500">
                    {grade.submission_status_display}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Score</p>
                  <p className="text-xl font-bold text-blue-700">
                    {grade.grade_display}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-700">
                <p>
                  <span className="font-medium">Submitted:</span>{' '}
                  {new Date(grade.submitted_at).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Graded:</span>{' '}
                  {new Date(grade.graded_at).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Category:</span>{' '}
                  {grade.submission_category}
                </p>
              </div>

              {grade.instructor_comments && (
                <div className="bg-gray-50 border p-3 rounded">
                  <p className="text-sm font-medium text-gray-800 mb-1">Instructor Feedback</p>
                  <p className="text-sm text-gray-700">{grade.instructor_comments}</p>
                </div>
              )}

              {grade.file_urls?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Submitted Files ({grade.file_urls.length}):</p>
                  <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                    {grade.file_urls.map((url, i) => (
                      <li key={i}>
                        <Link href={url} target="_blank" className="underline">
                          {decodeURIComponent(url.split('/').pop() || `File ${i + 1}`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
