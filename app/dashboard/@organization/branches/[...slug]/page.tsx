import { ArrowLeft, Book, LineChart, MapPin, UserIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../../../../../components/ui/badge';
import { Calendar } from '../../../../../components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import { Separator } from '../../../../../components/ui/separator';
import { getTrainingBranchByUuid, type TrainingBranch } from '../../../../../services/client';
import TabSection from '../_components/tabsection';
import type { Action } from './utils';

export default async function ViewBranch({
  params,
  ...slots
}: {
  params: Promise<{ slug: Action[] }>;
}) {
  const {
    slug: [branch_uuid, _tab],
  } = await params;

  if (branch_uuid === 'new' || branch_uuid === 'edit') {
    return null;
  }

  const branchResp = await getTrainingBranchByUuid({ path: { uuid: branch_uuid! } });
  if (branchResp.error || !branchResp.data) {
    return <>No Branch</>;
  }

  const branch = branchResp.data.data as TrainingBranch;

  return (
    <>
      <div className='flex items-start gap-5'>
        <Link href={'/dashboard/branches'}>
          <ArrowLeft />
        </Link>
        <div>
          <h3 className='text-2xl font-bold'>{branch.branch_name} Branch</h3>
          <p>Information about {branch.branch_name} branch</p>
        </div>
      </div>
      <Separator />

      <div className='grid grid-cols-1 gap-5 lg:grid-cols-4'>
        <div className='col-span-3 flex flex-col gap-5'>
          <div className='flex flex-col flex-wrap gap-5 md:flex-row'>
            <Card className='flex-grow'>
              <CardContent>
                <div className='flex flex-col'>
                  <div className='flex gap-2'>
                    <MapPin size={32} className='text-muted-foreground' />
                    <div>
                      <span className='text-muted-foreground'>Location</span>
                      <h5 className=''>{branch.address}</h5>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <h4 className='flex items-center gap-2'>
                      <UserIcon size={32} className='text-muted-foreground' />
                      <div>
                        <span className='text-muted-foreground'>Point of contact</span>
                        <h4>{branch.poc_name}</h4>
                      </div>
                    </h4>
                    <div className='flex gap-3'>
                      {branch.poc_email && <Badge variant={'outline'}>{branch.poc_email}</Badge>}
                      {branch.poc_telephone && (
                        <Badge variant={'outline'}>{branch.poc_telephone}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='flex-grow'>
              <CardHeader>
                <CardTitle>Total Students</CardTitle>
                <CardDescription>Number of students enrolled</CardDescription>
              </CardHeader>
              <CardContent>
                <h1 className='flex gap-3 text-3xl'>
                  <UsersIcon size={32} /> 150k
                  <LineChart className='text-muted-foreground ms-auto' />
                </h1>
              </CardContent>
            </Card>

            <Card className='flex-grow'>
              <CardHeader>
                <CardTitle>Total Courses</CardTitle>
                <CardDescription>Number of courses offered</CardDescription>
              </CardHeader>
              <CardContent>
                <h1 className='flex gap-3 text-3xl'>
                  <Book size={32} /> 100+
                </h1>
              </CardContent>
            </Card>
          </div>

          <TabSection {...{ branch }} />
        </div>
        <div>
          <Card>
            <CardContent>
              <Calendar className='w-full' />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
