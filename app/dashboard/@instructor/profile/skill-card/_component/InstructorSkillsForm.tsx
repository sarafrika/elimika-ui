'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import useMultiMutations from '@/hooks/use-multi-mutations';
import { Instructor, InstructorSkill } from '@/services/api/schema';
import { tanstackClient } from '@/services/api/tanstack-client';
import { schemas } from '@/services/api/zod-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription } from '../../../../../../components/ui/dialog';
import { addInstructorSkillMutation, getInstructorSkillsQueryKey } from '../../../../../../services/client/@tanstack/react-query.gen';
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
  const qc = useQueryClient()
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [viewSkillCard, setViewSkillCard] = useState(false)

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

  const defaultSkill: SkillType = {
    skill_name: 'JavaScript',
    proficiency_level: 'EXPERT',
    instructor_uuid: instructor.uuid!,
  };

  const passSkill = (skill: InstructorSkill) => ({
    ...defaultSkill,
    ...skill,
  });

  const form = useForm<SkillsFormValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      skills: instructorSkills.length ? instructorSkills.map(passSkill) : [defaultSkill],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'skills',
  });

  if (form.formState.isDirty) {
    //console.log('Form Errors', form.formState.errors);
    //console.log('Form values', form.getValues());
  }

  const addSkillMutation = useMutation(addInstructorSkillMutation())
  // const addSkillMutation = tanstackClient.useMutation(
  //   'post',
  //   '/api/v1/instructors/{instructorUuid}/skills'
  // );
  const updateSkillMutation = tanstackClient.useMutation(
    'put',
    '/api/v1/instructors/{instructorUuid}/skills/{skillUuid}'
  );
  const { submitting } = useMultiMutations([addSkillMutation, updateSkillMutation]);

  const onSubmit = (data: SkillsFormValues) => {
    //console.log(data);
    // TODO: Implement submission logic. The Instructor schema currently does not have a field for skills.

    data.skills.forEach(async (skill, index) => {
      const skillData = {
        ...skill,
      };

      if (skill.uuid) {
        updateSkillMutation.mutate({
          params: {
            path: {
              instructorUuid: instructor.uuid!,
              skillUuid: skill.uuid,
            },
          },
          body: skillData,
        });
      } else {
        addSkillMutation.mutate({
          body: {
            instructor_uuid: instructor.uuid!,
            skill_name: skillData.skill_name,
            proficiency_level: skillData.proficiency_level,
            proficiency_description: skillData.proficiency_description,
            summary: skillData.summary,
          },
          path: { instructorUuid: instructor.uuid! }
        }, {
          onSuccess: (data) => {
            toast.success(data?.message || "Skill added successfully")
            qc.invalidateQueries({ queryKey: getInstructorSkillsQueryKey({ query: { pageable: {} }, path: { instructorUuid: instructor.uuid! } }) })
          }
        })
      }
    });
  };

  return (
    <div className='space-y-6'>

      <div className='flex flex-row items-center justify-between' >
        <div>
          <h1 className='text-2xl font-semibold'>Skills</h1>
          <p className='text-muted-foreground text-sm'>
            Showcase your professional skills and proficiency levels.
          </p>
        </div>

        <div className='flex gap-2 w-fit'>
          <Button
            variant='outline'
            size='lg'
            className='flex-1'
            onClick={() => {
              setViewSkillCard(true)
            }}
          >
            <Eye className='mr-1 h-3 w-3' />
            View Skill Card
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          {fields.map((field, index) => (
            <Card key={`card${index}`}>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>Your Skills</span>
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    onClick={() => remove(index)}
                    className='h-10 w-10 flex-shrink-0'
                  >
                    <Trash2 className='h-4 w-4' />
                    <span className='sr-only'>Remove skill</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 pt-0'>
                <div className='space-y-4'>
                  <div key={field.id} className='flex flex-col gap-5'>
                    <FormField
                      control={form.control}
                      name={`skills.${index}.skill_name`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
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
                        <FormItem className='flex-1'>
                          <FormLabel>Explaing Further</FormLabel>
                          <FormControl>
                            <Textarea placeholder='Explain' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`skills.${index}.proficiency_level`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormLabel>Proficiency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormItem className='flex-1'>
                          <FormLabel>Tell us more</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <Textarea placeholder='Explain' {...field} />
                            </FormControl>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type='button'
            variant='outline'
            className='flex w-full items-center justify-center gap-2'
            onClick={() => append(defaultSkill)}
          >
            <PlusCircle className='h-4 w-4' />
            Add Another Skill
          </Button>

          <div className='flex justify-end pt-2'>
            <Button type='submit' className='px-6' disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>

      {viewSkillCard && (
        <Dialog open={viewSkillCard} onOpenChange={(open) => setViewSkillCard(open)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogDescription className='font-bold text-xl'>{instructor?.full_name}</DialogDescription>
            <div className="flex flex-col gap-2">
              {sampleSkillCard.map((skill: any) => (
                <InstructorSkillCard key={skill.uuid} skill={skill} />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


const sampleSkillCard = [
  {
    uuid: "skill-001",
    instructor_uuid: "instructor-123",
    skill_name: "Java Programming",
    proficiency_level: "EXPERT",
    proficiency_percentage: 95,
    proficiency_description: "Expert in Java with 7+ years of backend development experience in Spring Boot and RESTful APIs.",
    is_core_skill: true,
    is_teaching_qualified: true,
    skill_category: "PROGRAMMING_LANGUAGE",
    market_demand: "HIGH",
    created_date: "2023-10-01T10:00:00",
    updated_date: "2024-09-15T09:30:00"
  },
  {
    uuid: "skill-002",
    instructor_uuid: "instructor-123",
    skill_name: "React Development",
    proficiency_level: "ADVANCED",
    proficiency_percentage: 90,
    proficiency_description: "Building responsive frontend applications using React, Next.js, and Tailwind CSS.",
    is_core_skill: true,
    is_teaching_qualified: true,
    skill_category: "WEB_DEVELOPMENT",
    market_demand: "HIGH",
    created_date: "2022-03-15T11:00:00",
    updated_date: "2024-07-01T08:45:00"
  },
  {
    uuid: "skill-003",
    instructor_uuid: "instructor-123",
    skill_name: "React Development",
    proficiency_level: "ADVANCED",
    proficiency_percentage: 90,
    proficiency_description: "Strong experience building modern frontend applications with React, TypeScript, and Next.js.",
    is_core_skill: true,
    is_teaching_qualified: true,
    skill_category: "WEB_DEVELOPMENT",
    market_demand: "HIGH",
    created_date: "2022-05-20T09:45:00",
    updated_date: "2024-10-10T13:20:00"
  },
  {
    uuid: "skill-004",
    instructor_uuid: "instructor-123",
    skill_name: "Agile Project Management",
    proficiency_level: "INTERMEDIATE",
    proficiency_percentage: 75,
    proficiency_description: "Managed cross-functional teams using Scrum and Kanban. Experienced in Jira and project pipelines.",
    is_core_skill: false,
    is_teaching_qualified: true,
    skill_category: "PROJECT_MANAGEMENT",
    market_demand: "MEDIUM",
    created_date: "2021-03-12T11:00:00",
    updated_date: "2024-06-22T16:00:00"
  }
]

