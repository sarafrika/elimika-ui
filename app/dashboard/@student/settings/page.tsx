'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { elimikaDesignSystem } from '@/lib/design-system';
import {
  AlertTriangle,
  Check,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Settings2,
  Shield,
  Trash2,
  X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../../../context/profile-context';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  email?: string;
  accountName?: string;
}

interface ConnectedApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  connectedAt: Date;
  permissions: string[];
  isActive: boolean;
}

interface BillingHistory {
  id: string;
  date: Date;
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

const SAMPLE_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: '2',
    type: 'card',
    brand: 'Mastercard',
    last4: '8888',
    expiryMonth: 6,
    expiryYear: 2026,
    isDefault: false,
  },
  {
    id: '3',
    type: 'paypal',
    email: 'user@example.com',
    isDefault: false,
  },
];

const SAMPLE_CONNECTED_APPS: ConnectedApp[] = [
  {
    id: '1',
    name: 'Google Calendar',
    description: 'Sync your class schedule with Google Calendar',
    icon: '📅',
    connectedAt: new Date('2024-01-15'),
    permissions: ['Read calendar events', 'Create calendar events', 'Manage calendar'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Zoom',
    description: 'Host virtual classes with Zoom integration',
    icon: '🎥',
    connectedAt: new Date('2024-02-01'),
    permissions: ['Create meetings', 'Manage recordings', 'View meeting details'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Slack',
    description: 'Send class notifications to Slack channels',
    icon: '💬',
    connectedAt: new Date('2024-03-10'),
    permissions: ['Send messages', 'Read channels', 'Manage workspace'],
    isActive: false,
  },
  {
    id: '4',
    name: 'Google Drive',
    description: 'Store and share course materials',
    icon: '📁',
    connectedAt: new Date('2024-01-20'),
    permissions: ['Read files', 'Write files', 'Manage sharing'],
    isActive: true,
  },
];

const SAMPLE_BILLING_HISTORY: BillingHistory[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    amount: 299.99,
    description: 'Pro Plan - Monthly Subscription',
    status: 'paid',
    invoiceUrl: '#',
  },
  {
    id: '2',
    date: new Date('2023-12-15'),
    amount: 299.99,
    description: 'Pro Plan - Monthly Subscription',
    status: 'paid',
    invoiceUrl: '#',
  },
  {
    id: '3',
    date: new Date('2023-11-15'),
    amount: 299.99,
    description: 'Pro Plan - Monthly Subscription',
    status: 'paid',
    invoiceUrl: '#',
  },
];

const SettingsPage = () => {
  const user = useUserProfile()

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(SAMPLE_PAYMENT_METHODS);
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>(SAMPLE_CONNECTED_APPS);
  const [billingHistory] = useState<BillingHistory[]>(SAMPLE_BILLING_HISTORY);

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  const [shareData, setShareData] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Advanced settings
  const [showAccountId, setShowAccountId] = useState(false);
  const [copiedAccountId, setCopiedAccountId] = useState(false);

  const [openDelete, setOpenDelete] = useState(false)


  const handleCopyAccountId = () => {
    navigator.clipboard.writeText(user?.uuid as string);
    setCopiedAccountId(true);
    toast.success('Account ID copied to clipboard');
    setTimeout(() => setCopiedAccountId(false), 2000);
  };

  const handleSetDefaultPayment = (id: string) => {
    setPaymentMethods(prev => prev.map(pm => ({ ...pm, isDefault: pm.id === id })));
    toast.success('Default payment method updated');
  };

  const handleRemovePayment = (id: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    toast.success('Payment method removed');
  };

  const handleToggleApp = (id: string) => {
    setConnectedApps(prev =>
      prev.map(app => (app.id === id ? { ...app, isActive: !app.isActive } : app))
    );
  };

  const handleDisconnectApp = (id: string) => {
    setConnectedApps(prev => prev.filter(app => app.id !== id));
    toast.success('App disconnected successfully');
  };

  const handleExportData = () => {
    toast.success('Data export initiated. You will receive an email when ready.');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion initiated. This action cannot be undone.');
  };

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-2xl font-bold'>Settings</h1>
            <p className='text-muted-foreground text-sm'>
              Manage your account preferences, privacy options, and notification settings to
              personalize your experience.
            </p>
          </div>
        </div>
      </section>

      <div className='space-y-6' >
        {/* Account Information */}
        <Card className='p-6'>
          <h2 className='mb-4 text-lg font-semibold'>Account Information</h2>
          <div className='space-y-4'>
            <div>
              <Label>Account ID</Label>
              <div className='mt-2 flex gap-2'>
                <Input
                  value={showAccountId ? user?.uuid : '•••••••••••••••••••'}
                  readOnly
                  className='font-mono'
                />
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setShowAccountId(!showAccountId)}
                >
                  {showAccountId ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
                <Button variant='outline' size='icon' onClick={handleCopyAccountId}>
                  {copiedAccountId ? (
                    <Check className='h-4 w-4 text-green-600' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>
                Use this ID for support inquiries
              </p>
            </div>

            <div>
              <Label>Account Created</Label>
              <Input value={user?.created_date} readOnly className='mt-2' />
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className='border-destructive p-6'>
          <div className='mb-4 flex items-start gap-3'>
            <AlertTriangle className='text-destructive mt-0.5 h-6 w-6' />
            <div>
              <h2 className='text-destructive text-lg font-semibold'>Danger Zone</h2>
              <p className='text-muted-foreground text-sm'>
                These actions are irreversible. Please proceed with caution.
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <Separator />

            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-destructive'>Delete Account</Label>
                <p className='text-muted-foreground text-sm'>
                  Permanently delete your account and all data
                </p>
              </div>

              <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                <AlertDialogTrigger asChild>
                  <Button variant='destructive'>
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and
                      remove all your data from our servers including:
                      <ul className='mt-2 list-inside list-disc space-y-1'>
                        <li>All classes and course materials</li>
                        <li>Student enrollments and records</li>
                        <li>Payment history and billing information</li>
                        <li>Messages and notifications</li>
                        <li>Connected apps and integrations</li>
                      </ul>
                    </AlertDialogDescription>
                    <div className='flex flex-row gap-2 self-end' >
                      <Button variant="outline" onClick={() => setOpenDelete(false)}>
                        Cancel
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={async () => {
                          await handleDeleteAccount()
                          setOpenDelete(false)
                        }}
                      >
                        Yes, Delete
                      </Button>
                    </div>
                  </AlertDialogHeader>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='billing' className='space-y-6 hidden'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='billing'>
            <CreditCard className='mr-2 h-4 w-4' />
            Billing
          </TabsTrigger>
          <TabsTrigger value='privacy'>
            <Shield className='mr-2 h-4 w-4' />
            Privacy
          </TabsTrigger>
          {/* <TabsTrigger value='apps'>
            <Link2 className='mr-2 h-4 w-4' />
            Connected Apps
          </TabsTrigger> */}
          <TabsTrigger value='advanced'>
            <Settings2 className='mr-2 h-4 w-4' />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Billing & Payments Tab */}
        <TabsContent value='billing' className='space-y-6'>
          {/* Current Plan */}
          <Card className='p-6'>
            <h2 className='mb-4 text-lg font-semibold'>Current Plan</h2>
            <div className='flex items-center justify-between'>
              <div>
                <div className='mb-1 flex items-center gap-2'>
                  <h3 className='text-xl font-bold'>Pro Plan</h3>
                  <Badge variant='default'>Active</Badge>
                </div>
                <p className='text-muted-foreground text-sm'>
                  $299.99/month • Renews on February 15, 2025
                </p>
              </div>
              <Button variant='outline'>Change Plan</Button>
            </div>
          </Card>

          {/* Payment Methods */}
          <Card className='p-6'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>Payment Methods</h2>
              <Button size='sm'>
                <Plus className='mr-2 h-4 w-4' />
                Add Payment Method
              </Button>
            </div>
            <div className='space-y-3'>
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  className='flex items-center justify-between rounded-lg border p-4'
                >
                  <div className='flex items-center gap-4'>
                    <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
                      {method.type === 'card' && <CreditCard className='text-primary h-5 w-5' />}
                      {method.type === 'paypal' && <DollarSign className='text-primary h-5 w-5' />}
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium'>
                          {method.type === 'card'
                            ? `${method.brand} •••• ${method.last4}`
                            : method.email}
                        </p>
                        {method.isDefault && (
                          <Badge variant='secondary' className='text-xs'>
                            Default
                          </Badge>
                        )}
                      </div>
                      {method.type === 'card' && (
                        <p className='text-muted-foreground text-sm'>
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    {!method.isDefault && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleSetDefaultPayment(method.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemovePayment(method.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Billing History */}
          <Card className='p-6 hidden'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>Billing History</h2>
              <Button variant='outline' size='sm'>
                <Download className='mr-2 h-4 w-4' />
                Download All
              </Button>
            </div>
            <div className='space-y-3'>
              {billingHistory.map(bill => (
                <div
                  key={bill.id}
                  className='flex items-center justify-between rounded-lg border p-4'
                >
                  <div className='flex items-center gap-4'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                      <FileText className='h-5 w-5 text-green-600' />
                    </div>
                    <div>
                      <p className='font-medium'>{bill.description}</p>
                      <p className='text-muted-foreground text-sm'>
                        {bill.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-4'>
                    <div className='text-right'>
                      <p className='font-semibold'>${bill.amount.toFixed(2)}</p>
                      <Badge
                        variant={
                          bill.status === 'paid'
                            ? 'secondary'
                            : bill.status === 'pending'
                              ? 'outline'
                              : 'destructive'
                        }
                        className='text-xs'
                      >
                        {bill.status}
                      </Badge>
                    </div>
                    <Button variant='ghost' size='sm'>
                      <Download className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value='privacy' className='space-y-6'>
          {/* Profile Privacy */}
          <Card className='p-6'>
            <h2 className='mb-4 text-lg font-semibold'>Profile Privacy</h2>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Public Profile</Label>
                  <p className='text-muted-foreground text-sm'>
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch checked={profileVisibility} onCheckedChange={setProfileVisibility} />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Show Email Address</Label>
                  <p className='text-muted-foreground text-sm'>
                    Display your email on your public profile
                  </p>
                </div>
                <Switch checked={showEmail} onCheckedChange={setShowEmail} />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Show Phone Number</Label>
                  <p className='text-muted-foreground text-sm'>
                    Display your phone number on your profile
                  </p>
                </div>
                <Switch checked={showPhone} onCheckedChange={setShowPhone} />
              </div>
            </div>
          </Card>

          {/* Communication Preferences */}
          <Card className='p-6'>
            <h2 className='mb-4 text-lg font-semibold'>Communication</h2>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Allow Direct Messages</Label>
                  <p className='text-muted-foreground text-sm'>
                    Let students and instructors message you
                  </p>
                </div>
                <Switch checked={allowMessages} onCheckedChange={setAllowMessages} />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Email Notifications</Label>
                  <p className='text-muted-foreground text-sm'>
                    Receive updates about classes and messages
                  </p>
                </div>
                <Button variant='outline' size='sm'>
                  Configure
                </Button>
              </div>
            </div>
          </Card>

          {/* Data & Privacy */}
          <Card className='p-6'>
            <h2 className='mb-4 text-lg font-semibold'>Data & Privacy</h2>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Share Usage Data</Label>
                  <p className='text-muted-foreground text-sm'>
                    Help us improve by sharing anonymous usage data
                  </p>
                </div>
                <Switch checked={shareData} onCheckedChange={setShareData} />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Two-Factor Authentication</Label>
                  <p className='text-muted-foreground text-sm'>
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Download Your Data</Label>
                  <p className='text-muted-foreground text-sm'>Get a copy of all your data</p>
                </div>
                <Button variant='outline' size='sm' onClick={handleExportData}>
                  <Download className='mr-2 h-4 w-4' />
                  Export Data
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Connected Apps Tab */}
        <TabsContent value='apps' className='space-y-6 hidden'>
          <Card className='p-6'>
            <div className='mb-4 flex items-center justify-between'>
              <div>
                <h2 className='text-lg font-semibold'>Connected Applications</h2>
                <p className='text-muted-foreground text-sm'>
                  Manage third-party apps and integrations
                </p>
              </div>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Connect App
              </Button>
            </div>

            <div className='flex flex-1 flex-col justify-center items-center text-center text-muted-foreground my-40'>
              <p className='text-sm'>
                This feature will be available soon. Stay tuned!
              </p>
            </div>


            <div className='space-y-4 hidden'>
              {connectedApps.map(app => (
                <div key={app.id} className='rounded-lg border p-4'>
                  <div className='mb-3 flex items-start justify-between'>
                    <div className='flex items-start gap-4'>
                      <div className='text-4xl'>{app.icon}</div>
                      <div>
                        <div className='mb-1 flex items-center gap-2'>
                          <h3 className='font-semibold'>{app.name}</h3>
                          <Badge variant={app.isActive ? 'default' : 'secondary'}>
                            {app.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className='text-muted-foreground mb-2 text-sm'>{app.description}</p>
                        <p className='text-muted-foreground text-xs'>
                          Connected on {app.connectedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Switch
                        checked={app.isActive}
                        onCheckedChange={() => handleToggleApp(app.id)}
                      />
                    </div>
                  </div>

                  <Separator className='my-3' />

                  <div className='space-y-2'>
                    <p className='text-sm font-medium'>Permissions:</p>
                    <div className='flex flex-wrap gap-2'>
                      {app.permissions.map((permission, idx) => (
                        <Badge key={idx} variant='outline' className='text-xs'>
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className='mt-4 flex gap-2'>
                    <Button variant='outline' size='sm'>
                      <ExternalLink className='mr-2 h-4 w-4' />
                      Manage Permissions
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant='destructive' size='sm'>
                          <X className='mr-2 h-4 w-4' />
                          Disconnect
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect {app.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove all permissions and stop syncing data with {app.name}.
                            You can reconnect at any time.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDisconnectApp(app.id)}
                            className='bg-destructive hover:bg-destructive/90'
                          >
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value='advanced' className='space-y-6'>
          {/* Account Information */}
          <Card className='p-6'>
            <h2 className='mb-4 text-lg font-semibold'>Account Information</h2>
            <div className='space-y-4'>
              <div>
                <Label>Account ID</Label>
                <div className='mt-2 flex gap-2'>
                  <Input
                    value={showAccountId ? user?.uuid : '•••••••••••••••••••••••••'}
                    readOnly
                    className='font-mono'
                  />
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => setShowAccountId(!showAccountId)}
                  >
                    {showAccountId ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </Button>
                  <Button variant='outline' size='icon' onClick={handleCopyAccountId}>
                    {copiedAccountId ? (
                      <Check className='h-4 w-4 text-green-600' />
                    ) : (
                      <Copy className='h-4 w-4' />
                    )}
                  </Button>
                </div>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Use this ID for support inquiries
                </p>
              </div>

              <div>
                <Label>Account Created</Label>
                <Input value={user?.created_date} readOnly className='mt-2' />
              </div>

              {/* <div>
                <Label>Last Login</Label>
                <Input value='January 20, 2025 at 2:30 PM' readOnly className='mt-2' />
              </div> */}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className='border-destructive p-6'>
            <div className='mb-4 flex items-start gap-3'>
              <AlertTriangle className='text-destructive mt-0.5 h-6 w-6' />
              <div>
                <h2 className='text-destructive text-lg font-semibold'>Danger Zone</h2>
                <p className='text-muted-foreground text-sm'>
                  These actions are irreversible. Please proceed with caution.
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              <Separator />
              {/* <div className='flex items-center justify-between'>
                <div>
                  <Label>Deactivate Account</Label>
                  <p className='text-muted-foreground text-sm'>Temporarily disable your account</p>
                </div>
                <Button variant='outline'>Deactivate</Button>
              </div> */}

              {/* <Separator /> */}

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-destructive'>Delete Account</Label>
                  <p className='text-muted-foreground text-sm'>
                    Permanently delete your account and all data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant='destructive'>
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and
                        remove all your data from our servers including:
                        <ul className='mt-2 list-inside list-disc space-y-1'>
                          <li>All classes and course materials</li>
                          <li>Student enrollments and records</li>
                          <li>Payment history and billing information</li>
                          <li>Messages and notifications</li>
                          <li>Connected apps and integrations</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div>
                      <Button>Yes, Delete</Button>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>


    </div>
  );
};

export default SettingsPage;
