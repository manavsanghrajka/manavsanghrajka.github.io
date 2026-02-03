-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "vibe_persona" TEXT DEFAULT 'professional', -- 'roast', 'eli5', 'professional'
    "daily_capacity" INTEGER DEFAULT 60, -- minutes per day
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- EXAMS TABLE
CREATE TABLE IF NOT EXISTS "Exam" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE, -- null = global, set = private to user
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "name") -- Allow same name for different users, unique per user
);

-- TOPICS TABLE
CREATE TABLE IF NOT EXISTS "Topic" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "examId" TEXT NOT NULL REFERENCES "Exam"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "unitName" TEXT, -- logical grouping
    "description" TEXT,
    "summary" TEXT, -- Full study content summary
    "keyPoints" JSONB DEFAULT '[]', -- Array of key points
    "examples" JSONB DEFAULT '[]', -- Array of examples
    "difficulty" INTEGER DEFAULT 3,
    "weight" DOUBLE PRECISION DEFAULT 1.0,
    "order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("examId", "name")
);

-- RESOURCES TABLE
CREATE TABLE IF NOT EXISTS "Resource" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "topicId" TEXT NOT NULL REFERENCES "Topic"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "filePath" TEXT,
    "order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- STUDY PLANS TABLE
CREATE TABLE IF NOT EXISTS "StudyPlan" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "examId" TEXT NOT NULL REFERENCES "Exam"("id"),
    "examDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "minutesPerDay" INTEGER DEFAULT 60,
    "restDays" TEXT DEFAULT '[0]',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- DAILY TASKS TABLE
CREATE TABLE IF NOT EXISTS "DailyTask" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "studyPlanId" TEXT NOT NULL REFERENCES "StudyPlan"("id") ON DELETE CASCADE,
    "topicId" TEXT REFERENCES "Topic"("id") ON DELETE SET NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "order" INTEGER DEFAULT 0,
    "completed" BOOLEAN DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "resources" TEXT, -- JSON string
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- QUIZ RESULTS TABLE
CREATE TABLE IF NOT EXISTS "QuizResult" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "topicId" TEXT REFERENCES "Topic"("id") ON DELETE SET NULL,
    "studyPlanId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "questionsTotal" INTEGER DEFAULT 0,
    "questionsCorrect" INTEGER DEFAULT 0,
    "timeSpentSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- TOPIC MASTERY TABLE
CREATE TABLE IF NOT EXISTS "TopicMastery" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "masteryScore" DOUBLE PRECISION DEFAULT 0.0,
    "lastPracticed" TIMESTAMP(3),
    "practiceCount" INTEGER DEFAULT 0,
    "averageScore" DOUBLE PRECISION DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "topicId")
);

-- FLASHCARDS TABLE (with Leitner System)
CREATE TABLE IF NOT EXISTS "Flashcard" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "topicId" TEXT NOT NULL REFERENCES "Topic"("id") ON DELETE CASCADE,
    "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE, -- Owner for personalized cards
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "leitner_box" INTEGER DEFAULT 1, -- Box 1-5 for spaced repetition
    "next_review_date" DATE DEFAULT CURRENT_DATE, -- When to review next
    "review_count" INTEGER DEFAULT 0, -- Total times reviewed
    "correct_count" INTEGER DEFAULT 0, -- Times answered correctly
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- FLASHCARD RESULTS TABLE
CREATE TABLE IF NOT EXISTS "FlashcardResult" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "flashcardId" TEXT NOT NULL REFERENCES "Flashcard"("id") ON DELETE CASCADE,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "topicId" TEXT NOT NULL REFERENCES "Topic"("id") ON DELETE CASCADE,
    "question" TEXT NOT NULL,
    "options" TEXT, -- JSON array of answer options
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" INTEGER DEFAULT 3,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
