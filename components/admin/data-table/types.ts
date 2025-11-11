import { ReactNode } from 'react';

export type AdminDataTableColumn<TData> = {
  id: string;
  header: ReactNode;
  cell: (item: TData) => ReactNode;
  className?: string;
  width?: string | number;
};

export type AdminDataTableFilterOption = {
  label: string;
  value: string;
  description?: string;
};

export type AdminDataTableFilter = {
  id: string;
  label: string;
  options: AdminDataTableFilterOption[];
  value: string;
  onValueChange: (value: string) => void;
};

export type AdminDataTableSearch = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
};

export type AdminDataTableEmptyState = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export type AdminDataTablePagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};
