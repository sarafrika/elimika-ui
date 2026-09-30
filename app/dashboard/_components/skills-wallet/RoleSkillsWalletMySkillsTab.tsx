'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import DeleteModal from '@/components/custom-modals/delete-modal';

import { SkillsWalletMySkillsTab } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletMySkillsTab';
import {
  fmtDate,
  type SkillRecord,
} from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import {
  deleteCourseCreatorSkillMutation,
  deleteInstructorSkillMutation,
  getCourseCreatorSkillsQueryKey,
  getInstructorSkillsQueryKey,
  getCourseCreatorSkillsOptions,
  getInstructorSkillsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseCreatorSkill, InstructorSkill } from '@/services/client/types.gen';
import { AddSkillDialog } from './AddSkillDialog';
import { SKILL_PROFICIENCY, type SkillProfileRole } from './skill-proficiency';

const PAGE_SIZE = 20;

type RoleSkillsWalletMySkillsTabProps = {
  role: SkillProfileRole;
  profileUuid: string;
};

export function RoleSkillsWalletMySkillsTab({
  role,
  profileUuid,
}: RoleSkillsWalletMySkillsTabProps) {
  const [page, setPage] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<CourseCreatorSkill | InstructorSkill | null>(
    null
  );
  const [deletingSkill, setDeletingSkill] = useState<CourseCreatorSkill | InstructorSkill | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const deleteInstructorMutation = useMutation(deleteInstructorSkillMutation());
  const deleteCreatorMutation = useMutation(deleteCourseCreatorSkillMutation());
  const instructorQuery = useQuery({
    ...getInstructorSkillsOptions({
      path: { instructorUuid: profileUuid },
      query: { pageable: { page, size: PAGE_SIZE } },
    }),
    enabled: Boolean(profileUuid) && role === 'instructor',
    staleTime: STALE_TIMES.entity,
  });
  const creatorQuery = useQuery({
    ...getCourseCreatorSkillsOptions({
      path: { courseCreatorUuid: profileUuid },
      query: { pageable: { page, size: PAGE_SIZE } },
    }),
    enabled: Boolean(profileUuid) && role === 'course_creator',
    staleTime: STALE_TIMES.entity,
  });
  const skillsQuery = role === 'instructor' ? instructorQuery : creatorQuery;
  const response = skillsQuery.data;
  const failed = skillsQuery.isError || Boolean(response?.error) || response?.success === false;
  const skillPage = failed ? undefined : response?.data;
  const data = useMemo(
    () => ({
      skills: (skillPage?.content ?? []).map((skill): SkillRecord => {
        const proficiency = SKILL_PROFICIENCY.find(
          option =>
            option.instructor === skill.proficiency_level ||
            option.courseCreator === skill.proficiency_level
        );
        return {
          id: skill.uuid || skill.skill_name,
          name: skill.skill_name,
          level: proficiency?.label ?? '',
          proficiency_pct: proficiency?.percentage ?? 0,
          category: '',
          last_used: null,
          last_assessed: fmtDate(skill.updated_date),
          icon_key: 'Sparkles',
        };
      }),
      categoryCounts: [],
    }),
    [skillPage]
  );
  const totalPages = skillPage?.metadata?.totalPages ?? 1;

  const handleDelete = async () => {
    if (!deletingSkill?.uuid || !profileUuid || isDeleting) return;
    setIsDeleting(true);
    try {
      const result =
        role === 'instructor'
          ? await deleteInstructorMutation.mutateAsync({
              path: { instructorUuid: profileUuid, skillUuid: deletingSkill.uuid },
            })
          : await deleteCreatorMutation.mutateAsync({
              path: { courseCreatorUuid: profileUuid, skillUuid: deletingSkill.uuid },
            });
      // Delete endpoints may return an empty 204 response or an API envelope.
      if (
        typeof result === 'object' &&
        result !== null &&
        (('error' in result && result.error) || ('success' in result && result.success === false))
      ) {
        toast.error(
          'message' in result && typeof result.message === 'string'
            ? result.message
            : 'Unable to delete this skill. Please try again.'
        );
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
      if (page > 0 && skillPage?.content?.length === 1) setPage(current => current - 1);
      setDeletingSkill(null);
      toast.success('Skill deleted successfully.');
    } catch (error) {
      toast.error(
        typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof error.message === 'string'
          ? error.message
          : 'Unable to delete this skill. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='space-y-4'>
      {skillsQuery.isLoading ? (
        <div className='space-y-4' aria-label='Loading skills'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-64 w-full' />
        </div>
      ) : failed ? (
        <EmptyState
          title='Unable to load skills'
          description='Please try loading your skills again.'
          action={
            <Button variant='outline' onClick={() => void skillsQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <SkillsWalletMySkillsTab
            data={data}
            onAddSkill={() => setAddOpen(true)}
            onEditSkill={skillId => {
              const skill = skillPage?.content?.find(item => item.uuid === skillId);
              if (skill?.uuid) setEditingSkill(skill);
            }}
            onDeleteSkill={skillId => {
              const skill = skillPage?.content?.find(item => item.uuid === skillId);
              if (skill?.uuid) setDeletingSkill(skill);
            }}
          />
          {totalPages > 1 ? (
            <div className='flex items-center justify-end gap-3'>
              <span className='text-muted-foreground text-sm'>
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant='outline'
                disabled={page === 0 || skillsQuery.isFetching}
                onClick={() => setPage(current => current - 1)}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                disabled={page + 1 >= totalPages || skillsQuery.isFetching}
                onClick={() => setPage(current => current + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
      {addOpen || editingSkill ? (
        <AddSkillDialog
          key={editingSkill?.uuid ?? 'new'}
          role={role}
          profileUuid={profileUuid}
          skill={editingSkill ?? undefined}
          onClose={() => {
            setAddOpen(false);
            setEditingSkill(null);
          }}
        />
      ) : null}
      <DeleteModal
        open={Boolean(deletingSkill)}
        setOpen={open => {
          if (!open && !isDeleting) setDeletingSkill(null);
        }}
        title='Delete skill?'
        description={`This will remove “${deletingSkill?.skill_name ?? ''}” from your skills wallet.`}
        onConfirm={() => void handleDelete()}
        isLoading={isDeleting}
      />
    </div>
  );
}
