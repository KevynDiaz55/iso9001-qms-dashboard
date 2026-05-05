# TMAC ISO 9001 Implementation Tracker & QMS Dashboard

Internal ISO 9001 implementation tracker and Quality Management System dashboard for TMAC consultants and student workers. The app tracks company requirements and documentation, provides a guided playbook, and generates City of El Paso KPI exports (CSV/PDF).

## Tech stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, TanStack React Query
- **Backend**: Next.js API routes (TypeScript) with Prisma ORM
- **Database**: SQLite for local development (schema compatible with Postgres)
- **Auth**: NextAuth credentials provider (email + password, JWT session)
- **Reporting**: CSV and PDF exports using custom endpoints and `pdfkit`

## Getting started (local development)

### Prerequisites

- Node.js 18+ and npm

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

The project ships with a basic `.env` file:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-in-production"
NEXT_PUBLIC_API_BASE_URL=""
```

- `DATABASE_URL` – SQLite database file for local dev.
- `NEXTAUTH_URL` – base URL of the Next.js app.
- `NEXTAUTH_SECRET` – replace with a strong random string in real deployments.
- `NEXT_PUBLIC_API_BASE_URL` – base URL for API calls from the browser. Keep empty for local development (uses same origin). For static hosting, set to the URL of the Node API server (see below).

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates the SQLite database at `prisma/dev.db` with all tables.

### 4. Seed demo data

```bash
npm run prisma:seed
```

The seed script creates:

- **Users**
  - Admin: `admin@tmac.local`
  - Consultant: `consultant@tmac.local`
  - Consultant (student worker): `tmac.student@utep.edu`
  - Viewers: `viewer1@tmac.local`, `viewer2@tmac.local`
- **Password for student worker**

```text
email:    tmac.student@utep.edu
password: Password123!
```

- **Companies** – at least 3, including 2 in `El Paso, TX`
- **Document levels** – L1–L4 (Policies, Processes, Procedures & Work Instructions, Records)
- **ISO areas and requirements** – 10–20 clauses and 40–60 derived requirements
- **Company requirements** – full matrix per company with mixed statuses and due dates
- **Documents** – ~35–40 per company across levels and providers
- **Company settings** – main cloud provider and URL
- **Playbook** – 6 implementation phases with checklist tasks per company

### 5. Run the app locally

```bash
npm run dev
```

Then open `http://localhost:3000`.

Log in with the student worker account:

```text
email:    tmac.student@utep.edu
password: Password123!
```

You should see:

- **Dashboard** – overview of progress, requirements by status, documents by level, repository link, recent activity.
- **Requirements** – filterable table of `CompanyRequirement` rows with clause, status, owner, due dates.
- **Documents** – filterable table of documents, cloud providers, and quick open links.
- **Playbook** – phased guidance with checklists per company.
- **Reports → City of El Paso KPI Report** – El Paso-only view with summary cards and company table plus CSV/PDF export buttons.
- **Company Settings** – company profile and main repository configuration.

## Scripts

- `npm run dev` – start Next.js dev server.
- `npm run build` – build for production.
- `npm start` – run production server.
- `npm run lint` – run ESLint.
- `npm run export` – build and export a static front-end to `out/`.
- `npm run prisma:migrate` – alias for `prisma migrate dev`.
- `npm run prisma:seed` – run Prisma seed (`ts-node prisma/seed.ts`).

## Project structure

- `app/` – Next.js App Router pages and layouts
  - `layout.tsx` – root layout
  - `page.tsx` – landing page with link to login
  - `login/` – credential-based login page
  - `(protected)/layout.tsx` – authenticated shell using sidebar + topbar
  - `(protected)/dashboard/` – main ISO 9001 tracker view per company
  - `(protected)/requirements/` – requirements table and detail modal
  - `(protected)/documents/` – document list and filters
  - `(protected)/playbook/` – guided implementation phases and tasks
  - `(protected)/reports/el-paso/` – City of El Paso KPI report and exports
  - `(protected)/settings/` – company profile and repository settings
- `app/api/` – typed API routes (Next.js route handlers)
  - `auth/[...nextauth]` – NextAuth credentials provider
  - `me` – current user + accessible companies
  - `companies` & `companies/[id]` – company CRUD + dashboard KPIs
  - `document-levels` – list all document levels
  - `iso-areas` – ISO clauses with nested requirements
  - `company-requirements` – list and update requirement status/metadata
  - `documents` & `documents/by-requirement/[id]` – document queries and updates
  - `company-settings/[companyId]` – per-company settings
  - `playbook/steps` & `playbook/company/[companyId]` – guided implementation steps
  - `reports/el-paso/kpi` – JSON KPIs for El Paso companies
  - `reports/el-paso/csv` – CSV export
  - `reports/el-paso/pdf` – PDF export
