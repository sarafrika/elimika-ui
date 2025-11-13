import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParentAttendancePage() {
  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle>Attendance Center</CardTitle>
      </CardHeader>
      <CardContent className='text-sm text-muted-foreground'>
        Dedicated attendance tooling for guardians is coming soon.
      </CardContent>
    </Card>
  );
}
