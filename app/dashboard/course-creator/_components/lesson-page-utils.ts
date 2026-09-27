import type { ContentType, LessonContent } from '@/services/client/types.gen';

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
};

export function resolvePageAttachment(
  file: Pick<File, 'name' | 'type' | 'size'>,
  types: ContentType[]
) {
  const mime =
    file.type && file.type !== 'application/octet-stream'
      ? file.type.toLowerCase()
      : MIME_BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''];
  const kind = mime?.startsWith('image/')
    ? 'IMAGE'
    : mime?.startsWith('video/')
      ? 'VIDEO'
      : mime?.startsWith('audio/')
        ? 'AUDIO'
        : mime === 'application/pdf'
          ? 'PDF'
          : undefined;
  if (!kind || !mime) throw new Error('Choose an image, PDF, video, or audio file.');
  const type = types.find(item => item.uuid && item.name.toUpperCase() === kind);
  if (!type?.uuid)
    throw new Error(`${kind.toLowerCase()} uploads are not available. Please try again later.`);
  if (
    type.mime_types.length &&
    !type.mime_types.some(value => {
      const accepted = value.toLowerCase();
      return (
        accepted === mime ||
        accepted === '*/*' ||
        (accepted.endsWith('/*') && mime.startsWith(accepted.slice(0, -1)))
      );
    })
  )
    throw new Error('This file format is not supported. Choose another file.');
  if (type.max_file_size_mb != null && file.size > type.max_file_size_mb * 1024 * 1024) {
    throw new Error(`Choose a file smaller than ${type.max_file_size_mb} MB.`);
  }
  return { type, mime };
}

export function sortLessonPages(contents: LessonContent[]) {
  return [...contents].sort(
    (a, b) =>
      (a.display_order ?? Number.MAX_SAFE_INTEGER) - (b.display_order ?? Number.MAX_SAFE_INTEGER)
  );
}

export function pageText(content?: LessonContent) {
  return content?.file_url
    ? (content.description ?? '')
    : content?.content_text || content?.description || '';
}

export function pageContentBody({
  content,
  lessonUuid,
  title,
  text,
  type,
  fileUrl,
  order,
}: {
  content?: LessonContent;
  lessonUuid: string;
  title: string;
  text: string;
  type: ContentType;
  fileUrl: string;
  order: number;
}): LessonContent {
  return {
    lesson_uuid: lessonUuid,
    content_type_uuid: type.uuid ?? '',
    title: title.trim(),
    // File pages keep rich text in description; text pages use content_text.
    description: fileUrl ? text : '',
    content_text: fileUrl ? null : text,
    file_url: fileUrl || null,
    display_order: order,
    is_required: content?.is_required ?? true,
  };
}
