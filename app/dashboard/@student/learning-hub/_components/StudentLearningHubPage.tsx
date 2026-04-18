'use client';

import { LearningHubAssignments } from './LearningHubAssignments';
import { LearningHubClassInvite } from './LearningHubClassInvite';
import { LearningHubContinueLearning } from './LearningHubContinueLearning';
import { LearningHubHero } from './LearningHubHero';
import { LearningHubLiveClasses } from './LearningHubLiveClasses';
import { LearningHubRightRail } from './LearningHubRightRail';
import { useStudentLearningHubData } from './useStudentLearningHubData';

export function StudentLearningHubPage() {
  const data = useStudentLearningHubData();

  return (
    <main className='mx-auto w-full max-w-[1320px] bg-white py-3 sm:py-4'>
      <div className='space-y-4'>
        <LearningHubHero
          firstName={data.firstName}
          studentName={data.studentName}
          stats={data.stats}
        />

        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]'>
          <div className='space-y-4'>
            <LearningHubContinueLearning courses={data.continueLearning} />
            <LearningHubLiveClasses liveClass={data.scheduledLiveClass} />
            <LearningHubAssignments assignments={data.assignments} />
            <LearningHubClassInvite invite={data.invite} />
          </div>

          <div>
            <LearningHubRightRail recommendedCourses={data.recommendedCourses} />
          </div>
        </div>
      </div>
    </main>
  );
}
