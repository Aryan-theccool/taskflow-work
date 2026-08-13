# Product Requirements Document — TaskFlow

## What it does
A lightweight task board (Trello-style) for a single team: a Board holds Columns, each Column
holds Tasks. Users create, edit, move, and delete tasks, and filter by priority.

## Who it's for
A small team that wants a simple shared view of work-in-progress, without the overhead of a
full project management tool.

## Problem it solves
Tracking small team tasks in a doc or chat thread loses structure fast. A board gives an
at-a-glance view of what's todo/in-progress/done, with just enough structure (priority,
description) to be useful without becoming its own chore to maintain.

## Core features

| Feature | Priority |
|---|---|
| View board with columns and tasks | Must-have |
| Create task (title required, description/priority optional) | Must-have |
| Edit task (title, description, priority) | Must-have |
| Delete task | Must-have |
| Move task between columns (dropdown/buttons, or drag-and-drop) | Must-have |
| Persist all changes to a real DB | Must-have |
| Filter tasks by priority | Must-have |
| Backend + frontend validation on empty title | Must-have |
| Graceful error handling on failed requests | Must-have |
| Text search by task title | Nice-to-have |
| Drag-and-drop (if dropdown built for core) | Nice-to-have |
| Task count per column header | Nice-to-have |

## User flow
1. User opens the board, sees columns (To Do / In Progress / Done) with existing tasks.
2. Clicks "New Task" → fills title (required), description/priority (optional) → task appears
   in the target column, persisted immediately.
3. Clicks a task → edits title/description/priority → saves.
4. Moves a task to another column via dropdown (or drag-and-drop) → status persists on reload.
5. Filters the board to a single priority level to focus on what matters right now.
6. Deletes a task that's no longer needed.

## MVP
Everything in the "Must-have" row — a working board with full CRUD, persisted to a real
relational database, with basic validation and error handling. One stretch goal at most, only
if the core is solid.

## Success measures (for this exercise)
- Clone → follow README → working app, data persists across reloads.
- Schema has real keys/constraints; two non-trivial queries actually query the DB.
- Empty-title tasks are rejected server-side, not just in the form.
- A failed backend request shows a real message, not a blank screen.

## Explicitly not in v1
User accounts/login, multiple users or teams, real-time sync across browser tabs, file
uploads, visual design polish beyond "looks tidy" — all explicitly out of scope per the brief.
