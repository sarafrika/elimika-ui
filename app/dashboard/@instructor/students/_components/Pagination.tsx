
import { Button } from "../../../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (value: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) {
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);

  const pages = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
      {/* Left info */}
      <p className="text-xs text-muted-foreground whitespace-nowrap">
        Showing {start} to {end} of {totalItems} students
      </p>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Button>

        {/* Pages */}
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "ghost"}
            size="icon"
            onClick={() => onPageChange(page)}
            className="h-7 w-7 text-xs"
          >
            {page}
          </Button>
        ))}

        <span className="text-muted-foreground text-xs px-1">...</span>

        <Button
          variant={totalPages === currentPage ? "default" : "ghost"}
          size="icon"
          onClick={() => onPageChange(totalPages)}
          className="h-7 w-7 text-xs"
        >
          {totalPages}
        </Button>

        {/* Next */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            onPageChange(Math.min(totalPages, currentPage + 1))
          }
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Button>

        {/* Rows per page */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Rows per page
          </span>

          <Select
            value={String(rowsPerPage)}
            onValueChange={(val) =>
              onRowsPerPageChange?.(Number(val))
            }
          >
            <SelectTrigger className="h-8 w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}