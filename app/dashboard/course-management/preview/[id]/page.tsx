'use client';

import { CataloguePreviewSummary } from '@/app/dashboard/_components/catalogue-preview-summary';

export default function CourseManagementPreviewPage() {
  // Default preview for all domains except those with custom slots.
  return <CataloguePreviewSummary />;
}
