'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useId, useState } from 'react';
import { toast } from 'sonner';

import { fmtDate } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import {
  addCourseCreatorSkillMutation,
  addInstructorSkillMutation,
  getCourseCreatorSkillsQueryKey,
  getInstructorSkillsQueryKey,
  updateCourseCreatorSkillMutation,
  updateInstructorSkillMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseCreatorSkill, InstructorSkill } from '@/services/client/types.gen';
import { SKILL_PROFICIENCY, type SkillProfileRole } from './skill-proficiency';

type AddSkillDialogProps = {
  role: SkillProfileRole;
  profileUuid: string;
  onClose: () => void;
  skill?: CourseCreatorSkill | InstructorSkill;
};

export function AddSkillDialog({ role, profileUuid, onClose, skill }: AddSkillDialogProps) {
  const id = useId();
  const queryClient = useQueryClient();
  const [name, setName] = useState(skill?.skill_name ?? '');
  const [level, setLevel] = useState(
    () =>
      SKILL_PROFICIENCY.find(
        option =>
          option.instructor === skill?.proficiency_level ||
          option.courseCreator === skill?.proficiency_level
      )?.label ?? ''
  );
  const isEditing = Boolean(skill);
  const failureMessage = `Unable to ${isEditing ? 'update' : 'add'} this skill. Please try again.`;
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const instructorMutation = useMutation(addInstructorSkillMutation());
  const creatorMutation = useMutation(addCourseCreatorSkillMutation());
  const updateInstructorMutation = useMutation(updateInstructorSkillMutation());
  const updateCreatorMutation = useMutation(updateCourseCreatorSkillMutation());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !profileUuid || (skill && !skill.uuid)) return;
    const proficiency = SKILL_PROFICIENCY.find(option => option.label === level);
    if (!name.trim() || !proficiency) {
      setErrorMessage('Enter a skill name and select a proficiency level.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const saveSkill = async () => {
        if (role === 'instructor') {
          const body = {
            instructor_uuid: profileUuid,
            skill_name: name.trim(),
            proficiency_level: proficiency.instructor,
          };
          return skill?.uuid
            ? updateInstructorMutation.mutateAsync({
                path: { instructorUuid: profileUuid, skillUuid: skill.uuid },
                body,
              })
            : instructorMutation.mutateAsync({ path: { instructorUuid: profileUuid }, body });
        }
        const body = {
          course_creator_uuid: profileUuid,
          skill_name: name.trim(),
          proficiency_level: proficiency.courseCreator,
        };
        return skill?.uuid
          ? updateCreatorMutation.mutateAsync({
              path: { courseCreatorUuid: profileUuid, skillUuid: skill.uuid },
              body,
            })
          : creatorMutation.mutateAsync({ path: { courseCreatorUuid: profileUuid }, body });
      };
      const response = await saveSkill();
      if (response.error || response.success === false) {
        setErrorMessage(response.message || failureMessage);
        return;
      }
      await queryClient.invalidateQueries({
        queryKey:
          role === 'instructor'
            ? getInstructorSkillsQueryKey({
                path: { instructorUuid: profileUuid },
                query: { pageable: {} },
              })
            : getCourseCreatorSkillsQueryKey({
                path: { courseCreatorUuid: profileUuid },
                query: { pageable: {} },
              }),
      });
      toast.success(
        response.message ||
          (isEditing ? 'Skill updated successfully.' : 'Skill added successfully.')
      );
      onClose();
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : failureMessage;
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit skill' : 'Add skill'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your skill and proficiency level.'
              : 'Add your skill and proficiency level to your skills wallet.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-5'>
          <fieldset disabled={saving} className='border-border rounded-md border p-4'>
            <legend className='sr-only'>Skill details</legend>
            <p className='text-foreground mb-3 text-sm font-semibold'>
              {name.trim() || 'New skill'}
            </p>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor={`${id}-name`}>Skill</Label>
                <Input
                  id={`${id}-name`}
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder='e.g. Curriculum design'
                  maxLength={100}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor={`${id}-category`}>Taxonomy / category</Label>
                <Input id={`${id}-category`} value='' disabled />
              </div>
              <div className='space-y-2'>
                <Label htmlFor={`${id}-level`}>Proficiency level</Label>
                <Select value={level} onValueChange={setLevel} disabled={saving} required>
                  <SelectTrigger id={`${id}-level`} className='w-full'>
                    <SelectValue placeholder='Select' />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_PROFICIENCY.map(option => (
                      <SelectItem key={option.label} value={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor={`${id}-evidence`}>Evidence</Label>
                <Input id={`${id}-evidence`} value='' disabled />
              </div>
              <div className='space-y-2'>
                <Label htmlFor={`${id}-verification`}>Verification status</Label>
                <Input id={`${id}-verification`} value='' disabled />
              </div>
              <div className='space-y-2'>
                <Label htmlFor={`${id}-assessed`}>Last assessed date</Label>
                <Input
                  id={`${id}-assessed`}
                  value={skill?.updated_date ? fmtDate(skill.updated_date) : ''}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </fieldset>
          {errorMessage ? (
            <p role='alert' className='text-destructive text-sm'>
              {errorMessage}
            </p>
          ) : null}
          <DialogFooter>
            <Button type='button' variant='outline' disabled={saving} onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={saving || !profileUuid || !name.trim() || !level}>
              {saving ? (
                <>
                  <Spinner className='h-4 w-4' /> Saving...
                </>
              ) : isEditing ? (
                'Save changes'
              ) : (
                'Add skill'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
