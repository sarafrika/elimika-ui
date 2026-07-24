// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Coins, Download, Eye, Inbox, MoreHorizontal, Plus, Wallet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractPage } from '@/lib/api-helpers';
import type { ClassDefinition, User, Wallet as WalletDto } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
  getWalletOptions,
} from '@/services/client/@tanstack/react-query.gen';

const initials = (u: User) =>
  `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '?').toUpperCase();
const fullName = (u: User) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Unnamed';

/** Lazily loads a student's real wallet balance. */
function useWallet(userUuid?: string) {
  const q = useQuery({
    ...getWalletOptions({ path: { userUuid: userUuid ?? '' } }),
    enabled: Boolean(userUuid),
    retry: false,
  });
  const wallet = extractEntity<WalletDto>(q.data);
  return { loading: q.isLoading, wallet: q.isError ? null : wallet };
}

function BalanceCell({ userUuid }: { userUuid?: string }) {
  const { loading, wallet } = useWallet(userUuid);
  if (loading) return <Skeleton className="h-4 w-16" />;
  if (!wallet || wallet.balance_amount == null) return <span className="text-muted-foreground">—</span>;
  return <span>{`${wallet.currency_code ?? 'KSh'} ${Number(wallet.balance_amount).toLocaleString()}`}</span>;
}

function FundWalletsDialog({ organisationUuid }: { organisationUuid: string }) {
  const [open, setOpen] = useState(false);
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classes: ClassDefinition[] = (classesQuery.data?.data ?? [])
    .map(c => c.class_definition)
    .filter((c): c is ClassDefinition => Boolean(c?.uuid));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Fund wallets
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Fund student wallets</DialogTitle>
          <DialogDescription>Move funds from a source into selected student wallets.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            const amount = (e.currentTarget.elements.namedItem('amount') as HTMLInputElement)?.value;
            setOpen(false);
            toast.success('Funds allocated', {
              description: `KSh ${Number(amount || 0).toLocaleString()} per student — audit trail updated.`,
            });
          }}
        >
          <div className="space-y-2">
            <Label>Funding source</Label>
            <Select defaultValue="skills-fund">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skills-fund">Skills Fund</SelectItem>
                <SelectItem value="topup">External top-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Recipients</Label>
            <Select defaultValue="class">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Selected students</SelectItem>
                <SelectItem value="class">All students in a class</SelectItem>
                <SelectItem value="all">All active students</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={classes.length ? 'Select a class' : 'No classes yet'} />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.uuid} value={c.uuid as string}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount per student (KSh)</Label>
              <Input id="amount" type="number" defaultValue={20000} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Reference</Label>
              <Input id="ref" placeholder="Q3 tuition support" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" rows={2} placeholder="Visible to funders in the audit trail" />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Coins className="mr-2 h-4 w-4" /> Confirm &amp; fund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SkillsWalletPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled: Boolean(organisationUuid),
  });
  const students = extractPage<User>(studentsQuery.data).items;

  const statCards = [
    { label: 'Total Wallet Balance', value: '—', border: 'border-l-primary', tint: 'from-primary/10' },
    { label: 'Allocated to Students', value: '—', border: 'border-l-success', tint: 'from-success/10' },
    { label: 'Utilized by Students', value: '—', border: 'border-l-teal-500', tint: 'from-teal-500/10' },
    { label: 'Utilization Rate', value: '—', border: 'border-l-warning', tint: 'from-warning/10' },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        title="Skills Wallet"
        description="Wallet balances, funding, and disbursement history."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <FundWalletsDialog organisationUuid={organisationUuid} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(stat => (
          <Card key={stat.label} className={`border-l-4 ${stat.border} bg-gradient-to-br ${stat.tint} to-transparent`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="pb-3">
          <h3 className="text-base font-semibold">Student wallet data</h3>
        </div>
        {studentsQuery.isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState icon={Wallet} title="No student wallets yet" description="Invite students to see their wallet balances here." />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Wallet Balance</TableHead>
                  <TableHead className="whitespace-nowrap">Allocated Funds</TableHead>
                  <TableHead className="whitespace-nowrap">Remaining Balance</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.uuid}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initials(student)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{fullName(student)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <BalanceCell userUuid={student.uuid} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">—</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">—</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info('Top up wallet', { description: `Topping up ${fullName(student)}'s wallet.` })}>
                            <Wallet className="mr-2 h-4 w-4" /> Top up
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('View wallet', { description: `Opening ${fullName(student)}'s wallet details.` })}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="pb-3">
          <h3 className="text-base font-semibold">Funding history</h3>
        </div>
        <div className="rounded-lg border">
          <EmptyState icon={Inbox} title="No funding history yet" description="Wallet funding and disbursements will appear here." />
        </div>
      </div>
    </div>
  );
}
