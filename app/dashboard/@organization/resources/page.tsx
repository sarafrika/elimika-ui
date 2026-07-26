// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Package, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/page-header';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage } from '@/lib/api-helpers';
import type { OrganisationResource } from '@/services/client';
import {
  createResourceMutation,
  listResourcesOptions,
  listResourcesQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

function AddEquipmentDialog({ organisationUuid }: { organisationUuid: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const create = useMutation(createResourceMutation());
  const listKey = listResourcesQueryKey({
    path: { organisationUuid },
    query: { resource_type: 'EQUIPMENT_POOL', pageable: { page: 0, size: 200 } },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add equipment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add equipment</DialogTitle>
          <DialogDescription>Register a piece of equipment owned by your organisation.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            const f = e.currentTarget;
            const name = (f.elements.namedItem('e-name') as HTMLInputElement)?.value.trim();
            const description = (f.elements.namedItem('e-desc') as HTMLInputElement)?.value.trim();
            const quantity = (f.elements.namedItem('e-qty') as HTMLInputElement)?.value;
            const location = (f.elements.namedItem('e-loc') as HTMLInputElement)?.value.trim();
            if (!name) return toast.error('Equipment name is required.');
            create.mutate(
              {
                path: { organisationUuid },
                body: {
                  organisation_uuid: organisationUuid,
                  resource_type: 'EQUIPMENT_POOL',
                  name,
                  description: description || undefined,
                  total_quantity: quantity ? Number(quantity) : 1,
                  location_name: location || undefined,
                  is_active: true,
                },
              },
              {
                onSuccess: async () => {
                  setOpen(false);
                  toast.success('Equipment added', { description: name });
                  await qc.invalidateQueries({ queryKey: listKey });
                },
                onError: () => toast.error('Could not add equipment.'),
              }
            );
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="e-name">Name</Label>
            <Input id="e-name" name="e-name" placeholder="e.g. 3D Printer" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-desc">Description</Label>
            <Input id="e-desc" name="e-desc" placeholder="Optional details" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="e-qty">Quantity</Label>
              <Input id="e-qty" name="e-qty" type="number" min={1} defaultValue={1} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-loc">Location / classroom</Label>
              <Input id="e-loc" name="e-loc" placeholder="e.g. Lab B" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Adding…' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function OrganisationResourcesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const resourcesQuery = useQuery({
    ...listResourcesOptions({
      path: { organisationUuid },
      query: { resource_type: 'EQUIPMENT_POOL', pageable: { page: 0, size: 200 } },
    }),
    enabled: Boolean(organisationUuid),
  });
  const equipment = extractPage<OrganisationResource>(resourcesQuery.data).items;

  const [query, setQuery] = useState('');

  const rows = useMemo(
    () =>
      equipment.filter(r => {
        if (!query) return true;
        return `${r.name ?? ''} ${r.location_name ?? ''} ${r.description ?? ''}`.toLowerCase().includes(query.toLowerCase());
      }),
    [equipment, query]
  );

  const kpis = useMemo(() => {
    const totalUnits = equipment.reduce((a, r) => a + Number(r.total_quantity ?? 0), 0);
    const active = equipment.filter(r => r.is_active !== false).length;
    const inactive = equipment.filter(r => r.is_active === false).length;
    return { total: equipment.length, totalUnits, active, inactive };
  }, [equipment]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        title="Equipment"
        description="All equipment owned by the organisation. Add new items, update them, or retire assets."
        action={<AddEquipmentDialog organisationUuid={organisationUuid} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{kpis.total}</div>
            <div className="text-xs text-muted-foreground">Equipment items</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{kpis.totalUnits}</div>
            <div className="text-xs text-muted-foreground">Total units</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-400">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{kpis.active}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{kpis.inactive}</div>
            <div className="text-xs text-muted-foreground">Inactive</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search name, location" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {resourcesQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
              <Package className="h-8 w-8 text-muted-foreground" />
              <div className="font-medium">{equipment.length === 0 ? 'No equipment yet' : 'No equipment match'}</div>
              <p className="text-sm text-muted-foreground">
                {equipment.length === 0 ? 'Add equipment your organisation owns.' : 'Try a different search.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Equipment</TableHead>
                    <TableHead className="whitespace-nowrap text-center">Qty</TableHead>
                    <TableHead className="whitespace-nowrap">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.uuid}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Wrench className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium">{r.name}</div>
                            {r.description && <div className="max-w-xs truncate text-xs text-muted-foreground">{r.description}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">{Number(r.total_quantity ?? 0)}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{r.location_name ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={r.is_active !== false ? 'default' : 'secondary'}>
                          {r.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info('Manage equipment', { description: r.name })}>
                              <Wrench className="mr-2 h-4 w-4" /> Manage
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => toast.error('Retire equipment', { description: `${r.name} marked for retirement.` })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Retire
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
        </CardContent>
      </Card>
    </div>
  );
}
