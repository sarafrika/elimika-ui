'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import DeleteModal from '@/components/custom-modals/delete-modal';
import {
  createPracticeActivityMutation,
  deletePracticeActivityMutation,
  getPracticeActivitiesOptions,
  getPracticeActivitiesQueryKey,
  reorderPracticeActivitiesMutation,
  updatePracticeActivityMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  ActivityTypeEnum,
  GroupingEnum,
  type LessonPracticeActivity,
  type PageMetadata,
  SchemaEnum4,
} from '@/services/client/types.gen';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  EyeOff,
  GripVertical,
  ListOrdered,
  MoreVertical,
  PenLine,
  PlusCircle,
  Trash,
  Users,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

const PRACTICE_ACTIVITY_PAGE_SIZE = 10;

type PracticeActivityFormValues = {
  title: string;
  instructions: string;
  activity_type: LessonPracticeActivity['activity_type'];
  grouping: LessonPracticeActivity['grouping'];
  estimated_minutes: string;
  materials: string;
  expected_output: string;
  display_order: string;
  status: LessonPracticeActivity['status'];
  active: boolean;
};

const defaultPracticeActivityFormValues = (): PracticeActivityFormValues => ({
  title: '',
  instructions: '',
  activity_type: ActivityTypeEnum.EXERCISE,
  grouping: GroupingEnum.INDIVIDUAL,
  estimated_minutes: '',
  materials: '',
  expected_output: '',
  display_order: '',
  status: SchemaEnum4.DRAFT,
  active: false,
});

const getPracticeActivityFormValues = (
  activity?: LessonPracticeActivity | null
): PracticeActivityFormValues => {
  if (!activity) return defaultPracticeActivityFormValues();

  return {
    title: activity.title ?? '',
    instructions: activity.instructions ?? '',
    activity_type: activity.activity_type ?? ActivityTypeEnum.EXERCISE,
    grouping: activity.grouping ?? GroupingEnum.INDIVIDUAL,
    estimated_minutes: activity.estimated_minutes?.toString() ?? '',
    materials: activity.materials?.join('\n') ?? '',
    expected_output: activity.expected_output ?? '',
    display_order: activity.display_order?.toString() ?? '',
    status: activity.status ?? SchemaEnum4.DRAFT,
    active: activity.active ?? false,
  };
};

const getDisplayLabel = (value?: string) =>
  value
    ? value
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, character => character.toUpperCase())
    : 'Not set';

const getMaterialsList = (value: string) =>
  value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }

  return fallback;
};

const buildPracticeActivityPayload = (
  values: PracticeActivityFormValues
): LessonPracticeActivity => ({
  title: values.title.trim(),
  instructions: values.instructions.trim(),
  activity_type: values.activity_type,
  grouping: values.grouping,
  estimated_minutes: values.estimated_minutes ? Number(values.estimated_minutes) : undefined,
  materials: getMaterialsList(values.materials),
  expected_output: values.expected_output.trim() || undefined,
  display_order: values.display_order ? Number(values.display_order) : undefined,
  status: values.status,
  active: values.status === SchemaEnum4.PUBLISHED ? values.active : false,
});

type PracticeActivityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: LessonPracticeActivity | null;
  isSubmitting: boolean;
  onSubmit: (payload: LessonPracticeActivity) => Promise<void>;
};

