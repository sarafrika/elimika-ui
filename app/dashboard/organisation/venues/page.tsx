// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Plus, Users, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import type { TrainingBranch } from '@/services/client';
import { getTrainingBranchesByOrganisationOptions } from '@/services/client/@tanstack/react-query.gen';

const prettify = (value?: string | null) =>
  value
    ? value.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

export default function VenuesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const page = extractPage<TrainingBranch>(branchesQuery.data);
  const venues = page.items.map(branch => ({
    id: branch.uuid,
    name: branch.branch_name,
    floor: branch.address || '—',
    capacity: branch.capacity,
    type: branch.venue_type || 'Unassigned',
    status: branch.active ? 'Available' : 'Booked',
    category: branch.venue_type || 'Unassigned',
  }));

  const total = getTotalFromMetadata(page.metadata) || venues.length;
  const available = venues.filter(v => v.status === 'Available').length;

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const visibleVenues = useMemo(
    () => filterByCategoryTabs(venues, activeCategory, subjectByCategory),
    [venues, activeCategory, subjectByCategory]
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        title="Venues & Resources"
        description="Classrooms, fields, studios, booking calendar, and resource allocation."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Venue
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total Venues</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{available}</div>
            <div className="text-xs text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">—</div>
            <div className="text-xs text-muted-foreground">Booked Today</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary/60">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">—</div>
            <div className="text-xs text-muted-foreground">Usage Rate</div>
          </CardContent>
        </Card>
      </div>

      <CategoryTabs
        items={venues.map(v => ({ category: v.type }))}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        subjectByCategory={subjectByCategory}
        onSubjectChange={setSubjectByCategory}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleVenues.map(venue => (
          <Card key={venue.id} className="overflow-hidden py-0">
            <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-teal-600 via-teal-600 to-primary">
              <MapPin className="h-10 w-10 text-white/90" />
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{venue.name}</h3>
                  <p className="text-xs text-muted-foreground">{venue.floor}</p>
                </div>
                <Badge variant={venue.status === 'Available' ? 'default' : 'secondary'}>
                  {venue.status}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {venue.capacity != null ? venue.capacity : '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5" />—
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {prettify(venue.type)}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Manage
                </Button>
                <Button size="sm" className="flex-1" disabled={venue.status !== 'Available'}>
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  Book
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
