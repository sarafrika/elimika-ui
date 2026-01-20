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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { elimikaDesignSystem } from "@/lib/design-system";
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
    Link2,
    Lock,
    Plus,
    Settings2,
    Shield,
    Smartphone,
    Trash2,
    X
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
        isDefault: true
    },
    {
        id: '2',
        type: 'card',
        brand: 'Mastercard',
        last4: '8888',
        expiryMonth: 6,
        expiryYear: 2026,
        isDefault: false
    },
    {
        id: '3',
        type: 'paypal',
        email: 'user@example.com',
        isDefault: false
    }
];

const SAMPLE_CONNECTED_APPS: ConnectedApp[] = [
    {
        id: '1',
        name: 'Google Calendar',
        description: 'Sync your class schedule with Google Calendar',
        icon: '📅',
        connectedAt: new Date('2024-01-15'),
        permissions: ['Read calendar events', 'Create calendar events', 'Manage calendar'],
        isActive: true
    },
    {
        id: '2',
        name: 'Zoom',
        description: 'Host virtual classes with Zoom integration',
        icon: '🎥',
        connectedAt: new Date('2024-02-01'),
        permissions: ['Create meetings', 'Manage recordings', 'View meeting details'],
        isActive: true
    },
    {
        id: '3',
        name: 'Slack',
        description: 'Send class notifications to Slack channels',
        icon: '💬',
        connectedAt: new Date('2024-03-10'),
        permissions: ['Send messages', 'Read channels', 'Manage workspace'],
        isActive: false
    },
    {
        id: '4',
        name: 'Google Drive',
        description: 'Store and share course materials',
        icon: '📁',
        connectedAt: new Date('2024-01-20'),
        permissions: ['Read files', 'Write files', 'Manage sharing'],
        isActive: true
    }
];

const SAMPLE_BILLING_HISTORY: BillingHistory[] = [
    {
        id: '1',
        date: new Date('2024-01-15'),
        amount: 299.99,
        description: 'Pro Plan - Monthly Subscription',
        status: 'paid',
        invoiceUrl: '#'
    },
    {
        id: '2',
        date: new Date('2023-12-15'),
        amount: 299.99,
        description: 'Pro Plan - Monthly Subscription',
        status: 'paid',
        invoiceUrl: '#'
    },
    {
        id: '3',
        date: new Date('2023-11-15'),
        amount: 299.99,
        description: 'Pro Plan - Monthly Subscription',
        status: 'paid',
        invoiceUrl: '#'
    }
];


