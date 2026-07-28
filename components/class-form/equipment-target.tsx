// @ts-nocheck -- generated-client type drift on resource rows
'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { OrganisationResource } from '@/services/client';
import { TargetGroupPicker } from './target-group-picker';

export function EquipmentTarget({
  equipmentResources,
  equipmentUuids,
  onEquipmentChange,
  organisationUuid,
  targetGroupUuids,
  onTargetGroupsChange,
}: {
  equipmentResources: OrganisationResource[];
  equipmentUuids: string[];
  onEquipmentChange: (next: string[]) => void;
  organisationUuid: string;
  targetGroupUuids: string[];
  onTargetGroupsChange: (next: string[]) => void;
}) {
  const toggle = (list: string[], value: string, on: boolean) =>
    on ? Array.from(new Set([...list, value])) : list.filter(x => x !== value);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Equipment</Label>
        <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border p-2.5">
          {equipmentResources.length === 0 ? (
            <div className="text-xs text-muted-foreground">No equipment pools registered.</div>
          ) : (
            equipmentResources.map(eq => {
              const checked = equipmentUuids.includes(eq.uuid ?? '');
              return (
                <label key={eq.uuid} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={v => onEquipmentChange(toggle(equipmentUuids, eq.uuid ?? '', v === true))}
                  />
                  <span className="flex-1">{eq.name}</span>
                  {eq.total_quantity != null ? (
                    <span className="text-[10px] text-muted-foreground">{eq.total_quantity} units</span>
                  ) : null}
                </label>
              );
            })
          )}
        </div>
        {equipmentUuids.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {equipmentUuids.map(uuid => {
              const eq = equipmentResources.find(e => e.uuid === uuid);
              return (
                <Badge key={uuid} variant="secondary" className="text-[10px]">
                  {eq?.name ?? uuid.slice(0, 8)}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
      <TargetGroupPicker
        organisationUuid={organisationUuid}
        targetGroupUuids={targetGroupUuids}
        onTargetGroupsChange={onTargetGroupsChange}
      />
    </div>
  );
}
