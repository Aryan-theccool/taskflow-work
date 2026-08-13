# Security and Access Document — TaskFlow

Kept deliberately short: the assignment explicitly puts user accounts/login and multi-user
out of scope, so most of what a "security doc" usually covers doesn't apply here yet. This
records that as a conscious decision, not a gap.

## Authentication
None in this version — by design. There's a single implicit user/team and no login screen.
**If TaskFlow grew into a real product**, the natural next step would be email/password or
OAuth via a managed provider (Auth0/Clerk/Supabase Auth), with session cookies or short-lived
JWTs — not something to hand-roll.

## Roles
Only one implicit role today: **anyone with the app URL can view and edit the board.** No
admin/member distinction exists.

If multi-user were added later:
| Role | Can | Cannot |
|---|---|---|
| Member | Create/edit/move/delete tasks on boards they belong to | See or modify other teams' boards |
| Admin (future) | Manage board membership, delete boards | Bypass a member's own team boundary |

## Row-level security
Not applicable — there's one board scope, nothing to isolate between users. **If extended to
multi-team**: `boards`, `columns`, and `tasks` would need a `team_id` (or `owner_id`) and every
query scoped to `team_id = current_team()`, ideally enforced at the DB level so an API bug
can't leak another team's board.

## Error handling guide

| Failure point | What happens | User sees |
|---|---|---|
| Create task with empty title | Rejected server-side (4xx), independent of frontend check | "Title is required" |
| Task/column/board not found (bad id) | 404 | "Task not found" |
| Backend unreachable / request fails | Frontend catches the failure, doesn't crash | Visible error message, not a blank screen |
| Move task to invalid column id | Rejected server-side | "Invalid column" |
| Delete a task that's already deleted | 404, not a silent no-op that looks successful | "Task not found" |

## Edge cases to handle before launch
- Empty board (no tasks yet) — should look intentionally empty, not broken
- Filtering to a priority with zero matching tasks — same as above
- Very long task titles/descriptions breaking card layout
- Double-submitting the create-task form (accidental duplicate)
- Moving a task to the column it's already in (should be a harmless no-op)
