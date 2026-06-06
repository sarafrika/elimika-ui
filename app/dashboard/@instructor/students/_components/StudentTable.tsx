"use client";

import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";

import { Table, TableBody, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table";
import { useInstructorStudentsData } from "../data";
import { Pagination } from "./Pagination";
import { StudentCard } from "./StudentCard";
import { StudentRow } from "./StudentRow";

type FilterState = {
  class: string;
  status: string;
  level: string;
};

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
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<FilterState>({
    class: "all",
    status: "all",
    level: "all",
  });

  const { students, courseTabs } = useInstructorStudentsData()

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = s.student?.full_name ?? "";

      const courseNames = (s.courses ?? [])
        .map((c: any) => c?.name?.toLowerCase())
        .filter(Boolean);

      const classNames = (s.classes ?? [])
        .map((c: any) => c?.title?.toLowerCase())
        .filter(Boolean);

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        courseNames.some((c) => c.includes(search.toLowerCase()));

      const matchesTab =
        activeTab === "all" ||
        (s.courses ?? []).some((c: any) => c?.uuid === activeTab);

      const matchesClass =
        filters.class === "all" ||
        (s.classes ?? []).some((c: any) => c?.uuid === filters.class);

      const matchesStatus =
        filters.status === "all" ||
        s.student?.status === filters.status;

      const matchesLevel =
        filters.level === "all" ||
        s.student?.level === filters.level;

      return (
        matchesSearch &&
        matchesTab &&
        matchesClass &&
        matchesStatus &&
        matchesLevel
      );
    });
  }, [students, search, activeTab, filters]);

  return (
    <div className="flex-1 min-w-0 space-y-4">
      {/* Course tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-sm border text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "all"
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background text-foreground hover:bg-muted"
            }`}
        >
          All
        </Button>

        {courseTabs.slice(1).map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:bg-muted"
              }`}
          >
            {/* Avatar / Thumbnail */}
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
          options={[
            { label: "Frontend", value: "frontend" },
            { label: "Backend", value: "backend" },
          ]}
        />

        <FilterDropdown
          label="All Status"
          value={filters.status}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, status: val }))
          }
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
        />

        <FilterDropdown
          label="All Levels"
          value={filters.level}
          onChange={(val) =>
            setFilters((prev) => ({ ...prev, level: val }))
          }
          options={[
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Advanced", value: "advanced" },
          ]}
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
              {filteredStudents.map((student) => (
                <StudentRow
                  key={student.student?.uuid}
                  student={student}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y">
          {filteredStudents.map((student) => (
            <div key={student.student?.uuid} className="p-3">
              <StudentCard student={student} />
            </div>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={16}
          totalItems={125}
          rowsPerPage={20}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}