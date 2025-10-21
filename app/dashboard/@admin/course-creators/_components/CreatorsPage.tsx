'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import ErrorPage from '@/components/ErrorPage';
import { Instructor } from '@/services/api/schema';
import { CourseCreator } from '@/services/client';
import {
  deleteCourseCreatorMutation,
  getAllCourseCreatorsOptions,
  getAllCourseCreatorsQueryKey,
  unverifyCourseCreatorMutation,
  verifyCourseCreatorMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CourseCreatorDetailsPanel from './CreatorDetailsPanel';
import CourseCreatorMobileModal from './CreatorMobileModal';
import CreatorsList from './CreatorsList';

export default function CourseCreatorsPage() {
  const { data, error, isLoading } = useQuery(
    getAllCourseCreatorsOptions({ query: { pageable: { page: 0, size: 20, sort: ['desc'] } } })
  );

  const courseCreators = useMemo(() => data?.data?.content ?? [], [data?.data?.content]);
  const [selectedCreator, setSelectedCreator] = useState<Instructor | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (courseCreators.length > 0 && !selectedCreator) {
      setSelectedCreator(courseCreators[0] as any);
    }
  }, [courseCreators, selectedCreator]);

  const approveCourseCreator = useMutation(verifyCourseCreatorMutation());
  const rejectCourseCreator = useMutation(unverifyCourseCreatorMutation());

  const handleApproveCourseCreator = async (courseCreator: CourseCreator) => {
    try {
      approveCourseCreator.mutate(
        { path: { uuid: courseCreator.uuid! }, query: { reason: '' } },
        {
          onSuccess: (data) => {
            qc.invalidateQueries({
              queryKey: getAllCourseCreatorsQueryKey({ query: { pageable: {} } }),
            });
            // @ts-ignore
            toast.success(data?.message || "Course creator verified successfully");
          },
        }
      );
    } catch (error) { }
  };

  const handleRejectCourseCreator = async (courseCreator: CourseCreator) => {
    try {
      rejectCourseCreator.mutate(
        { path: { uuid: courseCreator.uuid! }, query: { reason: '' } },
        {
          onSuccess: (data) => {
            qc.invalidateQueries({
              queryKey: getAllCourseCreatorsQueryKey({ query: { pageable: {} } }),
            });
            // @ts-ignore
            toast.success(data?.message || "Course creator verification removed successfully");
          },
        }
      );
    } catch (error) { }
  };

  const handeCourseCreatorSelect = (courseCreator: CourseCreator) => {
    setSelectedCreator(courseCreator as any);
    // Open modal on small screens
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsModalOpen(true);
    }
  };


  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

  const deleteCourseCreator = useMutation(deleteCourseCreatorMutation())
  const handleCourseCreatorDelete = (creator: CourseCreator) => {
    setDeletingId(creator.uuid as string)
    setOpenDeleteModal(true)
  };

  const confirmDeleteCourseCreator = () => {
    if (!deletingId) return

    deleteCourseCreator.mutate({ path: { uuid: deletingId as string } }, {
      onSuccess: () => {
        toast.success("Course creator deleted successfully")
        qc.invalidateQueries({
          queryKey: getAllCourseCreatorsQueryKey({ query: { pageable: {} } }),
        });
      }
    })
  }

  // Filter and sort course creators
  const filteredAndSortedCourseCreators = courseCreators
    .filter(creator => {
      // Search filter
      const matchesSearch =
        creator.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.professional_headline?.toLowerCase().includes(searchQuery.toLowerCase())
      // creator.formatted_location?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const creatorStatus = creator.admin_verified ? 'approved' : 'pending';
      const matchesStatus = statusFilter === 'all' || creatorStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_date || '').getTime();
      const dateB = new Date(b.created_date || '').getTime();

      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

  if (error) {
    return (
      <ErrorPage message={error?.message || 'Something went wrong while fetching instructors'} />
    );
  }

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
      {/* Left Sidebar - Instructor List */}
      <CreatorsList
        courseCreators={filteredAndSortedCourseCreators as any}
        selectedCourseCreator={selectedCreator as any}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onCourseCreatorSelect={handeCourseCreatorSelect}
        onCourseCreatorDelete={handleCourseCreatorDelete}
        // getStatusBadgeComponent={getStatusBadgeComponent}
        isLoading={isLoading}
      />

      {/* Right Panel - Instructor Details (Desktop only) */}
      <CourseCreatorDetailsPanel
        courseCreator={selectedCreator as any}
        onApprove={handleApproveCourseCreator}
        onReject={handleRejectCourseCreator}
        isApprovePending={approveCourseCreator.isPending}
        isRejectPending={rejectCourseCreator.isPending}
      />

      {/* Mobile Modal */}
      <CourseCreatorMobileModal
        courseCreator={selectedCreator as any}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={handleApproveCourseCreator}
        onReject={handleRejectCourseCreator}
      />


      <DeleteModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        title='Delete Course Creator'
        description='This course creator will be deleted permanently. Are you sure you want to delete this course creator? This action cannot be undone.'
        onConfirm={confirmDeleteCourseCreator}
        isLoading={deleteCourseCreator.isPending}
        confirmText='Delete Course Creator'
      />
    </div>
  );
}
