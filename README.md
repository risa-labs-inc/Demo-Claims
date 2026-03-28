# RISA Claims Dashboard Demo

A healthcare claims management platform built for revenue cycle teams. Track, manage, and process insurance claims from submission through final resolution — with built-in denial analysis, team assignment workflows, and multi-payer support.

---

## Overview

RISA Claims Dashboard gives claims management teams a centralized workspace to:

- Monitor claims across all stages and statuses in real time
- Review and act on insurance denials with AI-assisted analysis
- Assign claims to team members and track individual workloads
- Export claim data for reporting and auditing

---

## Features

### Claims Management
- View all claims in a searchable, filterable table
- Track statuses: Paid, Denied, Partially Paid, In Process, Not on File, Pending, and more
- Manage primary and secondary insurance information side by side
- Record payment details: check numbers, amounts, and dates

### Denial Analysis
- Integrated denial analysis engine with rule-based pass/fail/warning indicators
- Clear action plan recommendations for each denial
- Track denial codes, descriptions, and denied line items
- Document viewer for supporting claim documentation

### Filtering & Search
- Search by patient name, MRN, claim ID, or member ID
- Filter by date of service, insurance plan, provider NPI, stage, status, and assignee
- Custom date range picker and multi-select filters

### Team Collaboration
- Assign claims to individual team members
- Bulk-assign multiple claims at once
- Personal workload views: "My Cases" and "My Denied Cases"
- Track completed cases per user

### Data Export
- Export filtered claim data to CSV with all relevant fields

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, Radix UI |
| Auth | NextAuth.js v4 (credentials + JWT) |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Deployment | Docker, Render |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
git clone https://github.com/risa-labs-inc/Demo-Claims.git
cd Demo-Claims
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Database Setup

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # Seed with sample data
```

### Run the App

```bash
npm run dev
```


---

## Demo Credentials

| Field | Value |
|---|---|
| Email | `john@risalabs.ai` |
| Password | `risa@2026` |

---

## Project Structure

```
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── page.tsx           # All Claims
│   │   ├── my-cases/          # Assigned to me
│   │   ├── completed/         # Processed claims
│   │   └── denied/            # Denied claims
│   └── api/                   # API routes
│       ├── claims/            # CRUD, bulk assign, export
│       └── denial-analysis/   # Denial analysis proxy
├── components/
│   ├── claims/                # Claims-specific components
│   └── layout/                # Sidebar and layout
├── lib/                       # Utilities and helpers
├── prisma/                    # Schema and seed data
└── middleware.ts              # Auth middleware
```

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:seed      # Re-seed the database
```

---

## Deployment

The project includes configuration for:

- **Docker** — `Dockerfile` for containerized deployment
- **Render** — `render.yaml` for one-click Render deployment with PostgreSQL

---

## License

Private — RISA Labs, Inc. All rights reserved.
