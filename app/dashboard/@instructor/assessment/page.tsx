'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCheck, FileText, ListChecks, User } from 'lucide-react';
import { useState } from 'react';
import AssignmentsPage from './assignments/page';
import ExamsPage from './exams/page';
import QuizPage from './quiz/page';

export default function AssessmentManagementPage() {
  const [activeTab, setActiveTab] = useState('assignments');

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-8'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='students'>
            <User /> Students
          </TabsTrigger>
          <TabsTrigger value='assignments'>
            <FileText /> Assignment
          </TabsTrigger>
          <TabsTrigger value='quiz'>
            <ListChecks /> Quiz
          </TabsTrigger>
          <TabsTrigger value='exams'>
            <FileCheck /> Exams
          </TabsTrigger>
        </TabsList>

        <TabsContent value='students' className='space-y-6'>
          <div>Enrolled students here</div>
        </TabsContent>

        <TabsContent value='assignments' className='space-y-6'>
          <AssignmentsPage />
        </TabsContent>

        <TabsContent value='quiz' className='space-y-6'>
          <QuizPage />
        </TabsContent>

        <TabsContent value='exams' className='space-y-6'>
          <ExamsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
