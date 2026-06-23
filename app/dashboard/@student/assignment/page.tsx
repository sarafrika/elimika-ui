'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { StudentAssignmentWorkspace } from '../_components/student-assignment-workspace';
import { StudentQuizWorkspace } from '../_components/student-quiz-workspace';

export default function AssignmentsPage() {
  const [tab, setTab] = useState('assignments');

  useEffect(() => {
    const savedTab = localStorage.getItem('student-tab');
    if (savedTab) {
      setTab(savedTab);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setTab(value);
    localStorage.setItem('student-tab', value);
  };


  return (
    <div className="p-6">
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl p-1 md:w-auto">
          <TabsTrigger
            value="assignments"
            className="h-9 rounded-lg px-6 text-sm font-medium"
          >
            Assignments
          </TabsTrigger>

          <TabsTrigger
            value="quizzes"
            className="h-9 rounded-lg px-6 text-sm font-medium"
          >
            Quizzes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <StudentAssignmentWorkspace />
        </TabsContent>

        <TabsContent value="quizzes">
          <StudentQuizWorkspace />
        </TabsContent>
      </Tabs>
    </div>
  );
}