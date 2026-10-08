'use client';

import { LessonContentViewerDialog } from '@/components/content-preview/LessonContentPreview';
import DeleteModal from '@/components/custom-modals/delete-modal';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
  addLessonContentMutation,
  deleteLessonContentMutation,
  getAllContentTypesOptions,
  getLessonContentQueryKey,
  reorderLessonContentMutation,
  updateLessonContentMutation,
  uploadLessonMediaMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { ContentType, Lesson, LessonContent } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Eye, FileIcon, Pencil, Save, Trash2, UploadCloud, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LessonOutline, type LessonHeaderRenderer } from './lesson-outline';
import {
  pageContentBody,
  pageText,
  resolvePageAttachment,
  sortLessonPages,
} from './lesson-page-utils';

type CourseLesson = Lesson & { uuid: string };
type PageEntry = { key: string; createdAt: number; content?: LessonContent };
type PageValues = { title: string; text: string; file: File | null; fileUrl: string };
const EMPTY_CONTENTS: LessonContent[] = [];

function pageCreatedAt(content: LessonContent) {
  const timestamp = content.created_date ? new Date(content.created_date).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function assertSuccess(
  result: { error?: unknown; success?: boolean; message?: string } | undefined
) {
  if (!result || result.error || result.success === false) {
    throw new Error(result?.message || 'Unable to save changes. Please try again.');
  }
}

export function LessonContentStack({
  courseId,
  lessons,
  lessonContentsMap,
  isLoading,
  loadError = false,
  onRetry,
}: {
  courseId: string | null;
  lessons: CourseLesson[];
  lessonContentsMap: Map<string, LessonContent[]>;
  isLoading: boolean;
  loadError?: boolean;
  onRetry?: () => void;
}) {
  const typesQuery = useQuery({
    ...getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    enabled: !!courseId,
    staleTime: STALE_TIMES.reference,
  });
  const types = useMemo(() => {
    if (typesQuery.data?.error || typesQuery.data?.success === false) return [];
    return typesQuery.data?.data?.content ?? [];
  }, [typesQuery.data]);
  if (!courseId) return null;

  return (
    <div className='w-full min-w-0 space-y-4'>
      {typesQuery.isError || typesQuery.data?.error || typesQuery.data?.success === false ? (
        <EmptyState
          title='Unable to load page formats'
          description='Try again to enable page saving and attachments.'
          action={
            <Button variant='outline' onClick={() => void typesQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : null}
      {loadError && (
        <EmptyState
          title='Unable to load lesson pages'
          description='Try again before editing pages.'
          action={
            <Button variant='outline' onClick={onRetry}>
              Try again
            </Button>
          }
        />
      )}
      <LessonOutline
        key={courseId}
        courseId={courseId}
        lessons={lessons}
        isLoading={isLoading}
        renderPages={(lesson, index, renderHeader) => (
          <LessonPages
            courseId={courseId}
            lesson={lesson}
            index={index}
            contents={lessonContentsMap.get(lesson.uuid) ?? EMPTY_CONTENTS}
            types={types}
            renderHeader={renderHeader}
            loading={isLoading || loadError}
          />
        )}
      />
    </div>
  );
}

function LessonPages({
  courseId,
  lesson,
  index,
  contents,
  types,
  renderHeader,
  loading,
}: {
  courseId: string;
  lesson: CourseLesson;
  index: number;
  contents: LessonContent[];
  types: ContentType[];
  renderHeader: LessonHeaderRenderer;
  loading: boolean;
}) {
  const [pages, setPages] = useState<PageEntry[]>(() =>
    sortLessonPages(contents).flatMap(content =>
      content.uuid ? [{ key: content.uuid, createdAt: pageCreatedAt(content), content }] : []
    )
  );
  const [editingKeys, setEditingKeys] = useState<Set<string>>(() => new Set());
  // Newest first in the editor; retain the lesson's learning order and page numbers.
  const listedPages = useMemo(
    () =>
      pages
        .map((entry, pageIndex) => ({ entry, pageIndex }))
        .sort((a, b) => b.entry.createdAt - a.entry.createdAt || b.pageIndex - a.pageIndex),
    [pages]
  );
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [orderFailed, setOrderFailed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PageEntry | null>(null);
  const [viewing, setViewing] = useState<LessonContent | null>(null);
  // The upload endpoint creates a content row. Retain it across retries to avoid duplicates.
  const uploads = useRef(new Map<string, { file: File; content: LessonContent }>());
  const removedIds = useRef(new Set<string>());
  const qc = useQueryClient();
  const create = useMutation(addLessonContentMutation());
  const update = useMutation(updateLessonContentMutation());
  const upload = useMutation(uploadLessonMediaMutation());
  const remove = useMutation(deleteLessonContentMutation());
  const reorder = useMutation(reorderLessonContentMutation());
  const path = { courseUuid: courseId, lessonUuid: lesson.uuid };
  const queryKey = getLessonContentQueryKey({ path });
  const typeMap = useMemo(
    () =>
      Object.fromEntries(
        types.flatMap(type => (type.uuid ? [[type.uuid, type.name.toLowerCase()]] : []))
      ),
    [types]
  );

  useEffect(() => {
    if (busy) return;
    setPages(current => {
      const known = new Set(current.map(page => page.content?.uuid));
      const staged = new Set([...uploads.current.values()].map(item => item.content.uuid));
      const added = sortLessonPages(contents).flatMap(content =>
        content.uuid &&
          !known.has(content.uuid) &&
          !staged.has(content.uuid) &&
          !removedIds.current.has(content.uuid)
          ? [{ key: content.uuid, createdAt: pageCreatedAt(content), content }]
          : []
      );
      return added.length ? [...current, ...added] : current;
    });
  }, [contents, busy]);

  const closeEditor = (key: string) => {
    setEditingKeys(current => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };
  const refresh = () => qc.invalidateQueries({ queryKey });
  const removeContent = async (contentUuid: string) => {
    const result = await remove.mutateAsync({ path: { ...path, contentUuid } });
    if (
      result &&
      typeof result === 'object' &&
      (('error' in result && result.error) || ('success' in result && result.success === false))
    ) {
      throw new Error('Unable to remove this page. Please try again.');
    }
    removedIds.current.add(contentUuid);
  };
  const persistOrder = async (next: PageEntry[]) => {
    const ids = next.flatMap(page => (page.content?.uuid ? [page.content.uuid] : []));
    try {
      if (ids.length) assertSuccess(await reorder.mutateAsync({ path, body: ids }));
      setOrderFailed(false);
      return true;
    } catch {
      setOrderFailed(true);
      toast.error('Page order could not be saved. Use Retry order to try again.');
      return false;
    }
  };

  const savePage = async (entry: PageEntry, values: PageValues): Promise<LessonContent | null> => {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(entry.key);
    try {
      let attachment = uploads.current.get(entry.key);
      if (attachment && attachment.file !== values.file) {
        if (!attachment.content.uuid) throw new Error('Uploaded page is missing its ID.');
        await removeContent(attachment.content.uuid);
        uploads.current.delete(entry.key);
        attachment = undefined;
      }
      const detected = values.file ? resolvePageAttachment(values.file, types) : null;
      const type =
        detected?.type ??
        (values.fileUrl
          ? types.find(item => item.uuid === entry.content?.content_type_uuid)
          : types.find(item => item.name.toUpperCase() === 'TEXT'));
      if (!type?.uuid) throw new Error('Page format is unavailable. Please reload and try again.');
      if (values.file && !attachment) {
        const file =
          values.file.type === detected?.mime
            ? values.file
            : new File([values.file], values.file.name, { type: detected?.mime });
        const result = await upload.mutateAsync({
          path,
          body: { file },
          query: {
            content_type_uuid: type.uuid,
            title: values.title.trim(),
            is_required: entry.content?.is_required ?? true,
          },
        });
        assertSuccess(result);
        if (!result.data?.uuid || !result.data.file_url)
          throw new Error('The upload did not return a page and file location.');
        attachment = { file: values.file, content: result.data };
        uploads.current.set(entry.key, attachment);
      }
      const body = pageContentBody({
        content: entry.content,
        lessonUuid: lesson.uuid,
        title: values.title,
        text: values.text,
        type,
        fileUrl: attachment?.content.file_url || values.fileUrl,
        order: pages.findIndex(page => page.key === entry.key) + 1,
      });
      const uuid = entry.content?.uuid ?? attachment?.content.uuid;
      const result = uuid
        ? await update.mutateAsync({ path: { ...path, contentUuid: uuid }, body })
        : await create.mutateAsync({ path, body });
      assertSuccess(result);
      const saved = result.data;
      if (!saved?.uuid) throw new Error('The saved page did not return an ID.');
      const next = pages.map(page => (page.key === entry.key ? { ...page, content: saved } : page));
      setPages(next);
      // Replacing media updates the original page, then removes the temporary upload row.
      if (attachment?.content.uuid && attachment.content.uuid !== saved.uuid) {
        try {
          await removeContent(attachment.content.uuid);
          uploads.current.delete(entry.key);
        } catch {
          toast.error(
            'Page saved, but the temporary upload could not be removed. Save the page again to retry.'
          );
          return saved;
        }
      } else {
        uploads.current.delete(entry.key);
      }
      await persistOrder(next);
      await refresh();
      toast.success('Page saved');
      return saved;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save this page.');
      return null;
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const movePage = async (pageIndex: number, direction: -1 | 1) => {
    const target = pageIndex + direction;
    if (busyRef.current || target < 0 || target >= pages.length) return;
    const next = [...pages];
    const source = next[pageIndex];
    const destination = next[target];
    if (!source || !destination) return;
    next[pageIndex] = destination;
    next[target] = source;
    busyRef.current = true;
    setBusy('order');
    setPages(next);
    try {
      if (await persistOrder(next)) await refresh();
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const deletePage = async () => {
    if (!deleteTarget || busyRef.current) return;
    busyRef.current = true;
    setBusy(deleteTarget.key);
    try {
      const stagedUuid = uploads.current.get(deleteTarget.key)?.content.uuid;
      if (stagedUuid && stagedUuid !== deleteTarget.content?.uuid) {
        await removeContent(stagedUuid);
        uploads.current.delete(deleteTarget.key);
      }
      if (deleteTarget.content?.uuid) await removeContent(deleteTarget.content.uuid);
      const next = pages.filter(page => page.key !== deleteTarget.key);
      setPages(next);
      closeEditor(deleteTarget.key);
      setDeleteTarget(null);
      await persistOrder(next);
      await refresh();
      toast.success('Page removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to remove this page.');
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  return (
    <Card className='gap-0 rounded-md py-0'>
      <CardContent className='space-y-3 p-3'>
        {renderHeader({
          pageCount: pages.length,
          addPage: () => {
            const key = crypto.randomUUID();
            setPages(current => [...current, { key, createdAt: Date.now() }]);
            setEditingKeys(current => new Set(current).add(key));
          },
          pagesBusy: !!busy || loading,
        })}
        {!pages.length && (
          <EmptyState
            variant='plain'
            title='No pages yet'
            description='Add a page to write lesson text and attach a file.'
          />
        )}
        {listedPages.map(({ entry, pageIndex }) => (
          <div key={entry.key} className='space-y-2'>
            {entry.content && (
              <div className='border-border flex min-w-0 flex-wrap items-center gap-2 rounded-md border px-3 py-2'>
                <Badge variant='outline' className='shrink-0'>Page {pageIndex + 1}</Badge>
                <span className='min-w-0 flex-1 truncate text-sm font-medium' title={entry.content.title}>
                  {entry.content.title}
                </span>
                <div className='ml-auto flex shrink-0 items-center gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    disabled={!!busy || loading}
                    aria-label={`View page ${pageIndex + 1}: ${entry.content.title}`}
                    onClick={() => setViewing(entry.content ?? null)}
                  >
                    <Eye className='size-4' /> View
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={!!busy || loading || editingKeys.has(entry.key)}
                    aria-label={`Edit page ${pageIndex + 1}: ${entry.content.title}`}
                    aria-expanded={editingKeys.has(entry.key)}
                    aria-controls={`page-editor-${entry.key}`}
                    onClick={() => setEditingKeys(current => new Set(current).add(entry.key))}
                  >
                    <Pencil className='size-4' /> Edit
                  </Button>
                </div>
              </div>
            )}
            {(!entry.content || editingKeys.has(entry.key)) && (
              <LessonPageEditor
                entry={entry}
                pageIndex={pageIndex}
                lessonIndex={index}
                last={pageIndex === pages.length - 1}
                types={types}
                disabled={!!busy || loading}
                saving={busy === entry.key && !deleteTarget}
                onSave={async values => {
                  const saved = await savePage(entry, values);
                  if (saved) closeEditor(entry.key);
                  return saved;
                }}
                onMove={direction => void movePage(pageIndex, direction)}
                onRemove={() => setDeleteTarget(entry)}
                onClose={entry.content ? () => closeEditor(entry.key) : undefined}
                onPreview={entry.content ? () => setViewing(entry.content ?? null) : undefined}
              />
            )}
          </div>
        ))}
        {orderFailed && (
          <div className='text-destructive flex items-center gap-2 text-sm' role='alert'>
            Page order has not been saved.
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={!!busy || loading}
              onClick={async () => {
                if (busyRef.current) return;
                busyRef.current = true;
                setBusy('order');
                try {
                  if (await persistOrder(pages)) await refresh();
                } finally {
                  busyRef.current = false;
                  setBusy(null);
                }
              }}
            >
              {busy === 'order' && <Spinner />} Retry order
            </Button>
          </div>
        )}
      </CardContent>
      <LessonContentViewerDialog
        open={!!viewing}
        onOpenChange={open => {
          if (!open) setViewing(null);
        }}
        content={viewing}
        contentTypeMap={typeMap}
      />
      <DeleteModal
        open={!!deleteTarget}
        setOpen={open => {
          if (!open && !busy) setDeleteTarget(null);
        }}
        title='Remove page?'
        description='This page and its content will be removed from the lesson.'
        onConfirm={() => void deletePage()}
        isLoading={!!busy}
        confirmText='Remove page'
      />
    </Card>
  );
}

function LessonPageEditor({
  entry,
  pageIndex,
  lessonIndex,
  last,
  types,
  disabled,
  saving,
  onSave,
  onMove,
  onRemove,
  onClose,
  onPreview,
}: {
  entry: PageEntry;
  pageIndex: number;
  lessonIndex: number;
  last: boolean;
  types: ContentType[];
  disabled: boolean;
  saving: boolean;
  onSave: (values: PageValues) => Promise<LessonContent | null>;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onClose?: () => void;
  onPreview?: () => void;
}) {
  const [title, setTitle] = useState(entry.content?.title ?? '');
  const [text, setText] = useState(pageText(entry.content));
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState(entry.content?.file_url ?? '');
  const [dirty, setDirty] = useState(!entry.content);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const textLabelId = `page-text-${entry.key}`;
  const errorId = `page-error-${entry.key}`;
  const attach = (files: FileList | null) => {
    if (disabled || !files?.length) return;
    if (files.length !== 1) {
      setError('Attach one file per page.');
      return;
    }
    const selected = files[0];
    if (!selected) return;
    try {
      resolvePageAttachment(selected, types);
      setFile(selected);
      setDirty(true);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to attach this file.');
    }
  };
  const submit = async () => {
    if (!title.trim()) {
      setError('Enter a page title.');
      titleRef.current?.focus();
      return;
    }
    if (
      !file &&
      !fileUrl &&
      !text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, '')
        .trim() &&
      !/<img\b/i.test(text)
    ) {
      setError('Add page text or attach a file.');
      return;
    }
    setError('');
    const saved = await onSave({ title, text, file, fileUrl });
    if (saved) {
      setFile(null);
      setFileUrl(saved.file_url ?? '');
      setDirty(false);
    }
  };
  const attachmentUrl = fileUrl ? toAuthenticatedMediaUrl(fileUrl) : null;

  return (
    <div
      id={`page-editor-${entry.key}`}
      className='border-border bg-muted/20 flex min-w-0 flex-col gap-3 rounded-md border p-3'
      aria-busy={saving}
    >
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='outline'>Page {pageIndex + 1}</Badge>
        <Input
          ref={titleRef}
          value={title}
          disabled={disabled}
          onChange={event => {
            setTitle(event.target.value);
            setDirty(true);
          }}
          className='min-w-40 flex-1'
          placeholder='Subtopic'
          aria-label={`Lesson ${lessonIndex + 1} page ${pageIndex + 1} title`}
        />
        <div className='flex items-center'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={`Move page ${pageIndex + 1} up`}
            disabled={disabled || pageIndex === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className='size-4' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={`Move page ${pageIndex + 1} down`}
            disabled={disabled || last}
            onClick={() => onMove(1)}
          >
            <ArrowDown className='size-4' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={`Remove page ${pageIndex + 1}`}
            disabled={disabled}
            onClick={onRemove}
          >
            <Trash2 className='text-destructive size-4' />
          </Button>
        </div>
      </div>
      <div className='space-y-1.5'>
        <p id={textLabelId} className='text-sm font-medium'>
          Page text
        </p>
        <div
          role='group'
          aria-labelledby={textLabelId}
          inert={disabled}
          className='[&_.simple-editor]:!bg-card [&_.simple-editor]:text-foreground [&_.tiptap-toolbar]:!bg-card min-w-0 [&_.simple-editor]:min-h-40 [&_.simple-editor]:!p-4 [&_.tiptap-toolbar]:!relative'
        >
          <SimpleEditor
            value={text}
            onChange={value => {
              if (value !== text) {
                setText(value);
                setDirty(true);
              }
            }}
            isEditable={!disabled}
          />
        </div>
      </div>
      <div
        onDragOver={event => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          attach(event.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-5 text-center',
          dragging ? 'border-primary bg-primary/5' : 'border-border'
        )}
      >
        <UploadCloud className='text-muted-foreground size-5' />
        <p className='text-muted-foreground text-sm'>
          Drag and drop one image, PDF, video, or audio file for this page.
        </p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled || !types.length}
          onClick={() => inputRef.current?.click()}
        >
          {file || fileUrl ? 'Replace file' : 'Browse files'}
        </Button>
        <Input
          ref={inputRef}
          type='file'
          className='sr-only'
          tabIndex={-1}
          disabled={disabled || !types.length}
          accept='image/*,application/pdf,video/*,audio/*'
          aria-label={`Attach a file to page ${pageIndex + 1}`}
          aria-describedby={error ? errorId : undefined}
          onChange={event => {
            attach(event.target.files);
            event.target.value = '';
          }}
        />
      </div>
      {(file || fileUrl) && (
        <div className='bg-background flex items-center gap-2 rounded-md border px-3 py-2'>
          <FileIcon className='text-primary size-4 shrink-0' />
          <span className='min-w-0 flex-1 truncate text-sm'>{file?.name ?? 'Attached file'}</span>
          {file && (
            <span className='text-muted-foreground text-xs'>
              {file.size < 1024 * 1024
                ? `${(file.size / 1024).toFixed(1)} KB`
                : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
            </span>
          )}
          {!file && attachmentUrl && (
            <Button type='button' asChild variant='ghost' size='sm'>
              <a href={attachmentUrl} target='_blank' rel='noreferrer'>
                Open file
              </a>
            </Button>
          )}
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={`Remove attachment from page ${pageIndex + 1}`}
            disabled={disabled}
            onClick={() => {
              setFile(null);
              setFileUrl('');
              setDirty(true);
            }}
          >
            <X className='size-4' />
          </Button>
        </div>
      )}
      {error && (
        <p id={errorId} className='text-destructive text-sm' role='alert'>
          {error}
        </p>
      )}
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-muted-foreground text-xs'>{dirty ? 'Unsaved changes' : 'Saved'}</span>
        <div className='flex items-center gap-2'>
          {onClose && (
            <Button type='button' variant='ghost' size='sm' disabled={disabled} onClick={onClose}>
              Cancel
            </Button>
          )}
          {onPreview && (
            <Button type='button' variant='ghost' size='sm' disabled={disabled} onClick={onPreview}>
              <Eye className='size-4' /> View saved page
            </Button>
          )}
          <Button
            type='button'
            size='sm'
            disabled={disabled || !types.length}
            onClick={() => void submit()}
          >
            {saving ? <Spinner /> : <Save className='size-4' />}
            {saving ? 'Saving…' : 'Save page'}
          </Button>
        </div>
      </div>
    </div>
  );
}
