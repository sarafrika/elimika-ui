'use client';

import { Bookmark, MoreHorizontal, Plus, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';

import { cn } from '../../../../../lib/utils';
import { TOKEN } from '../../../_components/color-charts';
import {
  ICON_MAP,
  StatCard,
  WalletIdCard,
  type SkillsWalletData,
} from './SkillsWalletShared';

const VIEW_TABS = ['All Skills', 'By Category', 'In Progress', 'Completed', 'Bookmarked'] as const;
const LEVEL_FILTERS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

type SkillsWalletMySkillsTabProps = {
  data: Pick<SkillsWalletData, 'skills' | 'categoryCounts'>;
};

export function SkillsWalletMySkillsTab({ data }: SkillsWalletMySkillsTabProps) {
  const [activeView, setActiveView] = useState<(typeof VIEW_TABS)[number]>('All Skills');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] =
    useState<(typeof LEVEL_FILTERS)[number]>('All Levels');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set());

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const total = data.skills.length || 1;

  const topSkills = useMemo(
    () => [...data.skills].sort((a, b) => b.proficiency_pct - a.proficiency_pct).slice(0, 5),
    [data.skills]
  );

  const countLevel = (label: string) =>
    data.skills.filter(skill => skill.level.toLowerCase().includes(label.toLowerCase())).length;

  const stats = useMemo(
    () => [
      {
        icon: Sparkles,
        label: 'Top Skills',
        value: topSkills.length,
        tint: 'bg-primary/10 text-primary',
        sub: 'Highest proficiency',
      },
      {
        icon: Sparkles,
        label: 'Expert',
        value: countLevel('Expert'),
        tint: 'bg-success/10 text-success',
        sub: `${Math.round((countLevel('Expert') / total) * 100)}% of total`,
      },
      {
        icon: Sparkles,
        label: 'Advanced',
        value: countLevel('Advanced'),
        tint: 'bg-secondary text-secondary-foreground',
        sub: `${Math.round((countLevel('Advanced') / total) * 100)}% of total`,
      },
      {
        icon: Sparkles,
        label: 'Intermediate',
        value: countLevel('Intermediate'),
        tint: 'bg-warning/10 text-warning',
        sub: `${Math.round((countLevel('Intermediate') / total) * 100)}% of total`,
      },
      {
        icon: Sparkles,
        label: 'Beginner',
        value: countLevel('Beginner'),
        tint: 'bg-muted text-foreground',
        sub: `${Math.round((countLevel('Beginner') / total) * 100)}% of total`,
      },
    ],
    [data.skills, topSkills.length, total]
  );

  const filteredSkills = useMemo(() => {
    const normalizedSearch = deferredSearch;

    const matchesSearch = (skillName: string, category: string, level: string) => {
      if (!normalizedSearch) return true;
      return [skillName, category, level].some(value =>
        value.toLowerCase().includes(normalizedSearch)
      );
    };

    const matchesLevel = (level: string) => {
      if (levelFilter === 'All Levels') return true;
      return level.toLowerCase().includes(levelFilter.toLowerCase());
    };

    const matchesView = (skillId: string, proficiencyPct: number) => {
      if (activeView === 'All Skills' || activeView === 'By Category') return true;
      if (activeView === 'In Progress') return proficiencyPct > 0 && proficiencyPct < 100;
      if (activeView === 'Completed') return proficiencyPct >= 100;
      return bookmarkedIds.has(skillId);
    };

    const nextSkills = data.skills.filter(skill =>
      matchesSearch(skill.name, skill.category, skill.level) &&
      matchesLevel(skill.level) &&
      matchesView(skill.id, skill.proficiency_pct)
    );

    return nextSkills.sort((a, b) => {
      if (activeView === 'By Category') {
        return a.category.localeCompare(b.category) || b.proficiency_pct - a.proficiency_pct;
      }

      return b.proficiency_pct - a.proficiency_pct;
    });
  }, [activeView, bookmarkedIds, data.skills, deferredSearch, levelFilter]);

  const toggleBookmark = (skillId: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);

      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }

      return next;
    });
  };

  const tokenColors = Object.values(TOKEN);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>My Skills</h2>
          <p className='text-sm text-muted-foreground'>
            Explore and manage the skills you've acquired and are developing.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <WalletIdCard label='Skills Wallet ID' />
          <Button className='bg-primary hover:bg-primary/90'>
            <Plus className='mr-2 h-4 w-4' /> Add Skill
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {stats.map(stat => (
          <StatCard
            key={stat.label}
            {...stat}
          />
        ))}
      </div>

      <div className='grid gap-4 lg:grid-cols-4'>
        <Card className='lg:col-span-3'>
          <CardHeader className='pb-3'>
            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <div className='flex gap-4 text-sm'>
                {VIEW_TABS.map(label => (
                  <button
                    key={label}
                    type='button'
                    onClick={() => setActiveView(label)}
                    className={`pb-1 transition-colors ${label === activeView
                      ? 'border-b-2 border-primary font-medium text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className='flex items-center gap-2'>
                <div className='relative'>
                  <Search className='absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    className='h-8 w-48 pl-8'
                    placeholder='Search skills…'
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <SlidersHorizontal className='mr-1 h-3.5 w-3.5' />
                      {levelFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuRadioGroup value={levelFilter} onValueChange={value => setLevelFilter(value as (typeof LEVEL_FILTERS)[number])}>
                      {LEVEL_FILTERS.map(level => (
                        <DropdownMenuRadioItem key={level} value={level}>
                          {level}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            {filteredSkills.length ? filteredSkills.map(skill => {
              const Icon = ICON_MAP[skill.icon_key] ?? Sparkles;
              const bookmarked = bookmarkedIds.has(skill.id);

              return (
                <div
                  key={skill.id}
                  className="flex items-center gap-4 rounded-lg border p-3 transition hover:border-primary/40"
                >
                  {/* Skill icon */}
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-md",
                      skill.tint ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Skill information */}
                  <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-2 md:grid-cols-4 md:gap-4">
                    {/* Name / Level */}
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {skill.name}
                      </p>

                      <Badge
                        variant="outline"
                        className="mt-1 text-[10px]"
                      >
                        {skill.level}
                      </Badge>
                    </div>

                    {/* Proficiency */}
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Proficiency
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${skill.proficiency_pct}%`,
                            }}
                          />
                        </div>

                        <span className="w-9 text-right text-xs tabular-nums">
                          {skill.proficiency_pct}%
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Category
                      </p>

                      <p className="text-sm">
                        {skill.category}
                      </p>
                    </div>

                    {/* Last Used */}
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Last Used
                      </p>

                      <p className="text-sm">
                        {skill.last_used ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => toggleBookmark(skill.id)}
                      aria-label={
                        bookmarked
                          ? `Remove ${skill.name} from bookmarks`
                          : `Bookmark ${skill.name}`
                      }
                      aria-pressed={bookmarked}
                    >
                      <Bookmark
                        className={cn(
                          "h-4 w-4",
                          bookmarked && "fill-current text-primary"
                        )}
                      />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={`More options for ${skill.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <EmptyState
                variant='compact'
                icon={Search}
                title='No skills match your filters'
                description='Try a different tab, clear the search term, or change the level filter.'
              />
            )}
          </CardContent>
        </Card>

        <div className='space-y-4'>
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base'>Skills by Category</CardTitle>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              {data.categoryCounts.map((category, index) => {
                const color = tokenColors[index % tokenColors.length];

                return (
                  <div key={category.name}>
                    <div className='flex items-center justify-between text-sm'>
                      <span>{category.name}</span>
                      <span className='text-muted-foreground'>{category.count} skills</span>
                    </div>
                    <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-muted'>
                      <div
                        className={`h-full rounded-full`}
                        style={{
                          width: `${Math.max(10, category.count * 10)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Recommended for You</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {[
                { name: 'Time Management', reason: 'Complements your active coursework' },
                { name: 'Communication', reason: 'Useful for group learning and project work' },
                { name: 'Leadership', reason: 'Common next step for advanced learners' },
              ].map(item => (
                <div key={item.name} className='flex items-start gap-3'>
                  <div className='grid h-8 w-8 place-items-center rounded-md bg-warning/10 text-warning'>
                    <Sparkles className='h-4 w-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>{item.name}</p>
                    <p className='text-xs text-muted-foreground'>{item.reason}</p>
                  </div>
                  <Button size='sm' variant='outline' className='h-7 text-xs'>
                    Add
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
