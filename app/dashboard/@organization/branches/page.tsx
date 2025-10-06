'use client';

import CustomLoader from '@/components/custom-loader';
import DeleteModal from '@/components/custom-modals/delete-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import VirticleDotsIcons from '@/components/virticle-dots-icon';
import { useTrainingCenter } from '@/context/training-center-provide';
import { getTrainingBranchesByOrganisation } from '@/services/client';
import { deleteTrainingBranchMutation } from '@/services/client/@tanstack/react-query.gen';
import { Separator } from '@radix-ui/react-separator';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BranchesPage() {
  const qc = useQueryClient();
  const trainingCenter = useTrainingCenter();
  const [pageable, setPageable] = useState<{ page: number; size: number }>({ page: 0, size: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['branches', ...(trainingCenter ? [trainingCenter.uuid] : [])],
    queryFn: async () =>
      getTrainingBranchesByOrganisation({
        path: {
          uuid: trainingCenter!.uuid!,
        },
        query: {
          pageable,
        },
      }),
    enabled: !!trainingCenter,
  });

  const [deleteBranchModalOpen, setDeleteBranchModalOpen] = useState(false);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const deleteOrgBranch = (branch_uuid: string) => {
    setDeletingBranchId(branch_uuid);
    setDeleteBranchModalOpen(true);
  };

  const deleteBranchMutation = useMutation(deleteTrainingBranchMutation());
  const confirmDeleteOption = () => {
    if (!deletingBranchId) return;
    deleteBranchMutation.mutate(
      { path: { uuid: deletingBranchId } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ['branches'] });
          toast.success('Training branch deleted successfully');
          setDeleteBranchModalOpen(false);
          setDeletingBranchId(null);
        },
      }
    );
  };

  if (!trainingCenter) {
    return <CustomLoader />;
  }

  if (data && !data.error && data.data && data.data.data && data.data.data?.content) {
    trainingCenter.branches = data.data.data.content;
  }

  return (
    <div className='space-y-6 p-4 pb-16 md:py-10'>
      <div className='flex items-end justify-between'>
        <div className='flex-grow'>
          <h2 className='text-2xl font-bold tracking-tight'>{trainingCenter.name} Branches</h2>
          <p className='text-muted-foreground'>
            A list of all the {trainingCenter.name} organization branches.
          </p>
        </div>
        <Link href={'/dashboard/branches/new'}>
          <Button>New Branch</Button>
        </Link>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-col lg:space-y-0 lg:space-x-6'>
        {!trainingCenter.branches || trainingCenter.branches.length === 0 ? (
          <div className='mt-20 flex flex-col items-center justify-center'>
            <h3>There are no branches for this organization</h3>
            {/* If organization owner or admin show the add button */}
            <Button>Add New Branch</Button>
          </div>
        ) : (
          <Table>
            {/* <TableCaption></TableCaption> */}
            <TableHeader>
              <TableRow>
                <TableHead className='font-bold'>Branch Name</TableHead>
                <TableHead className='font-bold'>Contact Person</TableHead>
                {/* Organization admin / owner can edit delete a branch */}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingCenter.branches.map(branch => (
                <TableRow key={branch.uuid}>
                  <TableCell>
                    <Link href={`/dashboard/branches/${branch.uuid}`}>{branch.branch_name}</Link>
                  </TableCell>
                  <TableCell>
                    {branch.poc_name}
                    <div className='flex gap-3'>
                      {branch.poc_email && <Badge variant={'outline'}>{branch.poc_email}</Badge>}
                      {branch.poc_telephone && (
                        <Badge variant={'outline'}>{branch.poc_telephone}</Badge>
                      )}
                    </div>
                  </TableCell>
                  {/* Organization admin / owner can edit delete a branch */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost'>
                          <VirticleDotsIcons />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className='w-auto' align='end'>
                        {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
                        {/* <DropdownMenuSeparator /> */}
                        <DropdownMenuCheckboxItem>
                          <Link
                            className='flex items-center gap-3'
                            href={`/dashboard/branches/edit/${branch.uuid}`}
                          >
                            <Pencil /> <span>Edit</span>
                          </Link>
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>
                          <div
                            onClick={() => deleteOrgBranch(branch.uuid as string)}
                            className='flex gap-3'
                          >
                            <Trash /> <span className='text-red-500'>Delete</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <DeleteModal
        open={deleteBranchModalOpen}
        setOpen={setDeleteBranchModalOpen}
        title='Delete Organisation Branch'
        description='Are you sure you want to delete this branch? This action cannot be undone.'
        onConfirm={confirmDeleteOption}
        isLoading={deleteBranchMutation.isPending}
        confirmText='Delete Branch'
      />
    </div>
  );
}
