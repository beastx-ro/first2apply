# First 2 Apply

First 2 Apply (https://first2apply.com/) is an open-source job board aggregator that centralizes listings from platforms like LinkedIn, Indeed, Dice, and more, helping job seekers find opportunities faster.
Watch demo [video](https://www.youtube.com/watch?v=9-OYPBhwYG8).

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (v10+ recommended)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Docker](https://www.docker.com/) (required for local Supabase)

## Project Structure

This project is organized as a monorepo using [Nx](https://nx.dev).

- **apps/**
  - `backend`: Supabase configuration, migrations, and edge functions.
  - `desktopProbe`: The Electron desktop application.
  - `webapp`: The main web application (Next.js).
  - `landingPage`: Marketing landing page.
  - `blog`: Project blog.
  - `invoiceDownloader`: Utility for downloading invoices.
  - `nodeBackend`: Additional Node.js backend services.
- **libraries/**: Shared code and utilities.

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Setup

Create `.env` files in the application directories by copying the examples:

- **Backend:** `apps/backend/.env` (copy from `.env.example` if available, or set up Supabase env vars)
- **Desktop Probe:** `apps/desktopProbe/.env` (copy from `apps/desktopProbe/.env.example`)

### 3. Supabase Setup

Navigate to the backend app directory:

```bash
cd apps/backend
```

Initialize and start Supabase locally (only needs to be run once):

```bash
pnpm supabase start
```

You should now be able to visit the Supabase dashboard at http://localhost:54323/.

**Import Data:**
Import the [sites_rows.csv](./apps/backend/supabase/sites_rows.csv) file into the `sites` table in the Supabase dashboard.

**Run Edge Functions:**

```bash
pnpm supabase functions serve
```

### 4. Run Applications

You can use `nx` to run applications from the root directory.

**Run All Apps (Dev Mode):**

```bash
pnpm dev
```

> Note: `pnpm dev` runs the `dev` script for all apps. For the desktop app, use the specific command below.

**Desktop Probe:**

```bash
pnpm nx start first2apply-desktop
```

## Development

This project uses **Nx** for task management.

- **Run Dev Server:** `pnpm nx dev <project-name>` or `pnpm nx start <project-name>`
- **Build:** `pnpm nx build <project-name>`
- **Test:** `pnpm nx test <project-name>`
- **Lint:** `pnpm nx lint <project-name>`

To run tasks for all projects:

```bash
pnpm nx run-many -t build
```

## Release

### Desktop Probe

Update the version in `apps/desktopProbe/package.json` and the `.appx` manifest.

**MacOS:**
Run the package command:
```bash
pnpm nx run first2apply-desktop:package
# or from the folder
cd apps/desktopProbe && npm run package
```

**Windows:**
Build the AppX bundle:
```bash
pnpm nx run first2apply-desktop:make
# or from the folder
cd apps/desktopProbe && npm run make
```

**Publishing:**
The root `package.json` includes a publish script that runs across projects:

```bash
pnpm run publish
```

### Linux
Manual upload of `.deb` file to S3 and update of `RELEASES.json` is required.
