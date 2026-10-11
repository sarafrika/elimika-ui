// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
import type { AssignmentStatus } from './assignment-types';

export const assignmentFilters: Array<{ label: string; value: AssignmentStatus }> = [
  { label: 'Pending', value: 'pending' },
  // { label: 'Ongoing', value: 'ongoing' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Graded', value: 'graded' },
  { label: 'All', value: 'all' },
];
