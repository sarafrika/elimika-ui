'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { parseApiDate } from '@/lib/date';
import {
  type UserNotification,
  useMarkAllNotificationsRead,
  useMarkPopupsSeen,
  useNotificationAction,
  useNotificationCounts,
  useNotifications,
} from '@/services/notifications';
import { normalizeLegacyActionUrl } from '@/src/features/dashboard/lib/legacy-action-url';
import { invalidateWorkflowQueriesForNotification } from '@/src/features/dashboard/workflow-query-invalidation';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

// The dropdown body (rows, scroll area, date formatting) loads the first time the bell opens.
const DashboardNotificationsPanel = dynamic(
  () => import('./dashboard-notifications-panel').then(mod => mod.DashboardNotificationsPanel),
  { ssr: false }
);

type DashboardNotificationsProps = {
  notificationHref: string;
  activeDomain: string | null;
};

export { notificationIcon } from './notification-icon';

const POPUP_BATCH_SIZE = 20;
const MAX_POPUP_TOASTS = 3;

// Notifications that predate mount are already reflected in freshly fetched workflow data.
function createdAt(notification: UserNotification) {
  return parseApiDate(notification.occurred_at ?? notification.created_at)?.valueOf() ?? 0;
}

export const getNotificationUrlPath = (
  notification: UserNotification,
  activeDomain: string
): string => {
  const { type, metadata } = notification;
  const action_url = normalizeLegacyActionUrl(notification.action_url, activeDomain);

  const STUDENT_PATH = `/dashboard/student`;
  const INSTRUCTOR_PATH = `/dashboard/instructor`;
  const COURSE_CREATOR_PATH = `/dashboard/course-creator`;
  const ORGANISATION_PATH = `/dashboard/organisation`;

  switch (type) {
    case 'QUIZ_DEADLINE_REMINDER':
      if (activeDomain === 'student') {
        return metadata.quiz_uuid && metadata.class_definition_uuid
          ? `${STUDENT_PATH}/assignment/quiz/${metadata.quiz_uuid}`
          : '';
      }

      return activeDomain === 'instructor' && metadata.quiz_uuid && metadata.class_definition_uuid
        ? `${INSTRUCTOR_PATH}/assignment/quiz_${metadata.quiz_uuid}?classId=${metadata.class_definition_uuid}`
        : action_url;

    case 'ASSIGNMENT_DUE_REMINDER':
    case 'ASSIGNMENT_DEADLINE_REMINDER':
    case 'ASSIGNMENT_RETURNED_FOR_REVISION':
    case 'ASSIGNMENT_SUBMITTED_CONFIRMATION':
    case 'ASSIGNMENT_GRADED':
      if (activeDomain === 'student') {
        return metadata.assignment_uuid && metadata.class_definition_uuid
          ? `${STUDENT_PATH}/assignment/${metadata.assignment_uuid}`
          : '';
      }

      return activeDomain === 'instructor' &&
        metadata.assignment_uuid &&
        metadata.class_definition_uuid
        ? `${INSTRUCTOR_PATH}/assignment/assignment_${metadata.assignment_uuid}?classId=${metadata.class_definition_uuid}`
        : action_url;

    case 'ASSESSMENT_COMPLETED':
      return `${STUDENT_PATH}/learning-hub`;

    case 'CLASS_ENROLLMENT_CONFIRMED':
      if (activeDomain === 'student') {
        return metadata.class_definition_uuid
          ? `${STUDENT_PATH}/schedule/classes/${metadata.class_definition_uuid}`
          : action_url;
      }

      return action_url || '';

    case 'INSTRUCTOR_CLASS_ENROLLMENT_MILESTONE':
    case 'INSTRUCTOR_CLASS_ENROLLMENT_NOTICE':
    case 'NEW_STUDENT_ENROLLMENT':
      if (activeDomain === 'instructor') {
        return metadata.class_definition_uuid
          ? `${INSTRUCTOR_PATH}/classes/class-training/${metadata.class_definition_uuid}`
          : `${INSTRUCTOR_PATH}/training-hub`;
      }

      return metadata.class_definition_uuid
        ? `${INSTRUCTOR_PATH}/classes/class-training/${metadata.class_definition_uuid}`
        : action_url || '';

    case 'UPCOMING_CLASS_REMINDER':
      if (activeDomain === 'student') {
        return metadata.class_definition_uuid
          ? `${STUDENT_PATH}/schedule/classes/${metadata.class_definition_uuid}`
          : action_url;
      }

      if (activeDomain === 'instructor' && metadata.class_definition_uuid) {
        return `${INSTRUCTOR_PATH}/classes/class-training/${metadata.class_definition_uuid}`;
      }

      return action_url;

    case 'COURSE_TRAINING_APPLICATION_SUBMITTED':
    case 'COURSE_TRAINING_APPLICATION_APPROVED':
    case 'COURSE_TRAINING_APPLICATION_REJECTED':
    case 'COURSE_TRAINING_APPLICATION_REVOKED':
    case 'PROGRAM_TRAINING_APPLICATION_SUBMITTED':
    case 'PROGRAM_TRAINING_APPLICATION_APPROVED':
    case 'PROGRAM_TRAINING_APPLICATION_REJECTED':
    case 'PROGRAM_TRAINING_APPLICATION_REVOKED':
      if (activeDomain === 'instructor') {
        return metadata?.application_uuid ? `${INSTRUCTOR_PATH}/courses` : '';
      } else if (activeDomain === 'organisation') {
        return metadata?.application_uuid ? `${ORGANISATION_PATH}/courses` : '';
      } else if (activeDomain === 'course_creator') {
        return metadata?.application_uuid
          ? `${COURSE_CREATOR_PATH}/manage-applicant/${metadata?.applicant_uuid}`
          : '';
      }

    case 'COURSE_CONTENT_APPROVED':
    case 'COURSE_CONTENT_REJECTED':
    case 'PROGRAM_CONTENT_APPROVED':
    case 'PROGRAM_CONTENT_REJECTED':
      if (activeDomain === 'course_creator') {
        return metadata?.course_uuid
          ? `${COURSE_CREATOR_PATH}/courses/create-course?id=${metadata?.course_uuid}`
          : '';
      }

    // Not yet implemented
    case 'COURSE_ENROLLMENT_WELCOME':
    case 'COURSE_COMPLETION_CERTIFICATE':
    case 'LEARNING_MILESTONE_ACHIEVED':
    case 'NEW_ASSIGNMENT_SUBMISSION':
    case 'CLASS_SCHEDULE_UPDATED':
    case 'GRADING_REMINDER':
    case 'COURSE_ENROLLMENT_MILESTONE':
    case 'COURSE_ENROLLMENT_NOTICE':
    case 'ACCOUNT_CREATED':
    case 'PASSWORD_RESET_REQUEST':
    case 'SECURITY_ALERT':
    case 'LEARNING_CERTIFICATE_ISSUED':
    case 'PROFILE_DOCUMENT_VERIFIED':
    case 'PROFILE_COMPLETION_REMINDER':
    case 'WEEKLY_PROGRESS_SUMMARY':
    case 'LEARNING_STREAK_ACHIEVEMENT':
    case 'PEER_ACHIEVEMENT_CELEBRATION':
      return '';

    default:
      return action_url || '';
  }
};

