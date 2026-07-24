import { PeopleDirectory } from '../_components/people-directory';

export default function OrganisationInstructorsPage() {
  return (
    <PeopleDirectory
      domain='instructor'
      title='Instructors'
      description='Onboard instructors and manage your teaching team.'
      addLabel='Add instructor'
    />
  );
}
