'use client';

import { PageHeader } from '../../../../components/page-header';

interface RubricManagementLayoutProps {
  children: React.ReactNode;
}

export default function RubricManagementLayout({ children }: RubricManagementLayoutProps) {
  return (
    <div className='space-y-6 px-4 py-4'>
      <PageHeader
        eyebrow='RUBRICS'
        title='Manage Rubrics'
        description='Define clear assessment criteria, provide consistent and objective grading, and deliver actionable feedback to students — all in one place.'
        actions={
          <></>
        }
      />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='w-full max-w-[2400px] min-w-0 flex-1'>{children}</div>
      </div>
    </div>
  );
}