function PracticeActivityDialog({
  open,
  onOpenChange,
  activity,
  isSubmitting,
  onSubmit,
}: PracticeActivityDialogProps) {
  const [values, setValues] = useState<PracticeActivityFormValues>(
    getPracticeActivityFormValues(activity)
  );

  useEffect(() => {
    if (open) {
      setValues(getPracticeActivityFormValues(activity));
    }
  }, [activity, open]);

  const setValue = <TKey extends keyof PracticeActivityFormValues>(
    key: TKey,
    value: PracticeActivityFormValues[TKey]
  ) => {
    setValues(current => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.title.trim()) {
      toast.error('Practice activity title is required');
      return;
    }

    if (!values.instructions.trim()) {
      toast.error('Practice activity instructions are required');
      return;
    }

    if (values.estimated_minutes && Number(values.estimated_minutes) < 1) {
      toast.error('Estimated minutes must be at least 1');
      return;
    }

    if (values.display_order && Number(values.display_order) < 1) {
      toast.error('Display order must be at least 1');
      return;
    }

    await onSubmit(buildPracticeActivityPayload(values));
  };

  const isPublished = values.status === SchemaEnum4.PUBLISHED;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {activity?.uuid ? 'Edit Practice Activity' : 'Add Practice Activity'}
          </DialogTitle>
          <DialogDescription>
            Capture a reusable class-practice activity for this skill.
          </DialogDescription>
        </DialogHeader>

        <form className='space-y-5' onSubmit={handleSubmit}>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='practice-title'>Title</Label>
              <Input
                id='practice-title'
                value={values.title}
                onChange={event => setValue('title', event.target.value)}
                placeholder='Group discussion on customer discovery'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-type'>Activity Type</Label>
              <Select
                value={values.activity_type}
                onValueChange={value =>
                  setValue('activity_type', value as LessonPracticeActivity['activity_type'])
                }
              >
                <SelectTrigger id='practice-type' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ActivityTypeEnum).map(option => (
                    <SelectItem key={option} value={option}>
                      {getDisplayLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-grouping'>Grouping</Label>
              <Select
                value={values.grouping}
                onValueChange={value =>
                  setValue('grouping', value as LessonPracticeActivity['grouping'])
                }
              >
                <SelectTrigger id='practice-grouping' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(GroupingEnum).map(option => (
                    <SelectItem key={option} value={option}>
                      {getDisplayLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-estimated-minutes'>Estimated Minutes</Label>
              <Input
                id='practice-estimated-minutes'
                min={1}
                type='number'
                value={values.estimated_minutes}
                onChange={event => setValue('estimated_minutes', event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-display-order'>Display Order</Label>
              <Input
                id='practice-display-order'
                min={1}
                type='number'
                value={values.display_order}
                onChange={event => setValue('display_order', event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-status'>Status</Label>
              <Select
                value={values.status}
                onValueChange={value =>
                  setValue('status', value as LessonPracticeActivity['status'])
                }
              >
                <SelectTrigger id='practice-status' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SchemaEnum4).map(option => (
                    <SelectItem key={option} value={option}>
                      {getDisplayLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center justify-between gap-4 rounded-md border px-3 py-2'>
              <Label htmlFor='practice-active' className='text-sm font-medium'>
                Visible
              </Label>
              <Switch
                id='practice-active'
                checked={isPublished && values.active}
                disabled={!isPublished}
                onCheckedChange={checked => setValue('active', checked)}
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='practice-instructions'>Instructions</Label>
              <Textarea
                id='practice-instructions'
                rows={4}
                value={values.instructions}
                onChange={event => setValue('instructions', event.target.value)}
                placeholder='Explain how the facilitator should run the activity.'
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='practice-materials'>Materials</Label>
              <Textarea
                id='practice-materials'
                rows={3}
                value={values.materials}
                onChange={event => setValue('materials', event.target.value)}
                placeholder='Add one material, link, or handout per line.'
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='practice-output'>Expected Output</Label>
              <Textarea
                id='practice-output'
                rows={3}
                value={values.expected_output}
                onChange={event => setValue('expected_output', event.target.value)}
                placeholder='Describe what learners should produce or discuss.'
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ActivityCardBodyProps = {
  activity: LessonPracticeActivity;
  hideStatusBadges?: boolean;
};

function ActivityCardBody({ activity, hideStatusBadges }: ActivityCardBodyProps) {
  return (
    <div className='min-w-0 space-y-3'>
      <div className='space-y-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='text-foreground text-base font-semibold'>{activity.title}</h3>
          {!hideStatusBadges && (
            <>
              <Badge variant={activity.active ? 'success' : 'outline'}>
                {activity.active ? 'Visible' : 'Hidden'}
              </Badge>
              <Badge variant='secondary'>{getDisplayLabel(activity.status)}</Badge>
            </>
          )}
        </div>
        <p className='text-muted-foreground line-clamp-3 text-sm'>{activity.instructions}</p>
      </div>

      <div className='text-muted-foreground flex flex-wrap gap-3 text-sm'>
        <span className='flex items-center gap-1'>
          <ClipboardList className='h-4 w-4' />
          {getDisplayLabel(activity.activity_type)}
        </span>
        <span className='flex items-center gap-1'>
          <Users className='h-4 w-4' />
          {getDisplayLabel(activity.grouping)}
        </span>
        <span className='flex items-center gap-1'>
          <Clock className='h-4 w-4' />
          {activity.estimated_duration ?? 'Duration not set'}
        </span>
        <span className='flex items-center gap-1'>
          <ListOrdered className='h-4 w-4' />
          Order {activity.display_order ?? '-'}
        </span>
      </div>

      {activity.materials && activity.materials.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {activity.materials.map(material => (
            <Badge key={material} variant='outline'>
              {material}
            </Badge>
          ))}
        </div>
      )}

      {activity.expected_output && (
        <p className='text-muted-foreground text-sm'>
          <span className='text-foreground font-medium'>Output:</span> {activity.expected_output}
        </p>
      )}
    </div>
  );
}

type SortablePracticeActivityCardProps = {
  activity: LessonPracticeActivity;
  isReordering: boolean;
  onEdit: (activity: LessonPracticeActivity) => void;
  onDelete: (activity: LessonPracticeActivity) => void;
};

function SortablePracticeActivityCard({
  activity,
  isReordering,
  onEdit,
  onDelete,
}: SortablePracticeActivityCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.uuid ?? '',
    disabled: !activity.uuid || isReordering,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex w-full flex-col gap-4 rounded-2xl border border-border bg-card/80 p-4 shadow-lg dark:border-border/70 dark:bg-card/70 ${
        isDragging ? 'ring-2 ring-primary/20 shadow-xl' : ''
      }`}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex min-w-0 flex-1 gap-3'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            disabled={!activity.uuid || isReordering}
            className='text-muted-foreground hover:text-foreground mt-1 h-9 w-9 cursor-grab active:cursor-grabbing'
            aria-label={`Reorder ${activity.title || 'activity'}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className='h-4 w-4' />
          </Button>
          <div className='bg-primary/10 text-primary mt-1 rounded-full p-2'>
            <ClipboardList className='h-5 w-5' />
          </div>
          <ActivityCardBody activity={activity} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='opacity-0 transition-opacity group-hover:opacity-100'
              aria-label='Practice activity actions'
            >
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => onEdit(activity)}>
              <PenLine className='mr-1 h-4 w-4' />
              Edit Activity
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='text-destructive' onClick={() => onDelete(activity)}>
              <Trash className='mr-1 h-4 w-4' />
              Delete Activity
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export type PracticeActivityManagerProps = {
  courseUuid: string | null | undefined;
  lessonUuid: string | null | undefined;
  showHeader?: boolean;
};

export function PracticeActivityManager({
  courseUuid,
  lessonUuid,
  showHeader = true,
}: PracticeActivityManagerProps) {
  const qc = useQueryClient();

  const [practicePage, setPracticePage] = useState(0);
  const [openPracticeActivityModal, setOpenPracticeActivityModal] = useState(false);
  const [openDeletePracticeActivityModal, setOpenDeletePracticeActivityModal] = useState(false);
  const [editingPracticeActivity, setEditingPracticeActivity] =
    useState<LessonPracticeActivity | null>(null);
  const [editingPracticeActivityId, setEditingPracticeActivityId] = useState<string | null>(null);

  const enabled = Boolean(courseUuid && lessonUuid);
  const practiceActivityListRequest = {
    path: { courseUuid: courseUuid as string, lessonUuid: lessonUuid as string },
    query: { pageable: { page: practicePage, size: PRACTICE_ACTIVITY_PAGE_SIZE } },
  };
  const practiceActivitiesQueryKey = getPracticeActivitiesQueryKey(practiceActivityListRequest);
  const practiceActivitiesOptions = getPracticeActivitiesOptions(practiceActivityListRequest);
  const { data: practiceActivitiesData, isFetching: practiceActivitiesIsFetching } = useQuery({
    ...practiceActivitiesOptions,
    enabled,
  });

  const practiceActivities = (practiceActivitiesData?.data?.content ??
    []) as LessonPracticeActivity[];
  const practiceMetadata = practiceActivitiesData?.data?.metadata as PageMetadata | undefined;

  const [orderedPracticeActivities, setOrderedPracticeActivities] = useState<
    LessonPracticeActivity[]
  >([]);

  useEffect(() => {
    setOrderedPracticeActivities(practiceActivities);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceActivitiesData]);

  const practiceSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const createPracticeActivity = useMutation(createPracticeActivityMutation());
  const updatePracticeActivity = useMutation(updatePracticeActivityMutation());
  const deletePracticeActivity = useMutation(deletePracticeActivityMutation());

  const reorderPracticeActivities = useMutation({
    ...reorderPracticeActivitiesMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: practiceActivitiesQueryKey });
    },
    onError: error => {
      toast.error(getErrorMessage(error, 'Unable to reorder practice activities'));
      qc.invalidateQueries({ queryKey: practiceActivitiesQueryKey });
    },
  });

  const handlePracticeActivityDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || reorderPracticeActivities.isPending) return;
    if (!courseUuid || !lessonUuid) return;

    const oldIndex = orderedPracticeActivities.findIndex(item => item.uuid === active.id);
    const newIndex = orderedPracticeActivities.findIndex(item => item.uuid === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(orderedPracticeActivities, oldIndex, newIndex);
    setOrderedPracticeActivities(reordered);

    const orderedUuids = reordered.map(item => item.uuid).filter((uuid): uuid is string => !!uuid);
    if (orderedUuids.length !== reordered.length) return;

    reorderPracticeActivities.mutate({
      body: orderedUuids,
      path: { courseUuid, lessonUuid },
    });
  };

  const closePracticeActivityModal = () => {
    setEditingPracticeActivity(null);
    setEditingPracticeActivityId(null);
    setOpenPracticeActivityModal(false);
  };

  const handleAddPracticeActivity = () => {
    setEditingPracticeActivity(null);
    setEditingPracticeActivityId(null);
    setOpenPracticeActivityModal(true);
  };

  const handleEditPracticeActivity = (activity: LessonPracticeActivity) => {
    setEditingPracticeActivity(activity);
    setEditingPracticeActivityId(activity.uuid ?? null);
    setOpenPracticeActivityModal(true);
  };

  const handleDeletePracticeActivity = (activity: LessonPracticeActivity) => {
    setEditingPracticeActivity(activity);
    setEditingPracticeActivityId(activity.uuid ?? null);
    setOpenDeletePracticeActivityModal(true);
  };

  const handleSavePracticeActivity = async (payload: LessonPracticeActivity) => {
    if (!courseUuid || !lessonUuid) return;

    try {
      if (editingPracticeActivityId) {
        await updatePracticeActivity.mutateAsync({
          body: payload,
          path: {
            courseUuid,
            lessonUuid,
            activityUuid: editingPracticeActivityId,
          },
        });
        toast.success('Practice activity updated successfully');
      } else {
        await createPracticeActivity.mutateAsync({
          body: payload,
          path: { courseUuid, lessonUuid },
        });
        setPracticePage(0);
        toast.success('Practice activity created successfully');
      }

      await qc.invalidateQueries({ queryKey: practiceActivitiesQueryKey });
      closePracticeActivityModal();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save practice activity'));
    }
  };

  const confirmDeletePracticeActivity = async () => {
    if (!courseUuid || !lessonUuid || !editingPracticeActivityId) return;

    try {
      await deletePracticeActivity.mutateAsync({
        path: {
          courseUuid,
          lessonUuid,
          activityUuid: editingPracticeActivityId,
        },
      });
      await qc.invalidateQueries({ queryKey: practiceActivitiesQueryKey });
      toast.success('Practice activity deleted successfully');
      setOpenDeletePracticeActivityModal(false);
      setEditingPracticeActivity(null);
      setEditingPracticeActivityId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete practice activity'));
    }
  };

  const practicePageNumber = practiceMetadata?.pageNumber ?? practicePage;
  const practiceTotalPages = practiceMetadata?.totalPages ?? 1;
  const practiceTotalElements = Number(
    practiceMetadata?.totalElements ?? practiceActivities.length
  );
  const hasPracticePrevious = practiceMetadata?.hasPrevious ?? practicePage > 0;
  const hasPracticeNext =
    practiceMetadata?.hasNext ?? practicePageNumber + 1 < practiceTotalPages;

  if (!enabled) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
        <p className='font-medium'>You need to save the lesson first to add practice activities.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {showHeader && (
        <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-lg font-semibold'>Class Practice Activities</p>
            <p className='text-muted-foreground text-sm'>
              Manage reusable class practice activities tied to this skill.
            </p>
          </div>
          <Button
            onClick={handleAddPracticeActivity}
            variant='secondary'
            size='sm'
            className='flex w-fit items-center gap-1'
          >
            <PlusCircle className='h-4 w-4' />
            Add Activity
          </Button>
        </div>
      )}

      {!showHeader && (
        <div className='flex justify-end'>
          <Button
            onClick={handleAddPracticeActivity}
            variant='secondary'
            size='sm'
            className='flex w-fit items-center gap-1'
          >
            <PlusCircle className='h-4 w-4' />
            Add Activity
          </Button>
        </div>
      )}

      {practiceActivitiesIsFetching ? (
        <p className='text-muted-foreground text-sm'>Loading practice activities...</p>
      ) : orderedPracticeActivities.length > 0 ? (
        <DndContext
          sensors={practiceSensors}
          collisionDetection={closestCenter}
          onDragEnd={handlePracticeActivityDragEnd}
        >
          <SortableContext
            items={orderedPracticeActivities.map(item => item.uuid ?? '')}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-4'>
              {orderedPracticeActivities.map(activity => (
                <SortablePracticeActivityCard
                  key={activity.uuid}
                  activity={activity}
                  isReordering={reorderPracticeActivities.isPending}
                  onEdit={handleEditPracticeActivity}
                  onDelete={handleDeletePracticeActivity}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
          <EyeOff className='text-muted-foreground mb-2 h-8 w-8' />
          <p className='font-medium'>No practice activities yet</p>
          <p className='mt-1 text-sm'>Add activities learners can complete during class.</p>
        </div>
      )}

      {(practiceTotalPages > 1 || practiceTotalElements > PRACTICE_ACTIVITY_PAGE_SIZE) && (
        <div className='mt-2 flex flex-col gap-3 border-t pt-4 text-sm md:flex-row md:items-center md:justify-between'>
          <p className='text-muted-foreground'>
            Page {practicePageNumber + 1} of {practiceTotalPages} - {practiceTotalElements}{' '}
            activities
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={!hasPracticePrevious}
              onClick={() => setPracticePage(page => Math.max(page - 1, 0))}
            >
              <ChevronLeft className='h-4 w-4' />
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={!hasPracticeNext}
              onClick={() => setPracticePage(page => page + 1)}
            >
              Next
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      <PracticeActivityDialog
        open={openPracticeActivityModal}
        onOpenChange={open => {
          if (open) {
            setOpenPracticeActivityModal(true);
          } else {
            closePracticeActivityModal();
          }
        }}
        activity={editingPracticeActivity}
        isSubmitting={createPracticeActivity.isPending || updatePracticeActivity.isPending}
        onSubmit={handleSavePracticeActivity}
      />

      <DeleteModal
        open={openDeletePracticeActivityModal}
        setOpen={setOpenDeletePracticeActivityModal}
        title='Delete Practice Activity'
        description={`Are you sure you want to delete ${
          editingPracticeActivity?.title ?? 'this practice activity'
        }? This action cannot be undone.`}
        onConfirm={confirmDeletePracticeActivity}
        isLoading={deletePracticeActivity.isPending}
        confirmText='Delete Activity'
      />
    </div>
  );
}

export type PracticeActivityListProps = {
  courseUuid: string | null | undefined;
  lessonUuid: string | null | undefined;
  variant?: 'instructor' | 'student';
};

export function PracticeActivityList({
  courseUuid,
  lessonUuid,
  variant = 'instructor',
}: PracticeActivityListProps) {
  const enabled = Boolean(courseUuid && lessonUuid);

  const { data, isFetching } = useQuery({
    ...getPracticeActivitiesOptions({
      path: { courseUuid: courseUuid as string, lessonUuid: lessonUuid as string },
      query: { pageable: { page: 0, size: 50 } },
    }),
    enabled,
  });

  const activities = (data?.data?.content ?? []) as LessonPracticeActivity[];
  const visibleActivities =
    variant === 'student' ? activities.filter(activity => activity.active) : activities;

  if (!enabled) {
    return (
      <p className='text-muted-foreground text-sm'>
        Select a lesson to see its practice activities.
      </p>
    );
  }

  if (isFetching && visibleActivities.length === 0) {
    return <p className='text-muted-foreground text-sm'>Loading practice activities...</p>;
  }

  if (visibleActivities.length === 0) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-center'>
        <EyeOff className='text-muted-foreground mb-2 h-8 w-8' />
        <p className='text-sm font-medium'>No practice activities yet</p>
        {variant === 'instructor' && (
          <p className='mt-1 text-xs'>
            Add activities for this skill from the course creator studio.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {visibleActivities.map(activity => (
        <div
          key={activity.uuid}
          className='border-border/70 bg-background flex gap-3 rounded-md border p-3'
        >
          <div className='bg-primary/10 text-primary mt-1 h-fit rounded-full p-2'>
            <ClipboardList className='h-4 w-4' />
          </div>
          <ActivityCardBody activity={activity} hideStatusBadges={variant === 'student'} />
        </div>
      ))}
    </div>
  );
}
