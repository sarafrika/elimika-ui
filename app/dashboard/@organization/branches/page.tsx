"use client"
import CustomLoader from '@/components/custom-loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTrainingCenter } from '@/context/training-center-provide';
import { Separator } from '@radix-ui/react-separator';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../../../../components/ui/dropdown-menu';
import VirticleDotsIcons from '../../../../components/virticle-dots-icon';
import { getTrainingBranchesByOrganisation } from '../../../../services/client';



export default function BranchesPage() {

  const trainingCenter = useTrainingCenter();
  const [pageable, setPageable] = useState<{ page: number, size: number }>({ page: 0, size: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ["branches", ...(trainingCenter ? [trainingCenter.uuid] : [])],
    queryFn: async () => getTrainingBranchesByOrganisation({
      path: {
        uuid: trainingCenter?.uuid!
      },
      query: {
        pageable
      }
    }),
    enabled: !!trainingCenter
  })

  if (!trainingCenter) {
    return (<CustomLoader />);
  }

  if (data && !data.error && data.data && data.data.data && data.data.data?.content) {
    trainingCenter.branches = data.data.data.content;
  }

  return (
    <div className='space-y-6 p-4 pb-16 md:py-10'>
      <div className='flex items-end justify-between'>
        <div className='flex-grow'>
          <h2 className='text-2xl font-bold tracking-tight'>{trainingCenter.name} Branches</h2>
          <p className='text-muted-foreground'>A list of all the {trainingCenter.name} organization branches.</p>
        </div>
        <Link href={"/dashboard/branches/new"}><Button>New Branch</Button></Link>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-col lg:space-y-0 lg:space-x-6'>
        {!trainingCenter.branches || trainingCenter.branches.length === 0 ?
          <div className='flex flex-col items-center justify-center'>
            <h3>There are no branches for this organization</h3>
            {/* If organization owner or admin show the add button */}
            <Button>Add New Branch</Button>
          </div> :
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
              {trainingCenter.branches.map(branch => <TableRow key={branch.uuid}>
                <TableCell>
                  <Link href={`/dashboard/branches/${branch.uuid}`}>{branch.branch_name}</Link>
                </TableCell>
                <TableCell>
                  {branch.poc_name}
                  <div className="flex gap-3">
                    {branch.poc_email && <Badge variant={"outline"}>{branch.poc_email}</Badge>}
                    {branch.poc_telephone && <Badge variant={"outline"}>{branch.poc_telephone}</Badge>}
                  </div>
                </TableCell>
                {/* Organization admin / owner can edit delete a branch */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost"><VirticleDotsIcons /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
                      {/* <DropdownMenuSeparator /> */}
                      <DropdownMenuCheckboxItem>
                        <Link className='flex gap-3 items-center' href={`/dashboard/branches/edit/${branch.uuid}`}>
                          <Pencil /> <span>Edit</span>
                        </Link>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>
                        <Link href={""} className='flex gap-3'>
                          <Trash /> <span className='text-red-500'>Delete</span>
                        </Link>
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>)}
            </TableBody>
          </Table>}
      </div>
    </div>
  );
}
