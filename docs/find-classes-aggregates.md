# Find Classes: catalogue status counts

Status: the UI now aggregates a bounded catalogue using existing endpoints. The
summary endpoint proposed below is a future replacement, not a live API call.

## Current implementation

`use-class-catalogue.ts` loads all matching classes in API pages of up to 100,
then loads their timetable sessions in batches of up to 100 class ids. The fallback
is bounded to five API pages (normally 500 classes); larger results show an error
asking the user to narrow their filters, rather than displaying partial counts.

`class-views.ts` calculates global counts and filters the complete catalogue before
paginating each view into 20 cards. Thus three open classes across different API
pages appear together, with a count of three. All summary cards use the complete
matching catalogue. Class title/trainer/seat enrichment is scoped to visible cards.
For 38 classes, loading requires one listing, one schedule batch, one summary batch
and at most one course lookup. UI page and view changes reuse the same catalogue.

Loading and failures in any listing/schedule batch prevent publishing incomplete
status counts. Search and near-me parameters are preserved for every listing page.

`GET /api/v1/classes` supports filters and a paginated total, but its documented
filters cannot express whether all non-cancelled timetable sessions have ended.
`GET /api/v1/search/classes` facets also lack that information. Registration-date
counts alone would disagree with the cards' definition of closed.

## Proposed backend change

Add `GET /api/v1/classes/summary`, accepting the same text, near-me and field
filters as the class listing. Apply identical caller visibility and active-class
constraints. Do not accept pagination or the selected view: counts cover all
matching classes before a view is selected.

Return the normal API response envelope with this data:

```json
{
  "total": 120,
  "open": 90,
  "online": 50,
  "in_person": 40,
  "closing_soon": 12,
  "closed": 30,
  "starting_this_week": 18
}
```

Compute each count using the predicates in `class-card-facts.ts` and `CLASS_VIEWS`:

- Closed: registration has ended, or at least one non-cancelled scheduled session
  exists and all such sessions have ended.
- Open: not closed, including classes without a registration deadline.
- Online and in person: open classes split by the card's location classification.
  Resolve the existing fallback for missing venue names consistently on both sides.
- Closing soon: open, with registration ending within the next three days.
- Starting this week: open, with the first upcoming session's start (or the default
  start when no upcoming session exists) within the next seven days.

Registration closing currently includes the registration end date plus one day.
Keep date boundaries, timezone and cancelled-session handling consistent between
summary, listing and cards. Count classes distinctly rather than counting joined
timetable rows. Use a fixed number of database queries.

Also add a `view` parameter (`open`, `online`, `in_person`, `soon`, `closed`) to
`GET /api/v1/classes`. Apply it before pagination using these same predicates, so
its `totalElements`, `totalPages` and returned rows agree with the selected tab.

## Frontend integration once the API is available

Regenerate the HeyAPI client and use its generated options and query keys. Add
one summary query keyed by search and filters, independent of page and view.
Render loading/error states rather than substituting current-page counts. Feed
the selected view into the listing and replace the bounded catalogue aggregation.
Keep batch enrichment scoped to visible rows.

Verify multiple pages, empty views, missing deadlines, ended/cancelled sessions,
date boundaries, location types, visibility, text/near-me search and every filter.
Page and view changes must not change the summary; filter changes must update it.
