# Health Wallet (2care.ai Assignment)

A minimal but functional Digital Health Wallet: upload and manage health reports, track vitals over time with charts, filter/search, and share reports with doctors/family as read-only viewers.

## Tech Stack

- Frontend: React + Vite, React Router, Chart.js
- Backend: Node.js + Express
- Database: SQLite (sqlite3)
- Uploads: Local filesystem via Multer (can be swapped for S3/GCS)

## Architecture Diagram

```
[ React Client ] --HTTP--> [ Express API ] --SQL--> [ SQLite DB ]
       |                          |
       +----- /uploads -----------+--> [ Local File Storage ]
```

## Features

- User registration/login (JWT)
- Upload PDF/Images as reports with metadata (category, date, optional vitals JSON)
- List, filter, preview, and download reports (by category, date range, vital key)
- Track vitals over time; visualize trends with charts and filter by date range
- Share specific reports with other users (viewer access); revoke access

## Monorepo Layout

- `server/` Express API and SQLite
- `client/` React app (Vite)

## Setup Instructions

1. Prereqs: Node.js >= 18
2. Backend
   - Copy `server/.env.example` to `server/.env` and set `JWT_SECRET`
   - Install deps: `npm install` in `server/`
   - Start dev: `npm run dev`
   - API at: `http://localhost:4000`
3. Frontend
   - Install deps: `npm install` in `client/`
   - Start dev: `npm run dev`
   - App at: `http://localhost:5173`
   - Vite proxy forwards `/api` and `/uploads` to the backend

## API Overview

- Auth
  - POST `/api/auth/register` { name, email, password } -> { token, user }
  - POST `/api/auth/login` { email, password } -> { token, user }
  - GET `/api/auth/me` (Bearer token) -> { user }
- Reports (Bearer token)
  - POST `/api/reports` multipart form: file, category, date, vitals (JSON string)
  - GET `/api/reports?category=&from=&to=&vitalType=` -> list
  - GET `/api/reports/:id` -> item
  - GET `/api/reports/:id/download` -> file download
  - DELETE `/api/reports/:id` -> remove (owner only)
- Vitals (Bearer token)
  - POST `/api/vitals` { type, value, unit?, date } -> created
  - GET `/api/vitals?type=&from=&to=` -> list
- Shares (Bearer token, owner only)
  - POST `/api/shares/:reportId` { email } -> share list
  - GET `/api/shares/:reportId` -> share list
  - DELETE `/api/shares/:reportId/:shareId` -> revoke

## Database Schema (SQLite)

- `users(id, name, email unique, password_hash, created_at)`
- `reports(id, owner_id -> users.id, category, date, vitals_json, original_name, stored_name, mime_type, size, created_at)`
- `vitals(id, user_id -> users.id, type, value, unit, date, created_at)`
- `shares (aka shared_reports)` — `id, report_id -> reports.id, shared_with_user_id -> users.id, role='viewer', created_at, unique(report_id, shared_with_user_id)`

Notes:

- Time-series vitals are normalized in `vitals` and displayed in charts.
- When a report contains vitals, a snapshot is stored in `reports.vitals_json` (e.g., `{ bp: "120/80", sugar: 110, heartRate: 72 }`) to enable report-level filtering without tightly coupling charts to reports.

## Security Considerations

- JWT-based auth with `Authorization: Bearer <token>`
- Passwords hashed with bcrypt
- Multer upload filter restricts to PDF/PNG/JPEG/WEBP; 10MB limit
- Ownership checks for deleting reports and managing shares
- Access to a report allowed if owner or explicitly shared
- Role-based access: `viewer` (read-only) for shared users; only owners can delete.
- File validation: allowed MIME types (PDF/PNG/JPEG/WEBP), 10MB size limit.

Recommended hardening (prod): add Helmet headers, rate limiting, audit logs, and malware scanning for uploads.

## WhatsApp Upload (Design Explanation)

Two practical integration paths:

- Twilio WhatsApp Business API webhook

  - Map verified phone numbers to user accounts.
  - Webhook receives inbound media; validate Twilio signatures.
  - Download media to object storage/local uploads and create a `reports` row.
  - Parse metadata from message caption/template (category/date/vitals), with reasonable defaults.
  - Enforce same file-type/size checks as web uploads.

- Public upload API with one-time tokens
  - Expose `/api/reports` and issue short-lived tokens linked to a user.
  - A WhatsApp bot sends a magic link; user attaches media; backend authenticates via the token.
  - Same storage and validation flow as above.

This repo documents the approach rather than shipping the full WhatsApp flow.

## API Documentation (Selected)

- Upload report

  - `POST /api/reports` — multipart form fields: `file`, `category`, `date`, `vitals` (JSON string)
  - Returns created report; file is stored and accessible via `/api/reports/:id/download`

- Fetch reports

  - `GET /api/reports?category=&from=&to=&vitalType=` — lists owned + shared reports; filter by category/date range/vital key

- Fetch vitals trend

  - `GET /api/vitals?type=&from=&to=` — returns time-series vitals for the authenticated user

- Share report (read-only)
  - `POST /api/shares/:reportId` { email } — grants viewer access
  - `GET /api/shares/:reportId` — list viewers
  - `DELETE /api/shares/:reportId/:shareId` — revoke access

## Final Verdict (Current State)

- UI & vitals tracking: strong
- System completeness: improving; core flows work (upload, store, preview/download, filter, vitals chart)
- Access control & security: basic viewer role enforced; more hardening recommended
- Assignment alignment: ~70–80%; remaining items are README enhancements and optional WhatsApp integration

## File Storage Strategy

- Local `server/src/uploads/` for dev/demo. In production, prefer object storage (S3/GCS) and store object keys in DB; serve via signed URLs.

## Scalability Notes

- Move static files to CDN/object storage
- Replace SQLite with Postgres/MySQL
- Add pagination to list endpoints
- Add background scanning/virus check for uploads

## Running Locally (Quickstart)

- Terminal 1: `cd server && npm i && npm run dev`
- Terminal 2: `cd client && npm i && npm run dev`
- Visit `http://localhost:5173`

## Recording

Provide a short screen recording showing:

- Auth flow (register/login)
- Uploading a report, listing/filtering, downloading
- Adding vitals and viewing chart
- Sharing a report with another registered user and revoking access
- Code structure and how to run locally
