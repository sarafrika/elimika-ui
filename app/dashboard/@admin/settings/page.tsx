import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Separator } from '@ui/separator';

const settingsOverview = [
  {
    title: 'Organization profile',
    description:
      'Update the primary contact, branding, and localization defaults that appear across the platform.',
  },
  {
    title: 'Communication policies',
    description:
      'Define the default sender details and escalation workflow for outbound system notifications.',
  },
  {
    title: 'Security posture',
    description:
      'Manage authentication requirements, session lifetimes, and monitoring for administrator activity.',
  },
  {
    title: 'Feature lifecycle',
    description:
      'Preview new capabilities safely by enabling feature flags or reverting to stable experiences instantly.',
  },
];

export default function AdminSettingsGeneralPage() {
  return (
    <div className='space-y-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>General settings</h1>
        <p className='text-muted-foreground'>
          Configure the foundational metadata that powers workflows across the admin dashboard.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Platform snapshot</CardTitle>
          <CardDescription>
            A quick summary of the areas you can configure. Jump into any section using the navigation to
            the left.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className='grid gap-4 pt-6 md:grid-cols-2'>
          {settingsOverview.map(item => (
            <div key={item.title} className='rounded-md border border-dashed border-border/70 p-4'>
              <h3 className='text-base font-semibold'>{item.title}</h3>
              <p className='mt-2 text-sm text-muted-foreground'>{item.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
