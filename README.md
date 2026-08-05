# Quiz Management & Online Assessment Platform

A full-stack web application for online quizzes and assessments.

**Stack:** React + Tailwind CSS | Node.js + Express | PostgreSQL | JWT Auth

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

Create the database:
```sql
CREATE DATABASE quiz_platform;
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET
npm install
npm run migrate   # Creates all tables
npm run seed      # Creates admin user + sample categories
npm run dev       # Starts on http://localhost:5000
```

**Default admin credentials:**
- Email: `admin@quizplatform.com`
- Password: `Admin@123`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Starts on http://localhost:5173
```

---

## Environment Variables (backend/.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing (use a long random string) |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:5173) |
| `NODE_ENV` | development / production |

---

## Features

### Admin
- Dashboard with statistics & charts (attempts over time, pass/fail ratio, popular quizzes)
- User management (view, activate/deactivate, delete students)
- Category management (CRUD)
- Quiz management (create, edit, publish/unpublish, delete)
- Question management (add/edit/delete MCQ questions with options)
- View all quiz attempts and detailed results
- Analytics page

### Student
- Register / Login / Forgot password
- Browse and filter published quizzes
- Take timed quizzes with question navigation
- Auto-submit on timer expiry
- View detailed results with answer explanations
- Track attempt history
- Leaderboard (overall, by category, weekly, monthly)

---

## API Overview

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/quizzes | JWT |
| POST | /api/quizzes | Admin |
| POST | /api/quizzes/:id/start | Student |
| POST | /api/quizzes/:id/submit | Student |
| GET | /api/admin/analytics | Admin |
| GET | /api/leaderboard | JWT |

Full API documented in `.kiro/specs/quiz-platform/design.md`

---

## Security

- Passwords hashed with bcrypt (cost factor 10)
- JWT authentication with 7-day expiry
- Role-based access control (Admin / Student)
- Rate limiting on auth endpoints (10 req/min)
- Parameterized SQL queries (no injection)
- Helmet.js security headers
- Scores calculated server-side only (never trusted from client)
- Correct answers never sent to frontend

---

## Project Structure

```
Quizora/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── middleware/       (auth, adminOnly, studentOnly, validate, errorHandler)
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── db/migrations/
│   └── server.js
└── frontend/
    └── src/
        ├── api/
        ├── components/       (common, admin, student)
        ├── context/          (AuthContext)
        ├── hooks/            (useAuth, useTimer, useDebounce)
        ├── pages/            (auth, admin, student)
        └── routes/           (ProtectedRoute, AdminRoute)
```
