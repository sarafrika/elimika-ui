type CourseCreatorUserInfoGridProps = {
  user?: {
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    username?: string | null;
    phone_number?: string | null;
  } | null;
};

export function CourseCreatorUserInfoGrid({ user }: CourseCreatorUserInfoGridProps) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <ReadOnlyField
        label='Full Name'
        value={`${user?.first_name ?? ''} ${user?.middle_name ?? ''} ${user?.last_name ?? ''}`.trim()}
      />
      <ReadOnlyField label='Email' value={user?.email} />
      <ReadOnlyField label='Username' value={user?.username} />
      <ReadOnlyField label='Phone Number' value={user?.phone_number} />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className='text-muted-foreground text-sm'>{label}</p>
      <div className='bg-muted mt-2 rounded-md border px-3 py-2 text-sm'>{value || '-'}</div>
    </div>
  );
}
