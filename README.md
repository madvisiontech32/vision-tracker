# Vision Tracker

A client portal + admin panel built with **Next.js 16 (App Router)**, **React 19**,
**Tailwind CSS v4**, **MongoDB / Mongoose**.

- **Admin** creates projects, sets milestones, adds developers to each milestone,
  and assigns tasks to those developers. Each project gets a client access
  password, set from the admin panel.
- **Client** opens the public home page, picks their project and types the
  password. Everything then lives on one screen: hover a milestone to reveal its
  team, hover a developer to reveal their tasks. No further page loads.
- **Developer** signs in at `/developer` with the email and password the admin
  set, sees the tasks assigned to them across all projects (open ones by
  default), and moves each between to do / in progress / review / done.
- **Theme**: light / dark toggle in the header, remembered per browser, with the
  first-visit default taken from the OS preference.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit the values
npm run seed:admin           # creates the admin account in MongoDB
npm run seed:nova            # optional: the NOVA Terminal sample programme
npm run dev                  # http://localhost:3000
```

Without `seed:nova` the app starts empty - the public home page stays blank
until an admin creates a project.

### Environment variables (`.env.local`)

| Variable | What it does |
| --- | --- |
| `MONGODB_URI` | Mongo connection string. Local or Atlas. |
| `SESSION_SECRET` | Signs the admin + client-access JWT cookies. Use a long random string in production. |
| `SEED_ADMIN_EMAIL` | Only read by `npm run seed:admin`. Defaults to `admin@project.com`. |
| `SEED_ADMIN_PASSWORD` | Only read by `npm run seed:admin`. |
| `SEED_ADMIN_NAME` | Only read by `npm run seed:admin`. |
| `SEED_CLIENT_PASSWORD` / `SEED_DEV_PASSWORD` / `SEED_START` / `SEED_RESET` | Only read by `npm run seed:nova`. |

### Admin account

Admins live in the `admins` collection with a bcrypt `passwordHash`
(`select: false`, so it never leaves the server). `npm run seed:admin` is
idempotent - re-running it updates the existing account rather than creating a
duplicate, which is also how you rotate the password.

### Developer accounts

Developers are created from `/admin/developers`, and the login email and
password are **required at creation**, so a new developer can sign in
immediately. Editing a developer with a blank password field keeps the current
one. Emails are unique among developers that have one; developers created before
this rule show a "no password" badge until an admin edits them.

## The NOVA sample programme

`scripts/seed-nova.mjs` imports a complete programme built from the NOVA
Terminal technical delivery timeline: a 15-month project plus a staged go-live,
**14 milestones**, ten developers mapped to the seven workstreams, and **372
tasks** with per-month due dates and priorities.

```bash
npm run seed:nova
```

Delivered work is declared once, in the `PROGRESS` table near the top of the
script - the task lists carry no status of their own. Out of the box month 1
(P0) is closed out and month 2 is under way, so the board opens at **8%** rather
than empty. Within a milestone the earliest-due tasks are taken first, so
progress always follows the calendar. Change the two numbers in `PROGRESS` to
move the reported percentage.

Milestones follow the programme calendar, each one a deliverable block of
between 18 and 36 tasks:

| Milestone | Tasks |
| --- | --- |
| M1 - P0: Architecture, Security Model & Cloud Scaffold | 27 |
| M2 - P1: Multi-Tenancy Foundation | 21 |
| M3 - P1: Broker Abstraction & IBKR Re-platform | 22 |
| M4 - P1: Schwab, Alpaca & the Session Pool | 20 |
| M4-5 - P2: Onboarding, Billing & Entitlements | 36 |
| M5-6 - P2: Broker Breadth, Statements & the P2 Gate | 33 |
| M6-7 - P3: Shared Market-Data Platform | 18 |
| M7 - P3: Scale Infrastructure & Observability | 18 |
| M7 - P3: Intelligence, Co-pilot & Risk Guardrails | 22 |
| M7-8 - P3: Mobile, Admin Console & Hardening | 36 |
| M9-10 - P4: Closed Beta & Rapid Iteration | 30 |
| M11-12 - P4: Reliability, Support & Exit Review | 28 |
| M13-14 - P5: Load, Chaos, Pen-Test & DR | 31 |
| M15 - P5: Compliance, Sign-off & Staged Go-Live | 30 |

| | |
| --- | --- |
| Client password (public site) | `nova2026`, or `SEED_CLIENT_PASSWORD` |
| Developer logins | `<firstname>@novaterminal.com` |
| Developer password (all ten) | `nova12345` |

The ten developers are Axit, Manoj, Priyank, Vivek, Ankit, Nirmal, NavNeet,
Kinjal, Kruti and Neha. Each milestone's team is derived from whoever owns work
inside it, so the client-side explorer always shows a real team.

The script is safe to re-run: it removes **only its own** project, milestones,
tasks and developers before reseeding, so anything you created by hand survives.
Set `SEED_RESET=1` to wipe projects, milestones, developers and tasks first
(admin accounts are never touched). Override the defaults with
`SEED_CLIENT_PASSWORD`, `SEED_DEV_PASSWORD` and `SEED_START` (`YYYY-MM-DD`, the
first day of month 1 - every other date is derived from it, so the whole
timeline shifts together).

## Routes

### Public (client)

| Route | What it shows |
| --- | --- |
| `/` | All visible projects with progress. |
| `/projects/[id]` | Password gate, then the three-column explorer. |

The explorer is one page with three linked columns - milestones, team, tasks.
Pointer-enter (and focus, and click for touch screens) moves the selection, so
reading a project takes no clicks at all.

**The password is asked on every visit.** Unlocking sets no cookie and stores
nothing in the browser: `POST /api/projects/:id/unlock` verifies the password and
returns the whole project tree, which lives only in the page's React state. Going
back to the home page and reopening the project asks again. Nothing behind the
password is server-rendered into the HTML either, so the gate cannot be bypassed
by reading the page source.

### Admin

| Route | What you can do |
| --- | --- |
| `/admin/login` | Sign in with the admin email + password from the `admins` collection. |
| `/admin` | Dashboard with counts and recent projects. |
| `/admin/projects` | Create / edit / delete projects, set the client password, hide a project. |
| `/admin/projects/[id]` | Manage milestones for one project. |
| `/admin/projects/[id]/milestones/[mid]` | Assign developers, add / edit / delete their tasks. |
| `/admin/developers` | Team pool: add, edit, delete developers, set their login. |

### Developer

| Route | What you can do |
| --- | --- |
| `/developer/login` | Sign in with the email + password the admin set. |
| `/developer` | Your tasks, grouped by project and milestone, with a status control on each one. |

The four count cards double as filters. **To do and In progress are on by
default** - open work is what a developer needs on screen, so Review and Done
are opt-in. The counts stay visible on every card whether or not it is selected,
and a Reset button appears once the selection differs from the default.

A developer may change the **status** of their **own** tasks and nothing else -
`PATCH /api/developer/tasks/:id` matches on `{ _id, developer: session.uid }`,
ignores every other field in the body, and answers `404` for a task owned by
somebody else. Title, priority, due date and assignment stay admin-only.

`src/proxy.ts` (Next 16's middleware convention) guards every `/admin` and
`/developer` route, each against its own session cookie.

## API

All write endpoints require the admin cookie; `/api/projects` (GET) and
`/api/projects/[id]/unlock` are the only public ones.

```
POST   /api/admin/login                        { email, password }
POST   /api/admin/logout
POST   /api/developer/login                    { email, password }
POST   /api/developer/logout
PATCH  /api/developer/tasks/:id                { status } - own tasks only
GET    /api/projects                           public list
POST   /api/projects                           create (admin)
GET    /api/projects/:id                       (admin)
PATCH  /api/projects/:id                       (admin, optional password rotate)
DELETE /api/projects/:id                       (admin, cascades milestones + tasks)
POST   /api/projects/:id/unlock                { password } -> full project tree
GET    /api/projects/:id/milestones            (admin)
POST   /api/projects/:id/milestones            (admin)
PATCH  /api/milestones/:id                     (admin)
DELETE /api/milestones/:id                     (admin, cascades tasks)
POST   /api/milestones/:id/developers          { developerId }
DELETE /api/milestones/:id/developers?developerId=
GET    /api/milestones/:id/tasks               (admin, optional ?developerId=)
POST   /api/milestones/:id/tasks               (admin)
PATCH  /api/tasks/:id                          (admin)
DELETE /api/tasks/:id                          (admin)
GET    /api/developers                         (admin)
POST   /api/developers                         (admin)
PATCH  /api/developers/:id                     (admin)
DELETE /api/developers/:id                     (admin, cascades tasks + assignments)
```

## Data model

```
Admin      name, email (unique), passwordHash (bcrypt, select:false),
           active, lastLoginAt
