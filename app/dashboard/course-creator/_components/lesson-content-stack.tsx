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
import { ArrowDown, ArrowUp, Eye, FileIcon, Pencil, Plus, Save, Trash2, UploadCloud, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LessonSavingOverlay, type LessonSaveProgress } from './LessonSavingOverlay';
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

function pageValidationError(values: PageValues, types: ContentType[]) {
  if (!values.title.trim()) return 'Enter a page title.';
  if (
    !values.file &&
    !values.fileUrl &&
    !values.text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() &&
    !/<img\b/i.test(values.text)
  ) {
    return 'Add page text or attach a file.';
  }
  if (values.file) {
    try {
      resolvePageAttachment(values.file, types);
    } catch (error) {
      return error instanceof Error ? error.message : 'Unable to attach this file.';
    }
  } else if (
    !values.fileUrl &&
    !types.some(type => type.uuid && type.name.toUpperCase() === 'TEXT')
  ) {
    return 'Page format is unavailable. Please reload and try again.';
  }
  return '';
}

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
        renderPages={(lesson, index, renderHeader, saveLesson) => (
          <LessonPages
            courseId={courseId}
            lesson={lesson}
            index={index}
            contents={(lesson?.uuid ? lessonContentsMap.get(lesson.uuid) : undefined) ?? EMPTY_CONTENTS}
            types={types}
            renderHeader={renderHeader}
            saveLesson={saveLesson}
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
  saveLesson,
  loading,
}: {
  courseId: string;
  lesson: CourseLesson | undefined;
  index: number;
  contents: LessonContent[];
  types: ContentType[];
  renderHeader: LessonHeaderRenderer;
  saveLesson: () => Promise<CourseLesson>;
  loading: boolean;
}) {
  const [pages, setPages] = useState<PageEntry[]>(() =>
    sortLessonPages(contents).flatMap(content =>
      content.uuid ? [{ key: content.uuid, createdAt: pageCreatedAt(content), content }] : []
    )
  );
  const pagesRef = useRef(pages);
  const commitPages = (next: PageEntry[]) => {
    pagesRef.current = next;
    setPages(next);
  };
  const stagedValues = useRef(new Map<string, { values: PageValues; dirty: boolean }>());
  const registerValues = useCallback((key: string, values: PageValues | null, dirty: boolean) => {
    if (values) stagedValues.current.set(key, { values, dirty });
    else stagedValues.current.delete(key);
  }, []);
  const [progress, setSaveProgress] = useState<LessonSaveProgress | null>(null);
  const [saveError, setSaveError] = useState('');
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
  // Retain a newly created lesson immediately, including when a later page fails.
  const savedLessonRef = useRef(lesson);
  useEffect(() => {
    if (lesson) savedLessonRef.current = lesson;
  }, [lesson]);
  const getPath = () => {
    const lessonUuid = savedLessonRef.current?.uuid;
    if (!lessonUuid) throw new Error('Save the lesson before changing saved pages.');
    return { courseUuid: courseId, lessonUuid };
  };
  const typeMap = useMemo(
    () =>
      Object.fromEntries(
        types.flatMap(type => (type.uuid ? [[type.uuid, type.name.toLowerCase()]] : []))
      ),
    [types]
  );

  useEffect(() => {
    if (busy) return;
    const current = pagesRef.current;
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
    if (added.length) commitPages([...current, ...added]);
  }, [contents, busy]);

  const closeEditor = (key: string) => {
    setEditingKeys(current => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };
  const refresh = () =>
    savedLessonRef.current
      ? qc.invalidateQueries({ queryKey: getLessonContentQueryKey({ path: getPath() }) })
      : Promise.resolve();
  const removeContent = async (contentUuid: string) => {
    const result = await remove.mutateAsync({ path: { ...getPath(), contentUuid } });
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
      if (ids.length) assertSuccess(await reorder.mutateAsync({ path: getPath(), body: ids }));
      setOrderFailed(false);
      return true;
    } catch {
      setOrderFailed(true);
      toast.error('Page order could not be saved. Use Retry order to try again.');
      return false;
    }
  };

  const startProgress = (pending: { entry: PageEntry; values: PageValues }[]) => {
    const steps: LessonSaveProgress['steps'] = [
      { key: 'lesson', label: savedLessonRef.current ? 'Saving lesson…' : 'Creating lesson…' },
    ];
    for (const { entry, values } of pending) {
      const pageNumber = pagesRef.current.findIndex(page => page.key === entry.key) + 1;
      const pageLabel = `page ${pageNumber} of ${pagesRef.current.length}`;
      const attachment = uploads.current.get(entry.key);
      if (attachment && attachment.file !== values.file) {
        steps.push({
          key: `${entry.key}-remove-attachment`,
          label: `Removing previous attachment (${pageLabel})…`,
        });
      }
      if (values.file && attachment?.file !== values.file) {
        steps.push({
          key: `${entry.key}-attachment`,
          label: `Adding content attachment (${pageLabel})…`,
        });
      }
      steps.push({
        key: `${entry.key}-content`,
        label: `${entry.content ? 'Saving' : 'Creating'} lesson content (${pageLabel})…`,
      });
      if (entry.content?.uuid && values.file) {
        steps.push({
          key: `${entry.key}-finish-attachment`,
          label: `Finishing content attachment (${pageLabel})…`,
        });
      }
    }
    steps.push(
      { key: 'order', label: 'Saving page order…' },
      { key: 'refresh', label: 'Refreshing lesson…' }
    );
    setSaveProgress({ steps, currentStep: 'lesson' });
  };
  const setProgress = (currentStep: string) => {
    setSaveProgress(current => (current ? { ...current, currentStep } : null));
  };

  const persistPage = async (entry: PageEntry, values: PageValues): Promise<LessonContent> => {
    const path = getPath();
    const pageNumber = pagesRef.current.findIndex(page => page.key === entry.key) + 1;
    let attachment = uploads.current.get(entry.key);
    if (attachment && attachment.file !== values.file) {
      if (!attachment.content.uuid) throw new Error('Uploaded page is missing its ID.');
      setProgress(`${entry.key}-remove-attachment`);
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
      setProgress(`${entry.key}-attachment`);
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
      lessonUuid: path.lessonUuid,
      title: values.title,
      text: values.text,
      type,
      fileUrl: attachment?.content.file_url || values.fileUrl,
      order: pageNumber,
    });
    const uuid = entry.content?.uuid ?? attachment?.content.uuid;
    setProgress(`${entry.key}-content`);
    const result = uuid
      ? await update.mutateAsync({ path: { ...path, contentUuid: uuid }, body })
      : await create.mutateAsync({ path, body });
    assertSuccess(result);
    const saved = result.data;
    if (!saved?.uuid) throw new Error('The saved page did not return an ID.');
    commitPages(
      pagesRef.current.map(page => (page.key === entry.key ? { ...page, content: saved } : page))
    );
    // Replacing media updates the original page, then removes the temporary upload row.
    if (attachment?.content.uuid && attachment.content.uuid !== saved.uuid) {
      setProgress(`${entry.key}-finish-attachment`);
      try {
        await removeContent(attachment.content.uuid);
      } catch {
        throw new Error(
          'Page saved, but the temporary upload could not be removed. Save again to retry.'
        );
      }
    }
    uploads.current.delete(entry.key);
    return saved;
  };

  const ensureLesson = async () => {
    setProgress('lesson');
    const saved = await saveLesson();
    savedLessonRef.current = saved;
  };
  const reportSaveError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unable to save this lesson.';
    setSaveError(message);
    toast.error(message);
  };
  const finishSaving = async () => {
    setProgress('order');
    await persistOrder(pagesRef.current);
    setProgress('refresh');
    await refresh();
  };
  const savePage = async (entry: PageEntry, values: PageValues): Promise<LessonContent | null> => {
    if (busyRef.current) return null;
    const validationError = pageValidationError(values, types);
    if (validationError) {
      reportSaveError(new Error(validationError));
      return null;
    }
    busyRef.current = true;
    setBusy(entry.key);
    setSaveError('');
    startProgress([{ entry, values }]);
    try {
      await ensureLesson();
      const saved = await persistPage(entry, values);
      await finishSaving();
      toast.success('Page saved');
      return saved;
    } catch (error) {
      reportSaveError(error);
      return null;
    } finally {
      busyRef.current = false;
      setBusy(null);
      setSaveProgress(null);
    }
  };
  const saveAllPages = async () => {
    if (busyRef.current) return;
    const pending = pagesRef.current.flatMap((entry, pageIndex) => {
      const staged = stagedValues.current.get(entry.key);
      return !entry.content || staged?.dirty ? [{ entry, pageIndex, values: staged?.values }] : [];
    });
    for (const page of pending) {
      const message = page.values ? pageValidationError(page.values, types) : 'Enter page content.';
      if (message) {
        reportSaveError(new Error(`Page ${page.pageIndex + 1}: ${message}`));
        return;
      }
    }
    busyRef.current = true;
    setBusy('all');
    setSaveError('');
    startProgress(
      pending.flatMap(page => (page.values ? [{ entry: page.entry, values: page.values }] : []))
    );
    try {
      await ensureLesson();
      for (const page of pending) {
        if (!page.values) continue;
        try {
          await persistPage(page.entry, page.values);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to save this page.';
          throw new Error(
            `Page ${page.pageIndex + 1}: ${message} Saved pages have been kept. Save again to continue.`
          );
        }
        // Keep completed pages saved if a later page fails, so retry resumes the remaining pages.
        stagedValues.current.delete(page.entry.key);
        closeEditor(page.entry.key);
      }
      await finishSaving();
      toast.success('Lesson and pages saved');
    } catch (error) {
      reportSaveError(error);
    } finally {
      busyRef.current = false;
      setBusy(null);
      setSaveProgress(null);
    }
  };
  const addPage = () => {
    if (busyRef.current || loading) return;
    const key = crypto.randomUUID();
    commitPages([...pagesRef.current, { key, createdAt: Date.now() }]);
    setEditingKeys(current => new Set(current).add(key));
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
    commitPages(next);
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
      commitPages(next);
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
          addPage,
          pagesBusy: !!busy || loading,
          savePages: () => void saveAllPages(),
        })}
        <LessonSavingOverlay progress={progress} />
        {saveError && <p role='alert' className='text-destructive text-sm'>{saveError}</p>}
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
                saving={(busy === entry.key || busy === 'all') && !deleteTarget}
                onSave={async values => {
                  const saved = await savePage(entry, values);
                  if (saved) closeEditor(entry.key);
                  return saved;
                }}
                onValuesChange={registerValues}
                onMove={direction => void movePage(pageIndex, direction)}
                onRemove={() => setDeleteTarget(entry)}
                onClose={entry.content ? () => closeEditor(entry.key) : undefined}
                onPreview={entry.content ? () => setViewing(entry.content ?? null) : undefined}
              />
            )}
          </div>
        ))}
        {pages.length > 0 && (
          <Button type='button' variant='outline' size='sm' disabled={!!busy || loading} onClick={addPage}>
            <Plus className='size-4' /> Add another page
          </Button>
        )}
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
  onValuesChange,
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
  onValuesChange: (key: string, values: PageValues | null, dirty: boolean) => void;
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
  useEffect(() => {
    onValuesChange(entry.key, { title, text, file, fileUrl }, dirty);
  }, [entry.key, title, text, file, fileUrl, dirty, onValuesChange]);
  useEffect(() => () => onValuesChange(entry.key, null, false), [entry.key, onValuesChange]);
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
    const validationError = pageValidationError({ title, text, file, fileUrl }, types);
    if (validationError) {
      setError(validationError);
      if (!title.trim()) titleRef.current?.focus();
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
