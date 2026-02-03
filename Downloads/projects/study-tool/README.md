# Hyperlapse - AI-Powered Adaptive Study Platform

A comprehensive study planning application designed for students preparing for any exam. Get personalized AI-generated study plans, adaptive scheduling, smart flashcards, and performance-based optimization.

## 🚀 Key Features

- ✅ **AI-Powered Planning** - Gemini AI generates personalized study schedules based on your goals
- ✅ **Adaptive Scheduling** - Automatically adjusts your timeline based on performance
- ✅ **Constraint Mapping** - Schedule around your busy times with weekly calendar integration
- ✅ **Smart Flashcards** - Built-in flashcard system with performance-based mastery tracking
- ✅ **Course Library** - Pre-loaded exams (AP, SAT, GRE) or upload your own syllabus
- ✅ **OAuth Authentication** - Sign in with Google or GitHub

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Migrating to Next.js API Routes + Supabase
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (Google, GitHub OAuth)
- **AI**: Google Gemini API

## 🚦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Environment variables configured in `.env` files

### 2. Installation
From the root directory:
```bash
npm run install:all
```

### 3. Running the Application
From the root directory, start both Frontend and Backend concurrently:
```bash
npm run dev
```

- **Frontend (UI)**: [http://localhost:3001](http://localhost:3001)
- **Backend (API)**: [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
study-tool/
├── backend/                # Express API Server
│   ├── lib/
│   │   ├── database-pg.ts  # PostgreSQL operations
│   │   ├── server.ts       # Main API routes
│   │   └── planner/        # Adaptive logic and generation
│   └── scripts/            # Migration & Seed scripts
├── frontend/               # Next.js Application
│   ├── app/                # App Router (Dashboard, Login, Study)
│   └── public/             # Static assets
└── package.json            # Monorepo configuration
```

---

## 📚 How to Add Your Own Exams

You can add any subject by using the **Admin Import** feature.

1. Create a `course.json` file (see `sample_course.json` in root).
2. Format:
```json
{
  "title": "Subject Name",
  "units": [
    {
      "name": "Unit 1",
      "weight": 0.2,
      "topics": [
        {
          "name": "Topic A",
          "flashcards": [{ "front": "Q", "back": "A" }]
        },
        "Topic B"
      ]
    }
  ]
}
```
3. Log in to the application.
4. Go to **Data Import (Admin)** from the dashboard.
5. Paste your JSON and click **Import**.

---

## 🧠 Adaptive Logic

### performance-based Adjustment
- If you score **< 70%** on a quiz or flashcards, the system increases the time allocated for that topic in future sessions.
- Mastery tracking ensures focus remains on your weak areas.

### Automatic Rescheduling
- The tool detects past tasks that haven't been completed.
- When you open your dashboard, missed tasks are automatically pushed to the current day.

---

## ⚖️ License
MIT