export function DashboardNotifications({
  notificationHref,
  activeDomain,
}: DashboardNotificationsProps) {
  const [open, setOpen] = useState(false);
  const shownPopupIds = useRef<Set<string>>(new Set());
  const invalidatedWorkflowNotificationIds = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const router = useRouter();
  const domain = activeDomain ?? undefined;
  const mountedAt = useRef(Date.now());
  const actionMutation = useNotificationAction();
  const { mutate: markPopupsSeen } = useMarkPopupsSeen();
  const markAllMutation = useMarkAllNotificationsRead(domain);

  const normalizeNotifications = (notifications: UserNotification[], activeDomain: string) => {
    return notifications.map((notification: UserNotification) => ({
      ...notification,
      urlPath: getNotificationUrlPath(notification, notification.recipient_domain ?? activeDomain),
    }));
  };

  // Counts drive the badge and gate the popup feed; the recent list only loads when the
  // dropdown opens. Every query is scoped to the active dashboard domain.
  // Waits for the profile load: /me/bootstrap seeds these counts, so the first fetch is skipped.
  const profileLoading = useUserProfile()?.isLoading === true;
  const countsQuery = useNotificationCounts(domain, {
    refetchInterval: 60_000,
    enabled: !profileLoading,
  });
  const popupCount = countsQuery.data?.popup_count ?? 0;
  const recentQuery = useNotifications(
    { page: 0, size: 6, domain },
    { enabled: open, refetchInterval: open ? 60_000 : false }
  );
  const popupQuery = useNotifications(
    {
      page: 0,
      size: POPUP_BATCH_SIZE,
      domain,
      presentation: 'POPUP',
      popupSeen: false,
    },
    { enabled: popupCount > 0, refetchInterval: 60_000 }
  );

  const unreadCount = countsQuery.data?.unread_count ?? 0;
  const recentData = recentQuery.data;
  const popupData = popupQuery.data;
  const normalizedNotifications = normalizeNotifications(
    recentData?.items ?? [],
    activeDomain as string
  );

  useEffect(() => {
    const fresh = (popupData?.items ?? []).filter(item => !shownPopupIds.current.has(item.uuid));
    if (fresh.length === 0) return;

    for (const notification of fresh) shownPopupIds.current.add(notification.uuid);
    for (const notification of fresh.slice(0, MAX_POPUP_TOASTS)) {
      const popupHref = getNotificationUrlPath(
        notification,
        notification.recipient_domain ?? activeDomain ?? ''
      );

      toast(notification.title, {
        description: notification.body,
        action: popupHref
          ? {
              label: 'Open',
              onClick: () => {
                router.push(popupHref || notificationHref);
              },
            }
          : undefined,
      });
    }

    const backlog = Math.max(popupData?.totalItems ?? 0, fresh.length);
    const hidden = backlog - Math.min(fresh.length, MAX_POPUP_TOASTS);
    if (hidden > 0) {
      toast(`+${hidden} more notification${hidden === 1 ? '' : 's'}`, {
        action: {
          label: 'View all',
          onClick: () => {
            router.push(notificationHref);
          },
        },
      });
    }

    markPopupsSeen({
      uuids: fresh.map(item => item.uuid),
      domain,
      drainAll: popupData?.hasNext ?? false,
    });
  }, [activeDomain, domain, markPopupsSeen, notificationHref, popupData, router]);

  useEffect(() => {
    const items = [...(popupData?.items ?? []), ...(recentData?.items ?? [])];
    for (const notification of items) {
      if (invalidatedWorkflowNotificationIds.current.has(notification.uuid)) {
        continue;
      }

      invalidatedWorkflowNotificationIds.current.add(notification.uuid);
      if (createdAt(notification) < mountedAt.current) continue;
      void invalidateWorkflowQueriesForNotification(queryClient, notification);
    }
  }, [popupData, queryClient, recentData]);

  const handleRead = (notification: UserNotification) => {
    if (notification.status === 'UNREAD') {
      actionMutation.mutate({ uuid: notification.uuid, action: 'read' });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='border-border/70 bg-card/80 relative h-10 w-10 rounded-md shadow-sm'
          aria-label='Notifications'
        >
          <Bell className='h-4 w-4' />
          {unreadCount > 0 ? (
            <span className='bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='flex h-[480px] w-[min(92vw,380px)] flex-col p-0'>
        {open ? (
          <DashboardNotificationsPanel
            notifications={normalizedNotifications}
            unreadCount={unreadCount}
            notificationHref={notificationHref}
            onMarkAll={() => markAllMutation.mutate()}
            onRead={handleRead}
            onNavigate={() => setOpen(false)}
          />
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
