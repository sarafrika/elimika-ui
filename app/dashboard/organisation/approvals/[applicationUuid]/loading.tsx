import { OrgPage } from '../../_components/org-page';
import { ApplicationDetailsSkeleton } from '../_components/application-details-skeleton';

export default function ApplicationDetailsLoading() {
  return (
    <OrgPage>
      <ApplicationDetailsSkeleton />
    </OrgPage>
  );
}
