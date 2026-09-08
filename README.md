# Weekly Report Generator & Team Dashboard

## 1. Project Overview
A full-stack team reporting and management system that allows individual team members to submit structured weekly work reports and managers to review, request corrections, approve reports, and analyze team activity and delivery velocity through an interactive data-driven dashboard.

---


## 2. Key Features

### Team Member
- Register and login
- Create weekly reports with structured fields (tasks, blockers, achievements, hours)
- Save reports as drafts
- Edit Draft / Needs Correction reports
- Submit reports for manager review
- View personal report history organized by week
- View manager correction comments clearly on the report page
- Resubmit corrected reports
- View previous report versions alongside current submissions

### Manager
- View all team reports across projects
- Filter reports by member, project, status, and date range
- Review submitted reports
- Request changes with mandatory explanatory comments
- Approve reports
- View immutable report version history
- View team member profiles and individual submission stats
- View analytics dashboard with visual charts (Recharts)
- View side-by-side weekly matrix overview of all team members

### Admin
- All Manager capabilities
- Manage users (search, view, activate/deactivate)
- Assign and update user roles
- Manage projects and work categories (CRUD)

---

## 3. Report Workflow

```
Draft ──► Submitted ──► Needs Correction ──► Submitted ──► Approved
```

### Workflow Rules & Permissions:
- **Team Member**:
  - Creates a report in `DRAFT` status.
  - Submits the report $\rightarrow$ status becomes `SUBMITTED`.
  - If changes are requested $\rightarrow$ status becomes `NEEDS_CORRECTION`.
  - Edits the report and resubmits $\rightarrow$ status returns to `SUBMITTED`.
  - *Team Members can only edit reports when in `DRAFT` or `NEEDS_CORRECTION` status.*
- **Manager / Admin**:
  - Opens a `SUBMITTED` report.
  - Can **Approve** $\rightarrow$ status transitions to `APPROVED` (locked from further edits).
  - Can **Request Changes** $\rightarrow$ manager must provide a general review comment, transitioning status to `NEEDS_CORRECTION`.
  - *Managers cannot rewrite the team member's actual report tasks/hours, only take review actions.*

---

## 4. Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React
- Axios

### Backend
- Node.js
- Express.js
- TypeScript

### Database
- MySQL
- Prisma ORM

### Authentication
- JWT (JSON Web Tokens)
- bcryptjs password hashing
- Reusable Authentication & Role Middleware

### Validation
- Zod (Request body & query schemas)

### Testing
- Jest
- Supertest

---

## 5. System Architecture

```
Frontend (Next.js)
        ↓
REST API (Bearer JWT)
        ↓
Express Routes
        ↓
Authentication / RBAC Middleware
        ↓
Zod Validation Middleware
        ↓
Controllers (Thin HTTP Handlers)
        ↓
Services (Business Logic & State Machine)
        ↓
Prisma ORM (Parameterized Queries & Transactions)
        ↓
MySQL Database
```

---

## 6. Project Structure

```
weekly-report-team-dashboard/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   ├── (auth)/register/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   │   ├── manager/
│   │   │   ├── admin/
│   │   │   ├── projects/
│   │   │   └── profile/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── reports/
│   │   │   └── ai/
│   │   ├── context/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── config/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── app.ts
│   │   └── index.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── .gitignore
```

---

## 7. Database Design

### Main Entities & Relationships:

- **User**: System user account with assigned role (`TEAM_MEMBER`, `MANAGER`, `ADMIN`).
- **Project**: Work stream or client project category attached to reports.
- **Report**: Master record for a user's weekly report for a specific sprint date range.
- **ReportVersion**: Immutable snapshot of report content created on each submission cycle.
- **Task**: Task-level breakdown (priority, planned %, actual %, status, planned & actual hours, deliverable output).
- **Blocker**: Challenges faced during the week, with the ability to flag a **Key Blocker**.
- **Achievement**: Highlights and wins accomplished, with the ability to flag a **Key Milestone**.
- **TimeBreakdown**: Category breakdown of working hours (Development, Testing, Meetings, Documentation, Other).
- **Review**: Manager review actions (`APPROVED`, `CHANGES_REQUESTED`) and feedback comments.

### Entity Relationships:

```
User 1          ──► Many Reports
User 1          ──► Many Reviews (as Reviewer)
Project 1       ──► Many Reports
Report 1        ──► Many ReportVersions
Report 1        ──► Many Tasks
Report 1        ──► Many Blockers
Report 1        ──► Many Achievements
Report 1        ──► Many TimeBreakdowns
Report 1        ──► Many Reviews
ReportVersion 1 ──► Many Reviews
```

---

## 8. Prerequisites

Before running the project, install:

- **Node.js**: `v20+` or `v22+`
- **npm**: `v10+`
- **MySQL Server**: `v8.0+`
- **Git**

---

## 9. Environment Variables

### Backend

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
JWT_SECRET="your-super-secret-jwt-key"
DATABASE_URL="mysql://root:yourpassword@localhost:3306/weekly_report_db"
```

### Frontend

Create `frontend/.env.local` (optional, defaults to `http://localhost:5000/api`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

