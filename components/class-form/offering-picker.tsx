// @ts-nocheck -- generated-client type drift on approved-offering rows
'use client';

import { AvatarWithSkeleton } from '@/components/avatar-with-skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category, User } from '@/services/client';
import { instructorName } from './class-form-shared';

export type Offering = {
  value: string;
  label: string;
  kind: 'Course' | 'Program';
  /** Categories the course already carries — auto-applied, never asked for. */
  categoryNames: string[];
  /** A program's own category, used to seed the picker when it has one. */
  categoryUuid?: string;
};

/**
 * Category row. A course brings its own categories, so they are shown as applied
 * rather than asked for; a program has no per-class category, so the organisation
 * chooses the one its classes fall under.
 */
function CategoryField({
  selectedOffering,
  categories,
  categoriesLoading,
  programCategoryUuid,
  onProgramCategoryChange,
}: {
  selectedOffering?: Offering;
  categories: Category[];
  categoriesLoading: boolean;
  programCategoryUuid: string;
  onProgramCategoryChange: (v: string) => void;
}) {
  if (!selectedOffering) {
    return (
      <div className="space-y-2">
        <Label>Category</Label>
        <p className="text-xs text-muted-foreground">
          Select a course or program first — its category is applied automatically.
        </p>
      </div>
    );
  }

  if (selectedOffering.kind === 'Course') {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          Category
          <span className="text-[11px] font-normal text-muted-foreground">
            (from the course)
          </span>
        </Label>
        {selectedOffering.categoryNames.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            This course has no category set. The class inherits whatever the course creator adds later.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedOffering.categoryNames.map(name => (
              <Badge key={name} variant="secondary">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>
        Category <span className="text-destructive">*</span>
      </Label>
      {categoriesLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <Select value={programCategoryUuid} onValueChange={onProgramCategoryChange}>
          <SelectTrigger aria-label="Select category">
            <SelectValue placeholder="Choose the category these classes fall under" />
          </SelectTrigger>
          <SelectContent>
            {categories.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No categories configured</div>
            ) : (
              categories.map(c => (
                <SelectItem key={c.uuid} value={c.uuid ?? ''}>
                  {c.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
      <p className="text-[11px] text-muted-foreground">
        Programs don&apos;t carry a category of their own — pick the one these classes belong under.
      </p>
    </div>
  );
}

export function OfferingPicker({
  loading,
  offerings,
  offering,
  onOfferingChange,
  selectedOffering,
  categories,
  categoriesLoading,
  programCategoryUuid,
  onProgramCategoryChange,
  title,
  instructors,
  instructorUuid,
  onInstructorChange,
  selectedInstructor,
  onlyAvailable,
  onOnlyAvailableChange,
}: {
  loading: boolean;
  offerings: Offering[];
  offering: string;
  onOfferingChange: (v: string) => void;
  selectedOffering?: Offering;
  categories: Category[];
  categoriesLoading: boolean;
  programCategoryUuid: string;
  onProgramCategoryChange: (v: string) => void;
  title: string;
  instructors: User[];
  instructorUuid: string;
  onInstructorChange: (v: string) => void;
  selectedInstructor?: User;
  onlyAvailable: boolean;
  onOnlyAvailableChange: (v: boolean) => void;
}) {
  return (
    <>
      {/* Offering + Instructor */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label>
            Select Course or Program <span className="text-destructive">*</span>
          </Label>
          <Select value={offering} onValueChange={onOfferingChange}>
            <SelectTrigger className="w-full">
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <span className="truncate">
                  <SelectValue
                    placeholder={
                      loading
                        ? 'Loading approved offerings…'
                        : offerings.length === 0
                          ? 'No approved offerings'
                          : 'Select a course or program'
                    }
                  />
                </span>
                {selectedOffering ? (
                  <Badge variant="secondary" className="ml-auto shrink-0">
                    {selectedOffering.kind}
                  </Badge>
                ) : null}
              </div>
            </SelectTrigger>
            <SelectContent>
              {offerings.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No approved offerings</div>
              ) : (
                offerings.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="flex w-full items-center gap-2">
                      <span className="truncate">{o.label}</span>
                      <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                        {o.kind}
                      </Badge>
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {offerings.length === 0 && !loading ? (
            <p className="text-xs text-muted-foreground">
              Apply to train a course or program and get it approved before creating a class.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Instructor</Label>
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
              <Checkbox
                checked={onlyAvailable}
                onCheckedChange={v => onOnlyAvailableChange(v === true)}
                className="h-3.5 w-3.5"
              />
              Only available
            </label>
          </div>
          <Select value={instructorUuid} onValueChange={onInstructorChange}>
            <SelectTrigger>
              <div className="flex min-w-0 items-center gap-2">
                {selectedInstructor ? (
                  <AvatarWithSkeleton
                    src={selectedInstructor.profile_image_url ?? ''}
                    name={instructorName(selectedInstructor)}
                    className="h-6 w-6 shrink-0"
                  />
                ) : null}
                <span className="truncate">
                  <SelectValue placeholder="Select an instructor" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {instructors.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No instructors in your organisation yet
                </div>
              ) : (
                instructors.map(i => (
                  <SelectItem key={i.uuid} value={i.uuid ?? ''}>
                    {instructorName(i)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            On publish the class is assigned to this instructor and scheduled — it appears on their calendar and the
            organisation calendar. Leave unset to post it for instructors to apply instead.
          </p>
        </div>
      </div>

      {/* Category — auto for courses, chosen for programs */}
      <CategoryField
        selectedOffering={selectedOffering}
        categories={categories}
        categoriesLoading={categoriesLoading}
        programCategoryUuid={programCategoryUuid}
        onProgramCategoryChange={onProgramCategoryChange}
      />

      {/* Derived class title preview */}
      <div className="rounded-lg border border-dashed border-teal-600/40 bg-teal-50/60 px-3 py-2.5 dark:bg-teal-950/20">
        <div className="text-[11px] font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400">
          Class title
        </div>
        <div className="mt-0.5 truncate text-sm font-semibold text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground">
          Auto-generated from the approved offering. This is what appears on the classes list.
        </div>
      </div>
    </>
  );
}
