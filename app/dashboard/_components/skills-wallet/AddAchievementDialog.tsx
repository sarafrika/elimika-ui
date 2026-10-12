'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';
import type { AchievementRecord } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';
import {
  FormDialog,
  type FormDialogField,
  type FormDialogValues,
} from '@/components/form/FormDialog';
import { localDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import {
  addAchievementMutation,
  updateAchievementMutation,
  getSummaryQueryKey,
  listAchievementsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import {
  AchievementTypeEnum,
  type ApiResponseListUserAchievement,
  type ApiResponseUserAchievement,
} from '@/services/client/types.gen';

const TYPE_LABELS: Record<AchievementTypeEnum, string> = {
  AWARD: 'Award',
  MILESTONE: 'Milestone',
  COMPETITION: 'Competition',
  UNLOCKED_SKILL: 'Unlocked skill',
  RECOGNITION: 'Recognition',
};
const UNSUPPORTED = 'Not available yet.';
const FIELDS: readonly FormDialogField[] = [
  { name: 'name', label: 'Achievement', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    disabled: true,
    description: UNSUPPORTED,
    options: ['Completed', 'In Progress'].map(value => ({ value, label: value })),
  },
  {
    name: 'progress',
    label: 'Progress % (if in progress)',
    type: 'number',
    min: 0,
    max: 100,
    disabled: true,
    description: UNSUPPORTED,
  },
  {
    name: 'points',
    label: 'Points',
    type: 'number',
    min: 0,
    max: 10000,
    disabled: true,
    description: UNSUPPORTED,
  },
  { name: 'achieved_at', label: 'Date achieved', type: 'date' },
  {
    name: 'file',
    label: 'Proof (optional)',
    type: 'file',
    disabled: true,
    description: UNSUPPORTED,
  },
  {
    name: 'achievement_type',
    label: 'Type',
    type: 'select',
    required: true,
    options: Object.values(AchievementTypeEnum).map(value => ({
      value,
      label: TYPE_LABELS[value],
    })),
  },
  { name: 'awarded_by', label: 'Awarded by (optional)' },
];

type DProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canAddAchievement: boolean;
  achievement?: AchievementRecord | null;
};

const str = (value: FormDialogValues[string]) => (typeof value === 'string' ? value.trim() : '');

export function AddAchievementDialog({
  open,
  onOpenChange,
  canAddAchievement,
  achievement,
}: DProps) {
  const queryClient = useQueryClient();
  const insert = useMutation(addAchievementMutation());
  const update = useMutation(updateAchievementMutation());
  const initial = useMemo<FormDialogValues>(
    () => ({
      name: achievement?.name ?? '',
      description: achievement?.description ?? '',
      achieved_at: achievement?.achieved_at?.slice(0, 10) ?? '',
      achievement_type: achievement?.achievement_type ?? 'AWARD',
      awarded_by: achievement?.awarded_by ?? '',
    }),
    [achievement]
  );

  const saved = async (response: ApiResponseUserAchievement) => {
    if (response.error || response.success === false)
      throw new Error(getErrorMessage(response, 'Unable to save achievement.'));
    const record = response.data;
    if (!record?.uuid) throw new Error('No saved achievement was returned.');
    const queryKey = listAchievementsQueryKey();
    await queryClient.cancelQueries({ queryKey });
    queryClient.setQueryData<ApiResponseListUserAchievement>(queryKey, current => {
      const records = current?.data ?? [];
      const exists = records.some(item => item.uuid === record.uuid);
      return {
        ...current,
        success: true,
        error: undefined,
        data: exists
          ? records.map(item => (item.uuid === record.uuid ? record : item))
          : [...records, record],
      };
    });
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: getSummaryQueryKey() });
    toast.success(achievement ? 'Achievement updated' : 'Achievement added');
  };

  return (
    <FormDialog
      key={achievement?.id ?? 'new'}
      open={open}
      onOpenChange={onOpenChange}
      title={achievement ? 'Edit achievement' : 'Add achievement'}
      description='Record an award, milestone or recognition.'
      submitLabel={achievement ? 'Save changes' : 'Add achievement'}
      fields={FIELDS}
      initial={initial}
      disabled={!canAddAchievement}
      onSubmit={async values => {
        if (!canAddAchievement) throw new Error('You do not have permission to save achievements.');
        const name = str(values.name);
        if (!name) throw new Error('Achievement is required');
        const type = Object.values(AchievementTypeEnum).find(
          value => value === values.achievement_type
        );
        if (!type) throw new Error('Choose a valid achievement type.');
        const date = str(values.achieved_at);
        if (date) {
          const parsed = new Date(`${date}T00:00:00Z`);
          if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
            throw new Error('Enter a valid date achieved.');
        }
        const body = {
          title: name,
          description: str(values.description) || undefined,
          achievement_type: type,
          awarded_by: str(values.awarded_by) || undefined,
          awarded_on: date ? localDate(date) : undefined,
        };
        if (achievement) {
          if (!achievement.uuid)
            throw new Error('This achievement cannot be edited. Reload your achievements.');
          await saved(await update.mutateAsync({ path: { itemUuid: achievement.uuid }, body }));
        } else {
          await saved(await insert.mutateAsync({ body }));
        }
      }}
    />
  );
}
