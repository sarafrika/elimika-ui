'use client';

import { LearningHubAssignments } from './LearningHubAssignments';
import { LearningHubContinueLearning } from './LearningHubContinueLearning';
import { LearningHubHero } from './LearningHubHero';
import { LearningHubLiveClasses } from './LearningHubLiveClasses';
import { LearningHubRightRail } from './LearningHubRightRail';
import { useStudentLearningHubData } from './useStudentLearningHubData';

export function StudentLearningHubPage() {
  const data = useStudentLearningHubData();

  return (
    <main className='mx-auto w-full max-w-[1320px] py-3 sm:py-4'>
      <div className='space-y-4'>
        <LearningHubHero
          firstName={data.firstName}
          studentName={data.studentName}
          stats={data.stats}
          loading={data.loading}
        />

        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]'>
          <div className='space-y-4'>
            <LearningHubContinueLearning classes={data.continueLearning} loading={data.loading} />
            <LearningHubLiveClasses liveClass={data.scheduledLiveClass} loading={data.loading} />
            <LearningHubAssignments assignments={data.assignments} loading={data.loading} />
          </div>

          <div>
            <LearningHubRightRail
              recommendedCourses={data.recommendedCourses}
              loading={data.loading}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
