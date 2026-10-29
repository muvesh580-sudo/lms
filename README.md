# LMS — Learning Management System

A MERN-stack learning platform: students browse and enroll in courses (free or paid via Razorpay)
and watch lectures; instructors manage their own courses and lectures; admins manage users,
courses and payments.

| Part | Stack |
| --- | --- |
| `client/` | React 19, TypeScript, Vite, Redux Toolkit, React Router, Tailwind CSS v4 |
| `server/` | Node.js, Express 4, MongoDB (Mongoose 8), JWT auth, Multer uploads, Razorpay |

## Features

- Registration and login (bcrypt-hashed passwords, JWT); roles: `student`, `instructor`, `admin`
- Course catalogue with search, category/level filters and pagination
- Course pages with a public outline; preview lectures are playable by anyone
- Enrollment: free courses instantly, paid courses through Razorpay checkout
- Lecture player and downloadable resources, only for enrolled users, the instructor or an admin
- Ratings and reviews from enrolled students
- REST API for instructors (course/lecture/resource CRUD) and admins (users, all courses, payments)

## Getting started

Requirements: Node.js 20+ and a MongoDB server (local or Atlas).

```bash
# 1. Backend
cd server
cp .env.example .env        # then edit the values
npm install
npm run create-admin        # optional: creates the first admin from ADMIN_* in .env
npm run seed:demo           # optional: demo instructor, student and two courses
npm run dev                 # http://localhost:5000

# 2. Frontend (in a second terminal)
cd client
cp .env.example .env        # only needed if the API is not on http://localhost:5000
npm install
npm run dev                 # http://localhost:5173
```

The demo seed creates `instructor@demo.test` and `student@demo.test`, both with the password from
`DEMO_PASSWORD` (default `demo1234`). It refuses to run when `NODE_ENV=production`.

### Environment variables (`server/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | no | Token lifetime, default `7d` |
| `CLIENT_URL` | no | Allowed CORS origin(s), comma separated; default `http://localhost:5173` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for paid courses | Razorpay API keys (use test keys locally) |
| `PORT` / `NODE_ENV` | no | Default `5000` / unset |

Never commit `server/.env`; it is git-ignored.

## Scripts

| Location | Command | What it does |
| --- | --- | --- |
| server | `npm run dev` / `npm start` | Start the API (with / without auto-reload) |
| server | `npm test` | API integration tests (in-memory MongoDB, no setup needed) |
| server | `npm run create-admin` | Create or promote an admin account |
| server | `npm run seed:demo` | Insert demo data (non-destructive) |
| client | `npm run dev` | Vite dev server |
| client | `npm run build` | Type-check and production build |
| client | `npm run lint` | ESLint |

## Security notes

- Roles are never taken from registration or profile requests; admins change roles.
- Authorization is enforced by the API; the client route guards are only for navigation.
- Lecture videos and materials are not publicly served. The API returns short-lived, per-lecture
  media links only to users allowed to watch.
- Payment verification checks the Razorpay signature *and* that the order belongs to the user;
  each order can be redeemed once.
- Helmet security headers, restricted CORS, and rate limiting on login/registration.

## Project status

Implemented in the UI: browsing, course pages, enrollment, My Courses, lecture viewing, ratings.
The instructor and admin dashboards (course/lecture editors, user and payment management) exist in
the API but their pages are still placeholders.