> **Note**: Never commit real production secrets to version control.

---

## 10. Installation

Clone the repository:

```bash
git clone <repository-url>
cd weekly-report-team-dashboard
```

---

## 11. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables (.env)
cp .env.example .env

# Push schema to MySQL database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database with realistic test dataset
npm run seed

# Start backend server
npm run dev
```

Backend runs on: **http://localhost:5000**

---

## 12. Frontend Setup

Open another terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Frontend runs on: **http://localhost:3000**

---

## 13. Database Setup

1. Start your local MySQL service.
2. The database will be created automatically when running `npx prisma db push`. Alternatively, create it manually:
   ```sql
   CREATE DATABASE weekly_report_db;
   ```
3. Configure `DATABASE_URL` in `backend/.env`.
4. Run `npx prisma db push` or `npx prisma migrate dev`.
5. Run `npm run seed` to insert rich demonstration data.

---

## 14. Demo Accounts

The login screen features **1-Click Quick-Fill** buttons for immediate testing:

### Admin
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Access**: Full system access, user role assignments, project management

### Manager
- **Email**: `manager@example.com`
- **Password**: `manager123`
- **Access**: Manager dashboard, team review, report approvals, weekly matrix

### Team Member
- **Email**: `alice@example.com` (or `bob@example.com`, `charlie@example.com`, `diana@example.com`, `evan@example.com`)
- **Password**: `password123`
- **Access**: Personal dashboard, create report, edit drafts, submit, view history

*Note: These credentials are configured for the local development and demonstration environment.*

---

## 15. Main API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/auth/me` — Get current user profile

### Reports
- `POST /api/reports` — Create a new draft report
- `GET /api/reports` — Filtered and paginated list of all team reports (Manager/Admin)
- `GET /api/reports/me` — List authenticated member's reports
- `GET /api/reports/:id` — Get report details (with ownership enforcement)
- `PUT /api/reports/:id` — Update draft or needs-correction report
- `POST /api/reports/:id/submit` — Submit/resubmit report and generate version snapshot

### Review
- `POST /api/reports/:id/review` — Approve or request changes with feedback comment

### Versions
- `GET /api/reports/:id/versions` — Get version snapshots history for a report

### Projects
- `GET /api/projects` — List project categories
- `POST /api/projects` — Create project (Manager/Admin)
- `PATCH /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Deactivate / delete project

### Dashboard & Analytics
- `GET /api/dashboard/member` — Team member personal dashboard stats
- `GET /api/dashboard/manager` — Manager KPI summary, charts, and awaiting reviews
- `GET /api/dashboard/overview` — Cross-team weekly overview matrix table
- `POST /api/ai/query` — Manager AI assistant query endpoint

---

## 16. Role-Based Access Control

### TEAM_MEMBER
- Create, edit, and submit own weekly reports.
- View own report history and previous versions.
- Cannot view or edit other members' reports (enforced with HTTP 403 on backend).
- Cannot approve reports or request changes.

### MANAGER
- View all team reports across members and projects.
- Review submitted reports, approve them, or request changes with comments.
- View version history for any report.
- View aggregated manager analytics and team member profiles.
- Cannot rewrite team member report contents directly.

### ADMIN
- All Manager capabilities.
- User management: search users, view details, change roles, activate/deactivate accounts.
- Project / Category CRUD.

*RBAC is strictly enforced on all backend API routes using reusable middleware (`requireRole`), not just by hiding UI elements.*

---

## 17. Report Versioning

When a report goes through a correction cycle, previous submitted versions are **never overwritten**.

### Versioning Lifecycle Example:

```
Report #25 (Alice Johnson - Client Alpha Portal)

Version 1
├── Submitted: Monday 5:00 PM
└── Manager Review: CHANGES_REQUESTED
    └── "Please update task completion percentages and attach the PR link."

Version 2
├── Resubmitted: Tuesday 10:30 AM (Tasks updated, PR link added)
└── Manager Review: APPROVED
    └── "Approved. Great turnaround on OAuth deliverables!"
