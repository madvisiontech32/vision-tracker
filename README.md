# Vision Tracker

A client portal + admin panel built with **Next.js 16 (App Router)**, **React 19**,
**Tailwind CSS v4**, **MongoDB / Mongoose**.

- **Admin** creates projects, sets milestones, adds developers to each milestone,
  and assigns tasks to those developers. Each project gets a client access
  password, set from the admin panel.
- **Client** opens the public home page, picks their project and types the
  password. Everything then lives on one screen: hover a milestone to reveal its
  team, hover a developer to reveal their tasks. No further page loads.
- **Theme**: light / dark toggle in the header, remembered per browser, with the
  first-visit default taken from the OS preference.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit the values
npm run seed:admin           # creates the admin account in MongoDB
npm run dev                  # http://localhost:3000
```

The app ships with no demo content - the public home page stays empty until an
admin creates projects.

### Environment variables (`.env.local`)

| Variable | What it does |
| --- | --- |
| `MONGODB_URI` | Mongo connection string. Local or Atlas. |
| `SESSION_SECRET` | Signs the admin + client-access JWT cookies. Use a long random string in production. |
| `SEED_ADMIN_EMAIL` | Only read by `npm run seed:admin`. Defaults to `admin@project.com`. |
| `SEED_ADMIN_PASSWORD` | Only read by `npm run seed:admin`. |
| `SEED_ADMIN_NAME` | Only read by `npm run seed:admin`. |

### Admin account

Admins live in the `admins` collection with a bcrypt `passwordHash`
(`select: false`, so it never leaves the server). `npm run seed:admin` is
idempotent - re-running it updates the existing account rather than creating a
duplicate, which is also how you rotate the password.

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
| `/admin/developers` | Team pool: add, edit, delete developers. |

`src/proxy.ts` (Next 16's middleware convention) guards every `/admin` route.

## API

All write endpoints require the admin cookie; `/api/projects` (GET) and
`/api/projects/[id]/unlock` are the only public ones.

```
POST   /api/admin/login                        { email, password }
POST   /api/admin/logout
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
Developer  name, email, role, skills[], color, active
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
    api/                                        route handlers
  components/       shared UI, theme toggle, explorer, admin dialogs
  lib/
    mongodb.ts      cached mongoose connection
    models/         Admin, Project, Milestone, Developer, Task
    auth.ts         JWT sign/verify + cookie names
    session.ts      getAdminSession / isAdmin
    queries.ts      server-side data reads, incl. getProjectTree
  proxy.ts          guards /admin
scripts/seed-admin.mjs   creates / updates the admin account
```

## Theming

Colours are CSS custom properties on `:root`, swapped by `[data-theme="dark"]`
on `<html>`, and exposed to Tailwind through `@theme inline` in
`src/app/globals.css`. An inline script in the root layout applies the saved
theme before first paint, so there is no flash of the wrong colours.

**Light** uses hue. **Dark is strictly monochrome** - canvas, greys and white
only. Status meaning is carried by intensity instead of hue, through six badge
tiers that get brighter as they get more noteworthy:

| Tier | Used for | Dark rendering |
| --- | --- | --- |
| `badge-neutral` | pending, todo, low | dimmest |
| `badge-info` | planning, review, medium | dim |
| `badge-warn` | on-hold, in-progress | medium |
| `badge-good` | active, done | bright |
| `badge-brand` | completed | brightest fill |
| `badge-danger` | high priority | strong outline |

Developer avatar colours are arbitrary hex values from the database, so in dark
mode they are desaturated in CSS (`--avatar-filter`) rather than stored twice.

Build with the semantic utilities only - `bg-canvas`, `bg-surface`, `bg-chip`,
`border-line`, `border-line2`, `text-heading`, `text-body`, `text-muted`,
`bg-brand-500` / `text-brand-fg`, `text-danger` / `bg-danger-bg` - and never a
raw Tailwind palette class such as `text-rose-500`. A raw class has one fixed
hue and would break the monochrome rule in dark mode.

## Production notes

- Set a real `SESSION_SECRET`, and seed the admin with a strong password.
- Cookies are `secure` automatically when `NODE_ENV=production`, so serve over HTTPS.
- `npm run build && npm start`.
#   v i s i o n - t r a c k e r  
 