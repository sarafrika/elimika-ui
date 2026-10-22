import { redirect } from 'next/navigation';

const AssessmentPage = () => {
  redirect('/dashboard/instructor/training-hub?tab=assessment');
};

export default AssessmentPage;
