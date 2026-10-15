import { CourseCreatorOverviewPage as CourseCreatorOverviewView } from '@/src/features/dashboard/workspace/pages/CourseCreatorOverviewPage';

export default function CourseCreatorOverviewPage() {
  return <CourseCreatorOverviewView />;
}

// Body
// fix missing total program counts in the course creator overview by correcting the training program query payload
// align analytics, monetization, and training requirement data with the updated creator data model
// refactor dashboard overview components to surface the refreshed KPI and wallet data
// update shared course and instructor catalog flows for the latest role - based behavior
// add and adjust skills wallet role pages, tab logic, and profile - specific data mapping
// remove obsolete course - creator program pages / components no longer used by the new structure
// update related hooks, utilities, and generated type definitions
// clean up supporting catalog and dashboard UI changes across the workspace
