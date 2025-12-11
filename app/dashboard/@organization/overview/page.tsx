import { elimikaDesignSystem, cx } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Users,
  GitBranch,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Mail,
  FileText,
  ArrowRight,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { OrganizationMetricsCards } from './_components/metrics-cards';
import { QuickActions } from './_components/quick-actions';
import { RecentActivity } from './_components/recent-activity';
import { OrganizationProfile } from './_components/organization-profile';

export default async function OrganizationOverviewPage() {
  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Compact Header Section */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Organization Overview</h1>
            <p className='text-sm text-muted-foreground'>Monitor performance and manage your organization</p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button asChild size='sm' variant='outline'>
              <Link href='/dashboard/people'>
                <Users className='mr-2 h-4 w-4' />
                Manage People
              </Link>
            </Button>
            <Button asChild size='sm' variant='outline'>
              <Link href='/dashboard/branches'>
                <GitBranch className='mr-2 h-4 w-4' />
                View Branches
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Key Metrics Section - Most Important Information (3-5 Second Rule) */}
      <section className={elimikaDesignSystem.spacing.content}>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold text-foreground'>
              Key Metrics
            </h2>
            <p className='text-sm text-muted-foreground'>
              Real-time overview of your organization's performance
            </p>
          </div>
          <Button asChild variant='ghost' size='sm'>
            <Link href='/dashboard/audit' className='gap-2'>
              <Activity className='h-4 w-4' />
              View Full Analytics
              <ArrowRight className='h-4 w-4' />
            </Link>
          </Button>
        </div>

        <OrganizationMetricsCards />
      </section>

      {/* Two Column Layout: Main Content + Sidebar */}
      <div className='grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        {/* Main Content Column */}
        <div className={elimikaDesignSystem.spacing.content}>
          {/* Quick Actions */}
          <section>
            <h2 className='mb-4 text-xl font-semibold text-foreground'>
              Quick Actions
            </h2>
            <QuickActions />
          </section>

          {/* Organization Profile */}
          <section>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-semibold text-foreground'>
                Organization Profile
              </h2>
              <Button asChild variant='outline' size='sm'>
                <Link href='/dashboard/account/training-center'>
                  Edit Profile
                </Link>
              </Button>
            </div>
            <OrganizationProfile />
          </section>

          {/* Learning Progress Overview */}
          <section className={elimikaDesignSystem.components.card.base}>
            <div className='mb-5 flex items-center justify-between'>
              <div>
                <h3 className={elimikaDesignSystem.components.card.title}>
                  <BookOpen className='mr-2 inline h-5 w-5' />
                  Learning Progress
                </h3>
                <p className={elimikaDesignSystem.components.card.description}>
                  Track course completion and learner engagement
                </p>
              </div>
              <Button asChild variant='ghost' size='sm'>
                <Link href='/dashboard/course-management' className='gap-2'>
                  View All Courses
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
              <div className='rounded-[20px] border border-border bg-muted/50 p-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Active Courses
                </p>
                <p className='mt-2 text-3xl font-bold text-primary'>
                  --
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Available for enrollment
                </p>
              </div>

              <div className='rounded-[20px] border border-border bg-muted/50 p-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Completion Rate
                </p>
                <p className='mt-2 text-3xl font-bold text-primary'>
                  --%
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Average across all courses
                </p>
              </div>

              <div className='rounded-[20px] border border-border bg-muted/50 p-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Enrollments
                </p>
                <p className='mt-2 text-3xl font-bold text-primary'>
                  --
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Total active students
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <aside className={elimikaDesignSystem.spacing.content}>
          {/* Recent Activity */}
          <section>
            <h2 className='mb-4 text-xl font-semibold text-foreground'>
              Recent Activity
            </h2>
            <RecentActivity />
          </section>

          {/* Notifications & Alerts */}
          <section className={elimikaDesignSystem.components.card.base}>
            <h3 className={elimikaDesignSystem.components.card.title}>
              <Mail className='mr-2 inline h-5 w-5' />
              Notifications
            </h3>
            <Separator className='my-4' />

            <div className='space-y-3'>
              <div className='rounded-xl border border-border bg-muted/50 p-3'>
                <div className='flex items-start gap-3'>
                  <ShieldCheck className='mt-0.5 h-5 w-5 text-primary' />
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-foreground'>
                      Organization Verified
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Your organization has been verified by the admin team.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Resources & Help */}
          <section className={elimikaDesignSystem.components.card.base}>
            <h3 className={elimikaDesignSystem.components.card.title}>
              <FileText className='mr-2 inline h-5 w-5' />
              Resources & Help
            </h3>
            <Separator className='my-4' />

            <div className='space-y-2'>
              <Button asChild variant='ghost' className='w-full justify-start' size='sm'>
                <Link href='/dashboard/catalogue'>
                  <BookOpen className='mr-2 h-4 w-4' />
                  Browse Course Catalogue
                </Link>
              </Button>
              <Button asChild variant='ghost' className='w-full justify-start' size='sm'>
                <Link href='/dashboard/verification'>
                  <ShieldCheck className='mr-2 h-4 w-4' />
                  Verification Status
                </Link>
              </Button>
              <Button asChild variant='ghost' className='w-full justify-start' size='sm'>
                <Link href='/dashboard/audit'>
                  <TrendingUp className='mr-2 h-4 w-4' />
                  Analytics & Reports
                </Link>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
