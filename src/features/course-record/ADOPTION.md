# Adopting the course record view

This is the contract for replacing a legacy course-detail page with the shared record view. It is
written for someone migrating one route, and it is deliberately short: read it, then read the
reference route, then work.

## The mount

```tsx
<CourseRecordPage
  courseUuid={courseUuid}
  organisationUuid={orgUuid}   // optional — see "Access", below
  backHref="/dashboard/<domain>/<list>"
/>
```

That is the whole surface. `CourseRecordPage` owns its own data fetching, loading, error and empty
states, per-region. It does not need to be told who is looking at it.

The reference implementation is
`app/dashboard/course-creator/course-management/preview/[id]/page.tsx`. Copy its shape: resolve the
uuid from `useParams`, set breadcrumbs in an effect, guard on the domain profile, mount. Nothing else.

## Access is the API's answer, never the route's

`useCourseAccess` reads an `access` string off the course-content response. It is never re-derived
from the signed-in user's domain, the active dashboard, a `full_access` boolean, or a uuid comparison
against `course.course_creator_uuid`.

**Do not pass an access level in as a prop. Do not add one.** A route that "knows" it is the admin
route still asks the API. The server is the only party that knows whether a training application was
approved, whether an enrolment is paid, or whether an approval has since been withdrawn — and it is
the only party that then withholds the lesson bodies. A client-side guess renders an outline as if it
were the full course, or dresses an unauthorised request up as an authorised one.

The eight states are in `COURSE_ACCESS_LEVELS` (`types.ts`): `creator`, `admin`, `organisation`,
`instructor`, `applicant`, `pending`, `prospect`, `student`. Unknown, missing, in-flight or failed all
resolve to `prospect` — the least-privileged state, showing the public listing and no teaching
material. Widening happens only on an explicit instruction from the server.

`organisationUuid` is not an access override. It scopes the content call for a viewer acting on behalf
of an organisation. Omitted, the org-scoped query stays idle and access holds at `prospect`.

## What each state sees

`COURSE_ACCESS_CAPABILITIES` in `types.ts` is the authoritative map, transcribed from the design's
`profile()`. It is 819 lines and it is the spec — read the row for your state rather than guessing
from the artboards. Each row names the tabs, the KPI band, the rail cards, the primary action, the
gate banner copy and the breadcrumb root.

The blocks in `blocks/` correspond one-for-one to the design's regions: `CourseHero`, `KpiBand`,
`GlanceCard`, `AccessCard`, `LicenceCard`, `GateBanner`, `EnrolPanel`, `OpportunityPanel`,
`ApplicationStatusPanel`, `OwnerDecisionsPanel`, `ProgressStrip`, `ActionsCard`, the tab panels
(`OverviewTab`, `CurriculumTab`, `ClassesTab`, `DeliveryTab`, `CommercialsTab`, `ActivityTab`,
`ReviewsTab`) and the reader (`ReaderPane`, `ReaderRail`, `ReaderTree`).

You do not compose these yourself. `CourseRecordPage` does, from the capability map.

## Rules for an adopting route

- **Do not edit anything under `src/features/course-record/`.** If you need a change there, implement
  everything else and report the need. Several routes migrate concurrently and this directory has one
  owner.
- Keep the route's own concerns: params, guards, redirects, breadcrumbs, back link.
- Keep any genuine **action** the legacy page owned — enrol, apply, approve, reject. The record view
  is read-only by design; an action belongs to the route, passed via `primaryAction` /
  `onPrimaryAction` or rendered beside the record.
- Delete the legacy presentation once nothing imports it. If something outside your unit still
  imports it, leave it and say which.
- Commercials stay confidential: never render or fetch another party's rate card, margin or pay.
  Hiding a field in the render while still fetching it is a defect, not a fix.

## Server rendering and SEO

`CourseRecordPage` and `CourseRecordView` are both `'use client'`.

`generateMetadata` is unaffected — it lives in `page.tsx` and runs on the server whether the body is a
client component or not. Title, description, canonical and OG image survive a swap.

The **body** does not. `app/(catalogue)/courses/[courseId]/page.tsx` currently server-fetches via
`getPublicCourseDetail` and renders real HTML; mounting the client record view would hand crawlers an
empty shell and lose the server-rendered LCP.

So the public catalogue route is the one exception in this migration: **restyle its existing sections
to match the Prospectus artboard, do not swap in `CourseRecordPage`.** It keeps `async` page,
`generateMetadata` and `getPublicCourseDetail`. Every dashboard route is behind auth, is already
client-rendered, and has no such constraint.

## Verifying

```
npx tsc --noEmit 2>&1 | grep -c "error TS"     # must not exceed 245
npx tsc --noEmit 2>&1 | grep "<your file>"     # must be empty
```

A file carrying `// @ts-nocheck` is not being checked. If one of yours does, say so rather than
reporting a clean typecheck.
