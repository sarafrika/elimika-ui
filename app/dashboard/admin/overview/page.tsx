import { PageHeader } from '@/components/page-header';
import { SectionCard, surfaceTheme } from '@/components/data-display';

/**
 * Placeholder while the admin console is rebuilt. Each section returns here as its
 * phase lands, so the role always has a page to sign in to.
 */
export default function AdminOverviewPage() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Admin console'
          title='Being rebuilt'
          description='The admin console is being rebuilt section by section. Nothing here is live yet.'
        />
        <SectionCard
          title='What happens next'
          description='Sections arrive in order: home and the review inbox first, then people and organisations.'
        >
          <p className='text-muted-foreground text-sm'>
            Other dashboards are unaffected. Platform data is unchanged — only this console's
            screens were removed.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
