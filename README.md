# AIC Hola
A modern, luxury-styled church platform for AIC Hola, in two parts sharing one
Supabase backend:

- **Website** (`/`, Create React App + React Router + Tailwind) — public pages
  plus a staff web console.
- **Mobile app** (`/aic-hola-app`, Expo + expo-router) — the church in your
  pocket, with a role-aware staff workspace.
- **Backend** (`/supabase`) — Postgres schema, row-level security, roles, church
  finance and a digital records system.

## Roles & permissions
| Role | Authority |
| --- | --- |
| **Member** | Read public content. |
| **Department editor** | Notices/events for the departments they belong to. |
| **Department head** | Create/edit/delete over **their department's** events & notices. |
| **Treasurer** | Everything a treasurer/accountant needs: funds, income, expenses, budgets, reports, finance records. |
| **Pastor** | Power over **all** departments (and treasury/records). |
| **Administrator** | Power over **all** departments, plus managing people, roles and department heads. |

Only the **administrator** and the **pastor** have authority over every
department. Every change to a record or transaction is written to a
tamper-evident audit trail.

## Backend setup (Supabase)

Run the SQL in the Supabase SQL editor, in order:

1. `supabase/schema.sql` — profiles, memberships, events, notices, base RLS.
2. `supabase/schema-02-roles-finance-records.sql` — department heads, pastor
   authority, treasury (funds, finance members, transactions, budgets), the
   digital records system (folders, records, audit log) and the private
   `records` storage bucket.
3. `supabase/schema-03-accounts-admin.sql` — account status (suspend/reinstate),
   the administrator bootstrap, the `account_directory` view, and the people
   management rules enforced in the database.
4. `supabase/schema-04-worship-audio.sql` — worship audio (service recordings
   and a single live broadcast), the public `worship-audio` storage bucket, and
   administrator/pastor-only publishing.
5. `supabase/schema-05-treasury-accounting.sql` — the church accountant's
   toolkit: pledges, expenditure approvals, bank accounts and reconciliation,
   and the saved-reports register.
6. `supabase/schema-06-messaging-moderation.sql` — registered-user private
   messaging, server-enforced moderation strikes, and leadership reports.

For messaging, deploy `supabase/functions/moderate-message` with the Supabase
CLI after applying migration 06. The function uses the project service role
only on the server to permanently delete an account after its third confirmed
violation; the mobile app never receives or stores that credential.

Then, in the app:

1. Register the first account on the website's **Staff portal** (`/account`).
2. Claim the administrator seat from that same page — the **Claim administrator
   seat** button appears while no administrator exists yet. This calls
   `claim_admin_seat()`, which refuses once an administrator is on record, so it
   is a genuine one-time bootstrap and never a self-promotion backdoor.
3. Open **Administration** (`/admin`) to create accounts, assign church-wide
   roles, set department memberships, appoint a head for every department, and
   suspend or reinstate people.

### Administrative rules (enforced in Postgres)

- Only an **administrator** may change a role or an account's status, appoint a
  department head, or grant a department membership. The pastor shares
  *department content* authority but not people authority.
- An administrator **cannot demote or suspend themselves**, so the church can
  never be left without an administrator.
- A **suspended** account loses every elevated power at once (it keeps its
  history and can be reinstated).
- A department head seat may only be filled by someone holding the
  `department_head`, `pastor` or `admin` role; appointing a plain member promotes
  them automatically.
- Every role, status, membership and department-head change is written to the
  `audit_log`.

## Environment
Copy the example files and fill in your Supabase project values:

- Website: `.env.example` → `.env` (`REACT_APP_SUPABASE_URL`,
  `REACT_APP_SUPABASE_ANON_KEY`).
- Mobile app: `aic-hola-app/.env.example` → `aic-hola-app/.env`
  (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

## Running
### Website
```bash
npm install
npm start      # http://localhost:3000
npm test       # unit tests
npm run build  # production bundle
```

Staff areas: `/account`, `/admin`, `/manage/events`, `/media`, `/treasury`,
`/records`. Every console page carries the same left-hand navigation, showing
only the pages your role can open, so no link ever disappears as you move
around.

### Worship audio (Live page)

The **Live** page plays the YouTube service and, beneath it, a high-quality
audio player with play/pause, ±10-second skip, a draggable seek bar and volume
control. When a broadcast is live (see **Worship media** at `/media`) its audio
autoplays; browsers block un-muted autoplay until the visitor interacts, so the
player offers a one-tap start instead of failing silently.

### Treasury

The treasurer's workspace covers what a church accountant needs: funds, income
and expenses, budgets, **pledges** with fulfilment tracking, an **expenditure
approval** chain (request → approved → paid, with approval writing the expense
into the ledger), **bank-account reconciliation** with cleared/pending state,
per-member **giving statements**, and CSV **reports** for the board or an
auditor.

### Mobile app
```bash
cd aic-hola-app
npm install
npm start      # Expo dev server
npm run lint
npx tsc --noEmit
```

## Design
A refined, luxurious design language shared by both apps: warm ivory paper,
deep espresso ink, champagne-gold accents, terracotta and deep emerald, with
serif display headings. Design tokens live in `src/index.css` (web) and
`aic-hola-app/constants/theme.ts` (app).

## Create React App reference
For the underlying CRA scripts (`start`, `test`, `build`, `eject`), see the
[Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
