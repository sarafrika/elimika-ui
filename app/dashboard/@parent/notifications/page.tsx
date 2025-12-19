import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParentNotificationsPage() {
  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className='text-muted-foreground text-sm'>
        Parent-specific notifications will show up here soon.
      </CardContent>
    </Card>
  );
}
