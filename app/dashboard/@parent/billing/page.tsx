import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParentBillingPage() {
  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle>Billing & invoices</CardTitle>
      </CardHeader>
      <CardContent className='text-muted-foreground text-sm'>
        Guardians with billing permissions will see invoices and payment options here soon.
      </CardContent>
    </Card>
  );
}
