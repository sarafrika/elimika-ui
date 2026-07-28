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
import type { User } from '@/services/client';
import { instructorName } from './class-form-shared';

export type Offering = {
  value: string;
  label: string;
  kind: 'Course' | 'Program';
  category: string;
  subject: string;
};

export function OfferingPicker({
  loading,
  categories,
  category,
  onCategoryChange,
  subjects,
  subject,
  onSubjectChange,
  offerings,
  availableOfferings,
  offering,
  onOfferingChange,
  selectedOffering,
  title,
  instructors,
  instructorUuid,
  onInstructorChange,
  selectedInstructor,
  onlyAvailable,
  onOnlyAvailableChange,
}: {
  loading: boolean;
  categories: string[];
  category: string;
  onCategoryChange: (v: string) => void;
  subjects: string[];
  subject: string;
  onSubjectChange: (v: string) => void;
  offerings: Offering[];
  availableOfferings: Offering[];
  offering: string;
  onOfferingChange: (v: string) => void;
  selectedOffering?: Offering;
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
      {/* Category + Subject */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Select Category <span className="text-destructive">*</span>
          </Label>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger aria-label="Select category">
              <SelectValue placeholder={loading ? 'Loading…' : 'Select a category'} />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            Select Subject <span className="text-destructive">*</span>
          </Label>
          <Select value={subject} onValueChange={onSubjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(s => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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

      {/* Course + Instructor */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label>
            Select Course <span className="text-destructive">*</span>
          </Label>
          <Select value={offering} onValueChange={onOfferingChange}>
            <SelectTrigger className="w-full">
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <span className="truncate">
                  <SelectValue
                    placeholder={
                      loading
                        ? 'Loading approved offerings…'
                        : availableOfferings.length === 0
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
              {availableOfferings.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No approved offerings for {subject || 'this subject'}
                </div>
              ) : (
                availableOfferings.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
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
            Preferred instructor. Instructors still apply to the posted class — assignment is confirmed from applicants.
          </p>
        </div>
      </div>
    </>
  );
}
