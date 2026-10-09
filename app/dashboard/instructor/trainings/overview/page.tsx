'use client';

import { useInstructor } from '@/context/instructor-context';
import useInstructorClassesWithDetails from '@/hooks/use-instructor-classes';
import TrainingsOverview from '../_components/trainings-overview';

export default function TrainingsOverviewPage() {
  const instructor = useInstructor();
  const { classes, loading } = useInstructorClassesWithDetails(instructor?.uuid);

  return <TrainingsOverview classesWithCourseAndInstructor={classes} loading={loading} />;
}
