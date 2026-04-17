'use client';

import { useEffect, useMemo, useState } from 'react';
import { AssessmentActions } from './AssessmentActions';
import { AssessmentTopBar } from './AssessmentTopBar';
import { CompetencyChecklist } from './CompetencyChecklist';
import { FeedbackPanel } from './FeedbackPanel';
import { ProjectSummaryCard } from './ProjectSummaryCard';
import { RubricTracker } from './RubricTracker';
import { assessments, type AssessmentItem, type AssessmentTab } from './assessment-data';

function getFilteredAssessments(activeTab: AssessmentTab) {
  if (activeTab === 'active') {
    return assessments.filter(assessment => assessment.score === null);
  }

  if (activeTab === 'competencies') {
    return assessments.filter(assessment => assessment.score !== null && assessment.passed);
  }

  return assessments.filter(assessment => assessment.score !== null);
}

function getTabDescription(activeTab: AssessmentTab, count: number) {
  if (activeTab === 'active') {
    return `${count} assessment${count === 1 ? '' : 's'} awaiting grading or review.`;
  }

  if (activeTab === 'competencies') {
    return `${count} completed assessment${count === 1 ? '' : 's'} passed by the student.`;
  }

  return `${count} graded assessment${count === 1 ? '' : 's'} ready for review.`;
}

export function AssessmentWorkspace() {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('active');
  const filteredAssessments = useMemo(() => getFilteredAssessments(activeTab), [activeTab]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(
    filteredAssessments[0]?.id ?? ''
  );

  const activeCount = assessments.filter(assessment => assessment.score === null).length;
  const completedCount = assessments.filter(assessment => assessment.score !== null).length;
  const competenciesCount = assessments.filter(
    assessment => assessment.score !== null && assessment.passed
  ).length;

  useEffect(() => {
    setSelectedAssessmentId(filteredAssessments[0]?.id ?? '');
  }, [filteredAssessments]);

  const selectedAssessment =
    filteredAssessments.find(assessment => assessment.id === selectedAssessmentId) ??
    filteredAssessments[0];

  return (
    <main className='bg-muted/30 min-h-screen'>
      <div className='border-border bg-background mx-auto flex max-w-[1280px] flex-col overflow-hidden border shadow-sm'>
        <AssessmentTopBar
          activeCount={activeCount}
          activeTab={activeTab}
          completedCount={completedCount}
          competenciesCount={competenciesCount}
          onTabChange={setActiveTab}
        />

        {selectedAssessment ? <AssessmentActions selectedAssessment={selectedAssessment} /> : null}

        <div className='grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_300px]'>
          <div className='space-y-4'>
            <AssessmentList
              activeTab={activeTab}
              assessments={filteredAssessments}
              onSelectAssessment={setSelectedAssessmentId}
              selectedAssessmentId={selectedAssessment?.id}
            />

            {selectedAssessment ? <RubricTracker assessment={selectedAssessment} /> : null}
          </div>

          <div className='space-y-4'>
            <FeedbackPanel />
            <CompetencyChecklist />
          </div>
        </div>
      </div>
    </main>
  );
}

function AssessmentList({
  activeTab,
  assessments,
  onSelectAssessment,
  selectedAssessmentId,
}: {
  activeTab: AssessmentTab;
  assessments: AssessmentItem[];
  onSelectAssessment: (assessmentId: string) => void;
  selectedAssessmentId?: string;
}) {
  return (
    <section className='space-y-3' aria-label='Assessment list'>
      <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h3 className='text-foreground text-lg font-semibold capitalize'>{activeTab}</h3>
          <p className='text-muted-foreground text-sm'>
            {getTabDescription(activeTab, assessments.length)}
          </p>
        </div>
      </div>

      {assessments.length > 0 ? (
        <div className='space-y-4'>
          {assessments.map(assessment => (
            <ProjectSummaryCard
              assessment={assessment}
              isSelected={assessment.id === selectedAssessmentId}
              key={assessment.id}
              onSelect={() => onSelectAssessment(assessment.id)}
            />
          ))}
        </div>
      ) : (
        <div className='border-border bg-card text-muted-foreground rounded-md border p-6 text-sm shadow-xs'>
          No assessments found for this view.
        </div>
      )}
    </section>
  );
}