Project    name, client, description, status, startDate, endDate,
           accessPasswordHash (bcrypt, select:false), visible
Milestone  project ref, title, description, status, dueDate, order,
           developers [ref Developer]
Developer  name, email (unique when set), passwordHash (bcrypt, select:false),
           role, skills[], color, active, lastLoginAt
Task       project ref, milestone ref, developer ref, title, description,
           status (todo | in-progress | review | done),
           priority (low | medium | high), dueDate, order
```

Progress percentages are computed from task counts (done / total), rolled up
milestone -> project.

### Date rules

The project start date is the floor for everything inside it:

- a project's target end date cannot precede its start date;
- a milestone due date and a task due date cannot precede the project start date.

Date inputs carry a `min` attribute so the picker greys out earlier days, and
every write endpoint re-checks it server-side.

## Project layout

```
src/
  app/
    page.tsx                                   public project list
    projects/[id]/page.tsx                     gate + hover explorer
    admin/login/                                admin sign-in
    admin/(panel)/                              admin pages (shared chrome)
    developer/login/                            developer sign-in
    developer/(panel)/                          developer task board
    api/                                        route handlers
  components/       shared UI, theme toggle, explorer, admin dialogs
  lib/
    mongodb.ts      cached mongoose connection
    models/         Admin, Project, Milestone, Developer, Task
    auth.ts         JWT sign/verify + cookie names
    session.ts      getAdminSession / isAdmin / getDeveloperSession
    queries.ts      server-side data reads, incl. getProjectTree
  proxy.ts          guards /admin and /developer