- `components/` – shared layout and UI components
  - `layout/Sidebar`, `layout/Topbar`, `layout/LayoutShell`
  - `ui/Card`, `ui/KpiCard`, `ui/StatusBadge`, `ui/LevelChip`, `ui/Table`, `ui/Modal`
  - `providers` – NextAuth + React Query providers
- `lib/`
  - `prisma` – Prisma client singleton
  - `auth` – NextAuth options and helpers (`getServerAuthSession`, `requireAuth`, `requireRole`)
  - `kpi` – KPI calculation utilities
  - `api` – helper to build API URLs (supports external API base)
  - `hooks` – React Query hooks for common data (companies, dashboard, requirements, documents, playbook, El Paso report)
- `prisma/`
  - `schema.prisma` – full relational schema for ISO 9001 domain
  - `seed.ts` – database seeding script

## El Paso KPI CSV & PDF exports

Navigate to **Reports → City of El Paso KPI Report** while logged in.

- Use the optional **date range** filters (lastUpdatedAt from/to).
- Click:
  - **Export KPI report (CSV)** – downloads a CSV where each row is one El Paso company with:
    - `companyName`, `industry`, `location`
    - requirement counts by status
    - document totals and approved per level (L1–L4)
    - `targetCertificationDate`, `daysToTarget`, and `implementationBand`
  - **Export KPI report (PDF)** – downloads a PDF with:
    - Title: “City of El Paso – ISO 9001 Implementation KPIs”
    - Aggregated metrics (number of companies, average progress, approved docs by level)
    - Company table (name, industry, overall %, approved docs, target date, implementation band)

Both endpoints filter companies by `location` containing “El Paso” (case-insensitive) and apply the optional date range to requirement `lastUpdatedAt` and document `updatedAt`.

## Hosting on UTEP / university infrastructure

The app is designed to support two deployment modes:

### Option 1 – Full Next.js app on Node (recommended where possible)

Host the entire Next.js app (frontend + API + auth) on a Node-capable server.

1. Set production environment variables (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`).
2. Run migrations and seed (or custom seed):

```bash
npm install
npx prisma migrate deploy
npm run prisma:seed   # optional in production
npm run build
npm start
```

3. Expose the app at the URL you set in `NEXTAUTH_URL`.

In this mode, the front-end and API share the same origin, and `NEXT_PUBLIC_API_BASE_URL` can remain empty.

### Option 2 – Static front-end + separate Node API server

If the university web server only supports static hosting (no Node):

1. **Run the API + auth on a Node server**

   - Deploy this repository to a Node-capable environment (on-prem VM, cloud, etc.).
   - Configure:

   ```env
   NEXTAUTH_URL="https://api.example.edu"   # URL of the Node server
   NEXTAUTH_SECRET="strong-random-secret"
   DATABASE_URL="postgres://..."            # optional: swap to Postgres
   NEXT_PUBLIC_API_BASE_URL="https://api.example.edu"
   ```

   - Run:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run prisma:seed
   npm run build
   npm start
   ```

2. **Build a static front-end bundle**

   On a build machine:

   ```bash
   NEXT_PUBLIC_API_BASE_URL="https://api.example.edu" npm run export
   ```

   This runs `next build` and `next export`, producing static assets under `out/`.

3. **Deploy static assets to UTEP web hosting**

   - Copy the contents of the `out/` directory to the university’s static web server (e.g., `public_html`).
   - Configure the web server to serve `index.html` for `/` and `/login`.

In this mode:

- The **static front-end** is served by UTEP’s web server.
- All API calls (including login, dashboard data, reports) are made to the external Node server defined by `NEXT_PUBLIC_API_BASE_URL`.

## Linting and formatting

- ESLint is configured via `.eslintrc.json` (`next/core-web-vitals`).
- Prettier is configured via `.prettierrc`.
- TypeScript options live in `tsconfig.json`.

You can run linting with:

```bash
npm run lint
```

## Notes and future enhancements

- The UI is intentionally light-themed with a left sidebar, top header, KPI cards, and responsive tables to match modern SaaS dashboards.
- Additional enhancements (not required but easy to add):
  - Charts for trends using a charting library.
  - Inline editing for requirement notes and document metadata.
  - More granular RBAC and audit logging.

