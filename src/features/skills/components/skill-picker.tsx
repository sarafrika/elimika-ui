'use client';

import { EntityCombobox, type EntityOption } from '@/components/search/entity-combobox';
import { listSkillsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { ListSkillsResponse, Skill } from '@/services/client/types.gen';

export type PickedSkill = { uuid: string; name: string; slug?: string };

function toOption(skill: Skill): EntityOption | null {
  if (!skill.uuid || !skill.name) return null;
  return {
    value: skill.uuid,
    label: skill.name,
    description: skill.aliases?.length ? `Also: ${skill.aliases.join(', ')}` : undefined,
  };
}

/**
 * Picks one skill from the taxonomy (`GET /api/v1/skills?q=&limit=`, active skills
 * only). Skills already chosen are shown disabled so the same skill is not added twice.
 * The picker resets after each pick; the caller keeps the list.
 */
export function SkillPicker({
  onPick,
  excludeUuids = [],
  disabled,
  placeholder = 'Add a skill…',
  'aria-label': ariaLabel = 'Add a skill',
}: {
  onPick: (skill: PickedSkill) => void;
  excludeUuids?: readonly string[];
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
}) {
  return (
    <EntityCombobox
      value=''
      onChange={(value, option) => {
        if (!value || !option) return;
        onPick({ uuid: value, name: option.label });
      }}
      queryOptions={q => listSkillsOptions({ query: { ...(q ? { q } : {}), limit: 20 } })}
      toOptions={(data: ListSkillsResponse) =>
        (data.data ?? [])
          .map(toOption)
          .filter((option): option is EntityOption => option !== null)
          .map(option =>
            excludeUuids.includes(option.value) ? { ...option, disabled: true } : option
          )
      }
      placeholder={placeholder}
      searchPlaceholder='Search skills…'
      emptyText='No skills match'
      disabled={disabled}
      aria-label={ariaLabel}
    />
  );
}
