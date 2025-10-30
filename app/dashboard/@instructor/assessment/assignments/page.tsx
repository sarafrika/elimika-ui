'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import AssignmentListPage from './assignment-list';
import AssignmentSubmissionPage from './submissions';

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className='space-y-6'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='list'>Browse Assignments</TabsTrigger>
          <TabsTrigger value='submissions'>Assignment Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value='list' className='mt-6'>
          <AssignmentListPage />
        </TabsContent>

        <TabsContent value='submissions' className='mt-6'>
          <AssignmentSubmissionPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
