import React from 'react'
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface OrganizationFiltersProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    statusFilter: string
    setStatusFilter: (status: string) => void
    sortOrder: 'asc' | 'desc'
    setSortOrder: (order: 'asc' | 'desc') => void
}

export default function OrganizationFilters({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
}: OrganizationFiltersProps) {
    return (
        <div className="p-4 border-b space-y-3">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Filters Row */}
            <div className="flex gap-2">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort Order */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                >
                    {sortOrder === 'asc' ? (
                        <SortAsc className="h-4 w-4" />
                    ) : (
                        <SortDesc className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    )
} 