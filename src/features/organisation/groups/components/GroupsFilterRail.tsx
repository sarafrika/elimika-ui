'use client';

import { Check, ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TierOption } from '@/src/features/organisation/groups/lib/roster';
import type { TrainingBranch } from '@/services/client';

export type GroupsFilterRailProps = {
  branches: TrainingBranch[];
  tiers: TierOption[];
  branchUuid: string | null;
  tierUuid: string | null;
  groupUuid: string | null;
  onBranchChange: (branchUuid: string | null) => void;
  /** Select a tier, optionally narrowing to one of its streams (a group). */
  onTierChange: (tierUuid: string | null, groupUuid?: string | null) => void;
};

const pillBase =
  'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors';
const pillActive = 'border-primary bg-primary text-primary-foreground shadow-sm';
const pillIdle = 'border-border bg-card text-foreground hover:bg-muted';

/**
 * Horizontally-scrolling filter rail: a branch dropdown pill, then one split
 * pill per academic tier (left half selects the tier, the chevron narrows to a
 * single stream). Every control here changes the server query — nothing is
 * decorative.
 */
export function GroupsFilterRail({
  branches,
  tiers,
  branchUuid,
  tierUuid,
  groupUuid,
  onBranchChange,
  onTierChange,
}: GroupsFilterRailProps) {
  const activeBranch = branches.find(branch => branch.uuid === branchUuid);

  return (
    <div className='-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6'>
      <div className='flex min-w-max items-center gap-2 py-1'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              aria-label='Filter by branch'
              className={cn(pillBase, activeBranch ? pillActive : pillIdle)}
            >
              {activeBranch?.branch_name ?? 'All'}
              <ChevronDown className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56'>
            <DropdownMenuLabel>Branch</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onBranchChange(null)}>
              <span className='flex-1'>All branches</span>
              {!branchUuid && <Check className='h-4 w-4' />}
            </DropdownMenuItem>
            {branches.map(branch => (
              <DropdownMenuItem
                key={branch.uuid}
                onSelect={() => onBranchChange(branch.uuid ?? null)}
              >
                <span className='flex-1'>{branch.branch_name}</span>
                {branchUuid === branch.uuid && <Check className='h-4 w-4' />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className='bg-border mx-1 h-6 w-px shrink-0' aria-hidden />

        <button
          type='button'
          onClick={() => onTierChange(null, null)}
          aria-pressed={!tierUuid}
          className={cn(pillBase, !tierUuid ? pillActive : pillIdle)}
        >
          All levels
        </button>

        {tiers.map(tier => {
          const isActive = tier.uuid === tierUuid;
          const activeStream = isActive
            ? tier.streams.find(stream => stream.groupUuid === groupUuid)
            : undefined;

          return (
            <div
              key={tier.uuid}
              className={cn(
                'flex shrink-0 items-stretch rounded-full border transition-colors',
                isActive ? pillActive : pillIdle
              )}
            >
              <button
                type='button'
                onClick={() => onTierChange(tier.uuid, null)}
                className='rounded-l-full px-4 py-1.5 text-sm font-medium whitespace-nowrap'
                aria-pressed={isActive}
              >
                {tier.name}
                {activeStream && (
                  <span className='ml-1.5 text-xs opacity-90'>: {activeStream.label}</span>
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type='button'
                    aria-label={`Filter ${tier.name} by stream`}
                    className={cn(
                      'flex items-center rounded-r-full border-l px-2',
                      isActive
                        ? 'border-primary-foreground/30 hover:bg-primary/90'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <ChevronDown className='h-4 w-4' />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-56'>
                  <DropdownMenuLabel>Filter by stream</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onTierChange(tier.uuid, null)}>
                    <span className='flex-1'>All streams</span>
                    {isActive && !groupUuid && <Check className='h-4 w-4' />}
                  </DropdownMenuItem>
                  {tier.streams.length === 0 ? (
                    <DropdownMenuItem disabled>No streams yet</DropdownMenuItem>
                  ) : (
                    tier.streams.map(stream => (
                      <DropdownMenuItem
                        key={stream.groupUuid}
                        onSelect={() => onTierChange(tier.uuid, stream.groupUuid)}
                      >
                        <span className='flex-1'>{stream.label}</span>
                        {isActive && groupUuid === stream.groupUuid && (
                          <Check className='h-4 w-4' />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