const SettingsPage = () => {
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
    const accountId = 'ACC-2024-0123456789';

    const handleCopyAccountId = () => {
        navigator.clipboard.writeText(accountId);
        setCopiedAccountId(true);
        toast.success('Account ID copied to clipboard');
        setTimeout(() => setCopiedAccountId(false), 2000);
    };

    const handleSetDefaultPayment = (id: string) => {
        setPaymentMethods(prev =>
            prev.map(pm => ({ ...pm, isDefault: pm.id === id }))
        );
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
                        <h1 className="text-foreground text-2xl font-bold">Settings</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage your account preferences, privacy options, and notification settings to personalize your experience.
                        </p>
                    </div>
                </div>
            </section>

            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 rounded-md shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="font-medium">🚧 This page is under construction.</p>
                    <p className="text-sm text-yellow-900">Mock data is being used for this template</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="billing" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="billing">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Billing
                    </TabsTrigger>
                    <TabsTrigger value="privacy">
                        <Shield className="h-4 w-4 mr-2" />
                        Privacy
                    </TabsTrigger>
                    <TabsTrigger value="apps">
                        <Link2 className="h-4 w-4 mr-2" />
                        Connected Apps
                    </TabsTrigger>
                    <TabsTrigger value="advanced">
                        <Settings2 className="h-4 w-4 mr-2" />
                        Advanced
                    </TabsTrigger>
                </TabsList>

                {/* Billing & Payments Tab */}
                <TabsContent value="billing" className="space-y-6">
                    {/* Current Plan */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold">Pro Plan</h3>
                                    <Badge variant="default">Active</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    $299.99/month • Renews on February 15, 2025
                                </p>
                            </div>
                            <Button variant="outline">Change Plan</Button>
                        </div>
                    </Card>

                    {/* Payment Methods */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Payment Methods</h2>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Payment Method
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {paymentMethods.map(method => (
                                <div
                                    key={method.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            {method.type === 'card' && <CreditCard className="h-5 w-5 text-primary" />}
                                            {method.type === 'paypal' && <DollarSign className="h-5 w-5 text-primary" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {method.type === 'card'
                                                        ? `${method.brand} •••• ${method.last4}`
                                                        : method.email}
                                                </p>
                                                {method.isDefault && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Default
                                                    </Badge>
                                                )}
                                            </div>
                                            {method.type === 'card' && (
                                                <p className="text-sm text-muted-foreground">
                                                    Expires {method.expiryMonth}/{method.expiryYear}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!method.isDefault && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSetDefaultPayment(method.id)}
                                            >
                                                Set as Default
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemovePayment(method.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Billing History */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Billing History</h2>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download All
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {billingHistory.map(bill => (
                                <div
                                    key={bill.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{bill.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {bill.date.toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-semibold">${bill.amount.toFixed(2)}</p>
                                            <Badge
                                                variant={
                                                    bill.status === 'paid'
                                                        ? 'secondary'
                                                        : bill.status === 'pending'
                                                            ? 'outline'
                                                            : 'destructive'
                                                }
                                                className="text-xs"
                                            >
                                                {bill.status}
                                            </Badge>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy" className="space-y-6">
                    {/* Profile Privacy */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Profile Privacy</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Public Profile</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Make your profile visible to other users
                                    </p>
                                </div>
                                <Switch checked={profileVisibility} onCheckedChange={setProfileVisibility} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Show Email Address</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display your email on your public profile
                                    </p>
                                </div>
                                <Switch checked={showEmail} onCheckedChange={setShowEmail} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Show Phone Number</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display your phone number on your profile
                                    </p>
                                </div>
                                <Switch checked={showPhone} onCheckedChange={setShowPhone} />
                            </div>
                        </div>
                    </Card>

                    {/* Communication Preferences */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Communication</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Allow Direct Messages</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Let students and instructors message you
                                    </p>
                                </div>
                                <Switch checked={allowMessages} onCheckedChange={setAllowMessages} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive updates about classes and messages
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">
                                    Configure
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Data & Privacy */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Data & Privacy</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Share Usage Data</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Help us improve by sharing anonymous usage data
                                    </p>
                                </div>
                                <Switch checked={shareData} onCheckedChange={setShareData} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Two-Factor Authentication</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Add an extra layer of security to your account
                                    </p>
                                </div>
                                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Download Your Data</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get a copy of all your data
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleExportData}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Data
                                </Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* Connected Apps Tab */}
                <TabsContent value="apps" className="space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">Connected Applications</h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage third-party apps and integrations
                                </p>
                            </div>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Connect App
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {connectedApps.map(app => (
                                <div key={app.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-4">
                                            <div className="text-4xl">{app.icon}</div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold">{app.name}</h3>
                                                    <Badge variant={app.isActive ? 'default' : 'secondary'}>
                                                        {app.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {app.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Connected on {app.connectedAt.toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Switch
                                                checked={app.isActive}
                                                onCheckedChange={() => handleToggleApp(app.id)}
                                            />
                                        </div>
                                    </div>

                                    <Separator className="my-3" />

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Permissions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {app.permissions.map((permission, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {permission}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Manage Permissions
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <X className="h-4 w-4 mr-2" />
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
                                                        className="bg-destructive hover:bg-destructive/90"
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
                <TabsContent value="advanced" className="space-y-6">
                    {/* Account Information */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                        <div className="space-y-4">
                            <div>
                                <Label>Account ID</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        value={showAccountId ? accountId : '••••••••••••••••'}
                                        readOnly
                                        className="font-mono"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowAccountId(!showAccountId)}
                                    >
                                        {showAccountId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopyAccountId}
                                    >
                                        {copiedAccountId ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Use this ID for support inquiries
                                </p>
                            </div>

                            <div>
                                <Label>Account Created</Label>
                                <Input value="January 15, 2024" readOnly className="mt-2" />
                            </div>

                            <div>
                                <Label>Last Login</Label>
                                <Input value="January 20, 2025 at 2:30 PM" readOnly className="mt-2" />
                            </div>
                        </div>
                    </Card>

                    {/* Security */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Security</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Change Password</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Last changed 30 days ago
                                    </p>
                                </div>
                                <Button variant="outline">
                                    <Lock className="h-4 w-4 mr-2" />
                                    Update Password
                                </Button>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Active Sessions</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Manage devices and browser sessions
                                    </p>
                                </div>
                                <Button variant="outline">
                                    <Smartphone className="h-4 w-4 mr-2" />
                                    View Sessions
                                </Button>
                            </div>
                            <Separator />

                        </div>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="p-6 border-destructive">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="h-6 w-6 text-destructive mt-0.5" />
                            <div>
                                <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                                <p className="text-sm text-muted-foreground">
                                    These actions are irreversible. Please proceed with caution.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Deactivate Account</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Temporarily disable your account
                                    </p>
                                </div>
                                <Button variant="outline">Deactivate</Button>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Export All Data</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Download a complete copy of your data
                                    </p>
                                </div>
                                <Button variant="outline" onClick={handleExportData}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-destructive">Delete Account</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete your account and all data
                                    </p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Account
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your account
                                                and remove all your data from our servers including:
                                                <ul className="list-disc list-inside mt-2 space-y-1">
                                                    <li>All classes and course materials</li>
                                                    <li>Student enrollments and records</li>
                                                    <li>Payment history and billing information</li>
                                                    <li>Messages and notifications</li>
                                                    <li>Connected apps and integrations</li>
                                                </ul></AlertDialogDescription></AlertDialogHeader></AlertDialogContent></AlertDialog></div></div></Card></TabsContent></Tabs></div>)
}

export default SettingsPage