export type TLesson = {
  uuid: string | number;
  course_uuid: string;
  lesson_number: number;
  title: string;
  duration_hours: number;
  duration_minutes: number;
  description: string;
  learning_objectives: string;
  status: 'PUBLISHED' | 'DRAFT' | string;
  active: boolean;
  created_date: string;
  created_by: string;
  updated_date: string;
  updated_by: string;
  duration_display: string;
  is_published: boolean;
  lesson_sequence: string;
  content?: unknown[];
  resources?: unknown[];

  // ✅ allows any other property
  [key: string]: unknown;
};

export type TLessonContentItem = {
  uuid: string;
  lesson_uuid: string;
  content_type_uuid: string;
  content_type: 'TEXT' | 'VIDEO' | 'AUDIO' | string; // Adjust or extend as needed
  title: string;
  description: string;
  value: string;
  content_text: string | null;
  file_url: string | null;
  display_order: number;
  is_required: boolean;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_date: string; // ISO date string
  created_by: string;
  updated_date: string;
  updated_by: string | null;
  content_category: string;
  file_size_display: string;
  duration_minutes: string;
  duration_hours: string;
};
