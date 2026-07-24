import { PeopleDirectory } from '../_components/people-directory';

export default function OrganisationStudentsPage() {
  return (
    <PeopleDirectory
      domain='student'
      title='Students'
      description='Invite, onboard and manage students across your programs.'
      addLabel='Add student'
    />
  );
}