```

- Each submission creates an immutable `ReportVersion` snapshot storing the JSON state and relational records.
- Both managers and team members can inspect previous versions on demand in the **Version History Snapshots** tab.

---

## 18. Dashboard Features

The Manager Dashboard includes:

- **Total reports submitted this week**
- **Submission compliance rate percentage**
- **Reports currently in Needs Correction status**
- **Open blockers across the team**
- **Tasks completed trend over time** (Recharts Line Chart)
- **Workload / task distribution by project** (Recharts Bar Chart)
- **Time spent by task category team-wide** (Recharts Donut/Pie Chart)
- **Reports awaiting review quick-action queue**
- **Recent review activity feed**
- **Weekly Matrix Overview** comparing all team members side-by-side

---

## 19. Testing

Run backend automated test suite:

```bash
cd backend
npm test
```

### Main Test Cases Covered:
- Health check and unauthenticated request rejection (401).
- Team Member cannot access manager-only dashboard (403).
- Team Member cannot approve or review reports (403).
- Team Member can access own report but cannot access another member's report (403).
- Approved report cannot be edited by member (400).
- Requesting changes without a review comment is rejected (400).

---

## 20. API Documentation

Interactive Swagger / OpenAPI documentation is accessible at:

- **http://localhost:5000/api-docs**
- **http://localhost:5000/api/docs**

---

## 21. Security

Implemented security practices:

- **bcrypt password hashing**: Passwords hashed with 10 salt rounds; plaintext passwords never stored.
- **JWT authentication**: Signed with expiration and verified on protected endpoints.
- **Backend RBAC & Ownership checks**: Verifies permissions and resource ownership on every request.
- **Zod request validation**: Strictly typed schemas validate request bodies and queries before reaching controllers.
- **Helmet**: Sets secure HTTP response headers.
- **Rate limiting**: Protection on authentication endpoints against brute force attempts.
- **CORS**: Restricted origins configured via environment variables.
- **Secure error handling**: Centralized error middleware prevents database details or stack traces from leaking in production.

---

## 22. Seed Data

The database seed script (`prisma/seed.ts`) populates:

- 1 Admin user (`admin@example.com`)
- 1 Engineering Manager (`manager@example.com`)
- 5 Team Members across disciplines (Frontend, Backend, Full Stack, QA, DevOps)
- 4 Project categories
- Multiple weeks of historical reports
- Reports in all status states (`DRAFT`, `SUBMITTED`, `NEEDS_CORRECTION`, `APPROVED`)
- Tasks with varying priorities, completion percentages, deliverables, and hours
- Flagged key blockers and achievements
- Working hour breakdowns
- Review comments and version histories

---



## 24. Future Improvements

- Email and Slack webhook notifications on report submission and review decisions.
- Exporting weekly reports to PDF and CSV formats.
- Department and team sub-grouping hierarchy.
- Team member Out-of-Office (OOO) and vacation tracking.
- Vector database semantic search over historical quarterly reports.

---

## 25. AI Assistant

The application includes a built-in **AI Team Assistant** accessible on the Manager Dashboard via the top navigation bar and sidebar drawer.

### 1. AI Assistant Approach
- **Manager-Only Read-Only Tool**: Restricted to `MANAGER` and `ADMIN` users via backend JWT + RBAC authorization (returns HTTP `403` for team members).
- **Grounded in Real MySQL Data**: Queries live team submissions, tasks, blockers, achievements, and hours via Prisma for the selected sprint week.
- **Privacy-Preserving Structured Context**: Automatically strips out sensitive data (passwords, hashes, JWT tokens, database connection credentials, unnecessary emails).
- **Concise Management Output**: Answers questions factually with executive summaries, status badges, and recommended actions.

### 2. Prompt Design & Hallucination Control
- The strict system prompt in `backend/src/config/aiPrompt.ts` explicitly instructs the assistant to answer **only** using supplied weekly report context.
- If data is missing or out-of-scope (e.g. general chit-chat, weather), it responds: *"I can help with team reports, project activity, blockers, achievements, and workload. I don't have information on that topic."*
- Core business metrics (compliance percentage, task counts, hours breakdown) are calculated deterministically on the backend before sending context to the model, preventing calculation hallucinations.

### 3. Suggested Prompt Chips Supported
1. *"Summarize this week"*
2. *"What are the main blockers?"*
3. *"What are the key achievements?"*
4. *"Who has not submitted?"*
5. *"Which reports need correction?"*
6. *"Which project has the highest workload?"*
7. *"How was team time distributed?"*
8. *"Give me a manager summary"*

### 4. Privacy & Security Decisions
- **Zero Secret Leakage**: `GEMINI_API_KEY` / `AI_API_KEY` is loaded from server `.env` and never exposed to the frontend client.
- **Read-Only Non-Mutation Guarantee**: The AI endpoint has zero mutation capabilities—it cannot approve, modify, create, or delete reports or users.
- **Graceful Error Handling**: If the external LLM provider experiences network latency or rate limits, the backend automatically uses its deterministic grounded summarizer so the dashboard never breaks.

### 5. Limitations
- Summaries depend on team member report completeness.
- AI provides analytical assistance and suggestions; actual management decisions (approvals, change requests) must still be confirmed by a human manager.

---

<img width="1917" height="901" alt="image" src="https://github.com/user-attachments/assets/b5187613-72be-4238-9072-7ef648b7df67" />
<img width="1913" height="901" alt="image" src="https://github.com/user-attachments/assets/2c88ee40-62cb-4848-a5ca-df43bc5be23d" />
<img width="1916" height="892" alt="image" src="https://github.com/user-attachments/assets/4b059b35-b05d-406e-9474-1b3d8b61467e" />
<img width="1917" height="901" alt="image" src="https://github.com/user-attachments/assets/40d0376c-1eb3-47b3-957d-0e9e2fe33770" />
<img width="1916" height="902" alt="image" src="https://github.com/user-attachments/assets/9335f488-6ae8-471c-8c1f-7c9e3b7a0864" />





