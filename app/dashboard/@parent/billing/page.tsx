import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParentBillingPage() {
  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle>Billing & invoices</CardTitle>
      </CardHeader>
      <CardContent className='text-sm text-muted-foreground'>
        Guardians with billing permissions will see invoices and payment options here soon.
      </CardContent>
    </Card>
  );
}
