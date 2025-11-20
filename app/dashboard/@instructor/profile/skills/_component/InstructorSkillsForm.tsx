'use client';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import useMultiMutations from '@/hooks/use-multi-mutations';
import type { Instructor, InstructorSkill } from '@/services/api/schema';
import { schemas } from '@/services/api/zod-client';
import {
  addInstructorSkillMutation,
  deleteInstructorSkillMutation,
  getInstructorSkillsQueryKey,
  updateInstructorSkillMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { InstructorSkillCard } from './instructor-skill-card';

const SkillSchema = schemas.InstructorSkill;
const skillsSchema = z.object({
  skills: z.array(SkillSchema),
});

type SkillType = z.infer<typeof SkillSchema>;
type SkillsFormValues = z.infer<typeof skillsSchema>;

const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Native'];

export default function SkillsSettings({
  instructor,
  instructorSkills,
}: {
  instructor: Instructor;
  instructorSkills: InstructorSkill[];
}) {
  const qc = useQueryClient();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'skills',
        title: 'Skills',
        url: '/dashboard/profile/skills',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const { disableEditing, isEditing, requestConfirmation, isConfirming } = useProfileFormMode();
  const user = useUserProfile();

  const defaultSkill: SkillType = {
    instructor_uuid: instructor.uuid!,
    skill_name: '',
    summary: '',
    proficiency_description: '',
    proficiency_level: 'BEGINNER',
  };


  const passSkill = (skill: InstructorSkill): SkillType => ({
    uuid: skill.uuid,
    instructor_uuid: instructor.uuid!,
    skill_name: skill.skill_name ?? '',
    summary: skill.summary ?? '',
    proficiency_description: skill.proficiency_description ?? '',

    // IMPORTANT: normalize case
    proficiency_level: (skill.proficiency_level ?? 'BEGINNER').toUpperCase() as any,
  });

  const form = useForm<SkillsFormValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      skills: instructorSkills.length
        ? instructorSkills.map(passSkill)
        : [defaultSkill],
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (instructorSkills && instructorSkills.length > 0) {
      form.reset({
        skills: instructorSkills.map(passSkill),
      });
    }
  }, [instructorSkills]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'skills',
  });

  const addSkillMutation = useMutation(addInstructorSkillMutation());
  const updateSkillMutation = useMutation(updateInstructorSkillMutation());
  const deleteSkillMutation = useMutation(deleteInstructorSkillMutation());
  const { errors, submitting } = useMultiMutations([addSkillMutation, updateSkillMutation]);

  const saveSkills = async (data: SkillsFormValues) => {
    for (const [index, skill] of data.skills.entries()) {
      if (skill.uuid) {
        await updateSkillMutation.mutateAsync({
          path: {
            instructorUuid: instructor.uuid!,
            skillUuid: skill.uuid,
          },
          body: {
            skill_name: skill.skill_name,
            proficiency_level: skill.proficiency_level,
            proficiency_description: skill.proficiency_description,
            summary: skill.summary,
            instructor_uuid: instructor.uuid!,
          },
        });
      } else {
        const resp = await addSkillMutation.mutateAsync({
          path: { instructorUuid: instructor.uuid! },
          body: {
            instructor_uuid: instructor.uuid!,
            skill_name: skill.skill_name,
            proficiency_level: skill.proficiency_level,
            proficiency_description: skill.proficiency_description,
            summary: skill.summary,
          },
        });

        if (resp?.data) {
          const skills = form.getValues('skills');
          skills[index] = passSkill(resp.data as InstructorSkill);
          form.setValue('skills', skills);
        }
      }
    }

    qc.invalidateQueries({
      queryKey: getInstructorSkillsQueryKey({
        query: { pageable: { page: 0, size: 20 } },
        path: { instructorUuid: instructor.uuid! },
      }),
    });

    toast.success('Skills updated successfully');
    disableEditing();
  };

  const handleSubmit = (data: SkillsFormValues) => {
    requestConfirmation({
      title: 'Save skill updates?',
      description: 'Your skills help learners understand where you excel.',
      confirmLabel: 'Save skills',
      cancelLabel: 'Keep editing',
      onConfirm: () => saveSkills(data),
    });
  };

  const handleRemove = async (index: number) => {
    if (!isEditing) return;

    const skill = form.getValues(`skills.${index}`);

    if (!skill.uuid) {
      remove(index);
      return;
    }

    deleteSkillMutation.mutate(
      {
        path: { instructorUuid: instructor.uuid!, skillUuid: skill.uuid, },
      },
      {
        onSuccess: () => {
          remove(index);
          toast.success("Skill removed");
        },
      }
    );
  };


  const domainBadges =
    // @ts-expect-error
    user?.user_domain?.map(domain =>
      domain
        .split('_')
        .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    ) ?? [];

  const [_showSkillCard, _setShowSkillCard] = useState(false);

  return (
    <ProfileFormShell
      eyebrow='Instructor'
      title='Skills'
      description='Showcase the expertise and proficiencies that define your instructional style.'
      badges={domainBadges}
    >
      <div className='space-y-6'>
        <div className='flex w-full justify-end'>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant='outline' className='text-sm'>
                View Skill Card
              </Button>
            </DialogTrigger>

            <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto'>
              <DialogHeader />
              <InstructorSkillCard instructor={instructor} skills={instructorSkills} />
            </DialogContent>
          </Dialog>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
            {errors && errors.length > 0 && (
              <Alert variant='destructive' className='border-red-600 bg-red-50 text-red-700'>
                <AlertTitle className='font-semibold'>Unable to save your skills</AlertTitle>
                <AlertDescription>
                  <ul className='ml-4 list-disc space-y-1 text-sm'>
                    {errors.map((error, index) => (
                      <li key={index} className='text-red-600'>
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <ProfileFormSection
              title='Professional skills'
              description='Help learners understand what you teach best and your depth of experience.'
              footer={
                <Button
                  type='submit'
                  className='min-w-36'
                  disabled={!isEditing || submitting || isConfirming}
                >
                  {submitting || isConfirming ? (
                    <span className='flex items-center gap-2'>
                      <Spinner className='h-4 w-4' />
                      Saving…
                    </span>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              }
            >
              <div className='space-y-4'>
                {fields.map((field, index) => (
                  <div key={field.id} className='rounded-md border'>
                    <div className='flex items-center justify-between border-b p-4'>
                      <h3 className='text-sm font-medium'>
                        {form.watch(`skills.${index}.skill_name`) || 'New skill'}
                      </h3>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => handleRemove(index)}
                        className='hover:bg-destructive-foreground h-8 w-8'
                      >
                        <Trash2 className='text-destructive h-4 w-4' />
                      </Button>
                    </div>

                    <div className='space-y-6 p-6'>
                      <FormField
                        control={form.control}
                        name={`skills.${index}.skill_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skill</FormLabel>
                            <FormControl>
                              <Input placeholder='e.g. Graphic Design' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`skills.${index}.summary`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Overview</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Summarise where this skill shines.'
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`skills.${index}.proficiency_level`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Proficiency</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select level' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {proficiencyLevels.map(level => (
                                    <SelectItem key={level} value={level.toUpperCase()}>
                                      {level}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`skills.${index}.proficiency_description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Support detail</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='Describe your experience level.'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type='button'
                variant='outline'
                className='flex w-full items-center justify-center gap-2'
                onClick={() => append(defaultSkill)}
                disabled={!isEditing || submitting || isConfirming}
              >
                <PlusCircle className='h-4 w-4' />
                Add another skill
              </Button>
            </ProfileFormSection>
          </form>
        </Form>
      </div>
    </ProfileFormShell>
  );
}