scripts/
  seed-admin.mjs    creates / updates the admin account
  seed-nova.mjs     imports the NOVA sample programme
```

## Theming

**Both themes are strictly monochrome** - canvas, greys, black and white, no
hue anywhere. Light and dark are the same design mirrored, so every component
reads identically in either one.

Colours are CSS custom properties on `:root`, swapped by `[data-theme="dark"]`
on `<html>`, and exposed to Tailwind through `@theme inline` in
`src/app/globals.css`. An inline script in the root layout applies the saved
theme before first paint, so there is no flash of the wrong colours.

Without hue, meaning is carried by **intensity**: quiet things sit close to the
canvas, noteworthy things pull away from it. Six badge tiers form the ladder:

| Tier | Used for | Rendering |
| --- | --- | --- |
| `badge-neutral` | pending, todo, low | closest to the canvas |
| `badge-info` | planning, review, medium | faint |
| `badge-warn` | on-hold, in-progress | medium |
| `badge-good` | active, done | strong |
| `badge-brand` | completed | strongest fill |
| `badge-danger` | high priority | strong outline |

Links cannot signal hover by colour either, so `.link-strong` and `.link-muted`
underline instead.

Developer avatar colours are arbitrary hex values from the database. `Avatar`
maps each one onto a narrow grey band by luminance (`avatarGreys` in
`src/components/ui.tsx`), so avatars still differ per developer while the white
initials clear 4.5:1 on both surfaces whatever is stored.

Build with the semantic utilities only - `bg-canvas`, `bg-surface`, `bg-chip`,
`border-line`, `border-line2`, `text-heading`, `text-body`, `text-muted`,
`bg-brand-500` / `text-brand-fg`, `text-danger` / `bg-danger-bg` - and never a
raw Tailwind palette class (anything shaped like text-<hue>-500). A raw class
has one fixed hue and would break the monochrome rule. Note that Tailwind scans
this README too, so writing such a class here would compile it into the CSS.

Every text/background pair in both themes clears WCAG AA; the tightest is 5.3:1.

## Production notes

- Set a real `SESSION_SECRET`, and seed the admin with a strong password.
- Cookies are `secure` automatically when `NODE_ENV=production`, so serve over HTTPS.
- `npm run build && npm start`.
