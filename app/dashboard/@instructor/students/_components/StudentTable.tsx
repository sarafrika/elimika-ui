"use client";

import { Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";

import { Skeleton } from "../../../../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../../components/ui/table";
import { useInstructorStudentsData } from "../data";
import type { StudentFilterState } from "../types";
import { Pagination } from "./Pagination";
import { StudentCard } from "./StudentCard";
import { StudentRow } from "./StudentRow";

const FilterDropdown = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px] text-sm">
        <SelectValue placeholder={label} />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all">{label}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export function StudentTable() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<StudentFilterState>({
    class: "all",
    status: "all",
    level: "all",
  });

  const { students, courseTabs, filterOptions, loading } = useInstructorStudentsData();

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        query.length === 0 || student.searchIndex.includes(query);
      const matchesTab =
        activeTab === "all" ||
        student.courses.some((course) => course.uuid === activeTab);
      const matchesClass =
        filters.class === "all" ||
        student.classes.some((item) => item.uuid === filters.class);
      const matchesStatus =
        filters.status === "all" || student.status === filters.status;
      const matchesLevel =
        filters.level === "all" || student.levels.includes(filters.level);

      return (
        matchesSearch &&
        matchesTab &&
        matchesClass &&
        matchesStatus &&
        matchesLevel
      );
    });
  }, [students, search, activeTab, filters]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filters, rowsPerPage, search]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + rowsPerPage
  );


  if (loading) {
    return (
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 max-w-xs" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="rounded-md border p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 space-y-4">
      {/* Course tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-sm border text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "all"
            ? "border-primary bg-primary text-white"
            : "border-border bg-background text-foreground hover:bg-muted"
            }`}
        >
          All
        </Button>

        {courseTabs
          .filter((tab) => tab.id !== "all")
          .map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-sm font-medium transition-colors whitespace-nowrap
    ${activeTab === tab.id
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-background text-foreground hover:bg-muted"
                }`}
            >
              {tab.thumbnail_url ? (
                <img
                  src={tab.thumbnail_url}
                  alt={tab.label}
                  className="w-5 h-5 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                  {(tab.label ?? "NA").slice(0, 2)}
                </div>
              )}

              {tab.label}
            </Button>
          ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search size={16} />
          </div>

          <Input
            type="search"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 text-sm"
          />
        </div>

        {/* Dropdowns */}
        <FilterDropdown
          label="All Classes"
          value={filters.class}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, class: val }))
          }
          options={filterOptions.classes}
        />

        <FilterDropdown
          label="All Status"
          value={filters.status}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, status: val }))
          }
          options={filterOptions.statuses}
        />

        <FilterDropdown
          label="All Levels"
          value={filters.level}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, level: val }))
          }
          options={filterOptions.levels}
        />


        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <Table className="min-w-[500px]">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Student</TableHead>

                <TableHead className="text-xs hidden sm:table-cell">
                  Course / Class
                </TableHead>

                <TableHead className="text-xs">Status</TableHead>

                <TableHead className="text-xs hidden md:table-cell">
                  Progress
                </TableHead>

                <TableHead className="text-xs hidden lg:table-cell">
                  Skills Wallet
                </TableHead>

                <TableHead className="text-xs hidden xl:table-cell">
                  Joined
                </TableHead>

                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedStudents.map((student) => (
                <StudentRow
                  key={student.student.uuid}
                  student={student}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y">
          {paginatedStudents.map((student) => (
            <div key={student.student.uuid} className="p-3">
              <StudentCard student={student} />
            </div>
          ))}

          {!loading && paginatedStudents.length === 0 && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No students found.
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>
    </div>
  );
}
