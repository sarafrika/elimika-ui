import {
  BadgeDollarSign,
  BookOpen,
  Building2,
  Headset,
  LayoutDashboard,
  MessageCircle,
  Users,
  UserCog,
  UserRound,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type AdminRouteId =
  | 'overview'
  | 'course-creators'
  | 'instructors'
  | 'organizations'
  | 'users'
  | 'administrators'
  | 'transactions'
  | 'notifications'
  | 'support';

export type AdminBreadcrumb = {
  title: string;
  href?: string;
};

type AdminNavigationBase = {
  title: string;
  description?: string;
};

export type AdminNavigationRoute = AdminNavigationBase & {
  type: 'item';
  id: AdminRouteId;
  href: string;
  icon: LucideIcon;
  breadcrumbs?: AdminBreadcrumb[];
};

export type AdminNavigationGroup = AdminNavigationBase & {
  type: 'group';
  id: string;
  icon?: LucideIcon;
  children: AdminNavigationNode[];
};

export type AdminNavigationDivider = {
  type: 'divider';
  id: string;
  label?: string;
};

export type AdminNavigationNode =
  | AdminNavigationRoute
  | AdminNavigationGroup
  | AdminNavigationDivider;

const dashboardBreadcrumb: AdminBreadcrumb = {
  title: 'Dashboard',
  href: '/dashboard/overview',
};

const withBreadcrumbs = (
  route: Omit<AdminNavigationRoute, 'breadcrumbs'> & { breadcrumbs?: AdminBreadcrumb[] }
): AdminNavigationRoute => ({
  ...route,
  breadcrumbs:
    route.breadcrumbs ?? [dashboardBreadcrumb, { title: route.title, href: route.href }],
});

export const adminNavigation: AdminNavigationNode[] = [
  withBreadcrumbs({
    type: 'item',
    id: 'overview',
    title: 'Overview',
    description: 'Monitor platform metrics, status updates, and trends.',
    href: '/dashboard/overview',
    icon: LayoutDashboard,
  }),
  {
    type: 'group',
    id: 'people',
    title: 'People & Accounts',
    description: 'Manage every profile type connected to the platform.',
    icon: Users,
    children: [
      withBreadcrumbs({
        type: 'item',
        id: 'course-creators',
        title: 'Course Creators',
        description: 'Review onboarding requests and maintain creator quality.',
        href: '/dashboard/course-creators',
        icon: BookOpen,
      }),
      withBreadcrumbs({
        type: 'item',
        id: 'instructors',
        title: 'Instructors',
        description: 'Oversee instructor activity and verification workflows.',
        href: '/dashboard/instructors',
        icon: UserRound,
      }),
      withBreadcrumbs({
        type: 'item',
        id: 'users',
        title: 'Users',
        description: 'Search, filter, and administer every registered learner.',
        href: '/dashboard/users',
        icon: Users,
      }),
      withBreadcrumbs({
        type: 'item',
        id: 'administrators',
        title: 'Administrators',
        description: 'Audit and configure administrator access levels.',
        href: '/dashboard/administrators',
        icon: UserCog,
      }),
    ],
  },
  {
    type: 'group',
    id: 'organizations-stack',
    title: 'Organizations',
    description: 'Partner accounts and enterprise cohorts.',
    icon: Building2,
    children: [
      withBreadcrumbs({
        type: 'item',
        id: 'organizations',
        title: 'Organizations',
        description: 'Track onboarding progress and account health.',
        href: '/dashboard/organizations',
        icon: Building2,
      }),
    ],
  },
  {
    type: 'group',
    id: 'operations',
    title: 'Operational Tools',
    description: 'Keep payments and communications running smoothly.',
    icon: BadgeDollarSign,
    children: [
      withBreadcrumbs({
        type: 'item',
        id: 'transactions',
        title: 'Transactions',
        description: 'Inspect payouts, refunds, and financial performance.',
        href: '/dashboard/transactions',
        icon: BadgeDollarSign,
      }),
      withBreadcrumbs({
        type: 'item',
        id: 'notifications',
        title: 'Notifications',
        description: 'Review system announcements and delivery logs.',
        href: '/dashboard/notifications',
        icon: MessageCircle,
      }),
      withBreadcrumbs({
        type: 'item',
        id: 'support',
        title: 'Support',
        description: 'Coordinate support requests and knowledge base content.',
        href: '/dashboard/support',
        icon: Headset,
      }),
    ],
  },
];

export const flattenAdminNavigation = (
  navigation: AdminNavigationNode[]
): AdminNavigationRoute[] => {
  const result: AdminNavigationRoute[] = [];

  const traverse = (nodes: AdminNavigationNode[]) => {
    nodes.forEach(node => {
      if (node.type === 'item') {
        result.push(node);
      }
      if (node.type === 'group') {
        traverse(node.children);
      }
    });
  };

  traverse(navigation);
  return result;
};

export const adminRouteMap = flattenAdminNavigation(adminNavigation).reduce(
  (acc, route) => {
    acc[route.id] = route;
    return acc;
  },
  {} as Record<AdminRouteId, AdminNavigationRoute>
);

export const matchAdminRouteByPath = (
  pathname: string,
  navigation: AdminNavigationNode[]
): AdminNavigationRoute | null => {
  const normalizedPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  const routes = flattenAdminNavigation(navigation);
  const match = routes.find(route =>
    normalizedPath === route.href || normalizedPath.startsWith(`${route.href}/`)
  );
  return match ?? null;
};
