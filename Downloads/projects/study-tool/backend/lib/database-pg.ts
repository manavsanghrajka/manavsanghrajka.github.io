import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { randomBytes } from 'crypto';

dotenv.config();

// Helper to handle password encoding if needed (reuses logic)
function getConnectionConfig() {
  let connectionString = process.env.DATABASE_URL;
  try {
      const match = connectionString?.match(/(postgresql:\/\/)([^:]+):([^@]+)@(.+)/);
      if (match) {
        const password = match[3];
        if (password.includes('#') && decodeURIComponent(password) === password) {
             const encoded = encodeURIComponent(password);
             connectionString = `${match[1]}${match[2]}:${encoded}@${match[4]}`;
        }
      }
  } catch(e) {}
  return { connectionString, ssl: { rejectUnauthorized: false } };
}

const pool = new Pool(getConnectionConfig());

export { pool };

/* =====================
   USER OPERATIONS
   ===================== */

export async function getUserByEmail(email: string) {
  const res = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
  return res.rows[0] || null;
}

export async function getUserById(id: string) {
  const res = await pool.query('SELECT * FROM "User" WHERE id = $1', [id]);
  return res.rows[0] || null;
}

export async function createUser(email: string, passwordHash: string) {
  const res = await pool.query(`
    INSERT INTO "User" (email, "passwordHash")
    VALUES ($1, $2)
    RETURNING *
  `, [email, passwordHash]);
  return res.rows[0];
}

/* =====================
   EXAM & TOPIC OPERATIONS
   ===================== */

export async function getExamByName(name: string) {
  const res = await pool.query('SELECT * FROM "Exam" WHERE name = $1', [name]);
  const exam = res.rows[0];
  
  if (exam) {
    const topicsRes = await pool.query('SELECT * FROM "Topic" WHERE "examId" = $1 ORDER BY "order" ASC', [exam.id]);
    exam.topics = topicsRes.rows;
  }
  
  return exam || null;
}

export async function getAllExams() {
  const res = await pool.query('SELECT * FROM "Exam"');
  const exams = res.rows;
  
  for (const exam of exams) {
    const topicsRes = await pool.query('SELECT * FROM "Topic" WHERE "examId" = $1 ORDER BY "order" ASC', [exam.id]);
    exam.topics = topicsRes.rows;
  }
  
  return exams;
}

/* =====================
   ADMIN - EXAM CRUD
   ===================== */

export async function createExam(name: string, description: string | null) {
  const res = await pool.query(`
    INSERT INTO "Exam" (name, description)
    VALUES ($1, $2)
    RETURNING *
  `, [name, description]);
  return res.rows[0];
}

export async function updateExam(id: string, name: string, description: string | null) {
  const res = await pool.query(`
    UPDATE "Exam"
    SET name = $1, description = $2, "updatedAt" = NOW()
    WHERE id = $3
    RETURNING *
  `, [name, description, id]);
  return res.rows[0];
}

export async function deleteExam(id: string) {
  await pool.query('DELETE FROM "Exam" WHERE id = $1', [id]);
}

export async function getAllExamsAdmin() {
  const res = await pool.query('SELECT * FROM "Exam" ORDER BY "createdAt" DESC');
  return res.rows;
}

export async function getTopicsByExam(examId: string) {
  const res = await pool.query('SELECT * FROM "Topic" WHERE "examId" = $1 ORDER BY "order" ASC', [examId]);
  const topics = res.rows;
  
  // Fetch resources for each topic
  for (const topic of topics) {
    const resourcesRes = await pool.query('SELECT * FROM "Resource" WHERE "topicId" = $1 ORDER BY "order" ASC', [topic.id]);
    topic.resources = resourcesRes.rows;
  }
  
  return topics;
}

/* =====================
   STUDY PLAN OPERATIONS
   ===================== */

export async function createStudyPlan(
  userId: string,
  examId: string,
  examDate: Date,
  minutesPerDay: number,
  days: any[]
) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create study plan
    const planRes = await client.query(`
      INSERT INTO "StudyPlan" ("userId", "examId", "examDate", "startDate", "minutesPerDay")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, examId, examDate, new Date(), minutesPerDay]);
    
    const studyPlan = planRes.rows[0];
    
    // Create daily tasks
    for (const day of days) {
      const taskDate = new Date(day.date);
      for (let i = 0; i < day.tasks.length; i++) {
        const task = day.tasks[i];
        await client.query(`
          INSERT INTO "DailyTask" ("studyPlanId", "date", "type", "durationMinutes", "order", "resources")
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          studyPlan.id,
          taskDate,
          task.type.toUpperCase(),
          task.durationMinutes,
          i,
          JSON.stringify(task.resources || [])
        ]);
      }
    }
    
    await client.query('COMMIT');
    return studyPlan;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getActiveStudyPlan(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find plan where exam date is in future
  const planRes = await pool.query(`
    SELECT * FROM "StudyPlan" 
    WHERE "userId" = $1 AND "examDate" >= $2
    ORDER BY "examDate" ASC
    LIMIT 1
  `, [userId, today]);
  
  const plan = planRes.rows[0];
  if (!plan) return null;
  
  // Attach relations
  const examRes = await pool.query('SELECT * FROM "Exam" WHERE id = $1', [plan.examId]);
  plan.exam = examRes.rows[0];
  
  const tasksRes = await pool.query(`
    SELECT t.*, row_to_json(top) as topic 
    FROM "DailyTask" t
    LEFT JOIN "Topic" top ON t."topicId" = top.id
    WHERE "studyPlanId" = $1
    ORDER BY "date" ASC, "order" ASC
  `, [plan.id]);
  
  // Transform task resources from JSON string if needed, though pg usually handles json column
  // Our schema defined resources as TEXT, so we parse it
  plan.dailyTasks = tasksRes.rows.map((t: any) => ({
    ...t,
    resources: t.resources ? JSON.parse(t.resources) : []
  }));
  
  // Also need to fetch topic resources if deeply nested access is required, 
  // but for now basic topic info might suffice or we do a deeper join.
  // The original prisma query included topic resources:
  // include: { topic: { include: { resources: true } } }
  
  // Let's patch the topics with resources
  for (const task of plan.dailyTasks) {
    if (task.topic) {
        const resRes = await pool.query('SELECT * FROM "Resource" WHERE "topicId" = $1', [task.topic.id]);
        task.topic.resources = resRes.rows;
    }
  }

  return plan;
}

export async function getUserStudyPlans(userId: string) {
  const res = await pool.query(`
    SELECT p.*, row_to_json(e) as exam
    FROM "StudyPlan" p
    JOIN "Exam" e ON p."examId" = e.id
    WHERE p."userId" = $1
    ORDER BY p."createdAt" DESC
  `, [userId]);
  
  return res.rows;
}

/* =====================
   QUIZ RESULT OPERATIONS
   ===================== */

export async function saveQuizResult(
  userId: string,
  topicId: string | null,
  studyPlanId: string | null,
  score: number,
  questionsTotal: number,
  questionsCorrect: number
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Save Result
    const res = await client.query(`
      INSERT INTO "QuizResult" ("userId", "topicId", "studyPlanId", "score", "questionsTotal", "questionsCorrect")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, topicId, studyPlanId, score, questionsTotal, questionsCorrect]);
    
    const result = res.rows[0];
    
    // Update mastery
    if (topicId) {
      await updateTopicMastery(client, userId, topicId, score); 
      // Note: we pass client to be part of transaction
    }
    
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getUserQuizResults(userId: string, topicId: string | null = null) {
  let query = `
    SELECT r.*, row_to_json(t) as topic
    FROM "QuizResult" r
    LEFT JOIN "Topic" t ON r."topicId" = t.id
    WHERE r."userId" = $1
  `;
  const params = [userId];
  
  if (topicId) {
    query += ` AND r."topicId" = $2`;
    params.push(topicId);
  }
  
  query += ` ORDER BY r."createdAt" DESC`;
  
  const res = await pool.query(query, params);
  return res.rows;
}

/* =====================
   TOPIC MASTERY OPERATIONS
   ===================== */

// Internal helper that accepts client for transactions
async function updateTopicMastery(client: PoolClient, userId: string, topicId: string, score: number) {
  // Get existing
  const existRes = await client.query('SELECT * FROM "TopicMastery" WHERE "userId" = $1 AND "topicId" = $2', [userId, topicId]);
  const existing = existRes.rows[0];
  
  const masteryScore = score / 100;
  const practiceCount = (existing?.practiceCount || 0) + 1;
  const currentAvg = existing?.averageScore || 0;
  const newAverage = ((currentAvg * (practiceCount - 1)) + masteryScore) / practiceCount;
  
  if (existing) {
    await client.query(`
      UPDATE "TopicMastery"
      SET "masteryScore" = $1, "averageScore" = $2, "practiceCount" = $3, "lastPracticed" = NOW(), "updatedAt" = NOW()
      WHERE id = $4
    `, [newAverage, newAverage, practiceCount, existing.id]);
  } else {
    await client.query(`
      INSERT INTO "TopicMastery" ("userId", "topicId", "masteryScore", "averageScore", "practiceCount", "lastPracticed")
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [userId, topicId, newAverage, newAverage, practiceCount]);
  }
}

// Public export (creates its own client/pool usage)
export async function getTopicMastery(userId: string, topicId: string) {
  const res = await pool.query('SELECT * FROM "TopicMastery" WHERE "userId" = $1 AND "topicId" = $2', [userId, topicId]);
  return res.rows[0] || null;
}

export async function getAllTopicMastery(userId: string, examId: string | null = null) {
  let query = `
    SELECT tm.*, row_to_json(t) as topic
    FROM "TopicMastery" tm
    JOIN "Topic" t ON tm."topicId" = t.id
    WHERE tm."userId" = $1
  `;
  const params = [userId];
  
  if (examId) {
    query += ` AND t."examId" = $2`;
    params.push(examId);
  }
  
  const res = await pool.query(query, params);
  return res.rows;
}

/* =====================
   DAILY TASK OPERATIONS
   ===================== */

export async function markTaskComplete(taskId: string) {
  const res = await pool.query(`
    UPDATE "DailyTask"
    SET completed = true, "completedAt" = NOW()
    WHERE id = $1
    RETURNING *
  `, [taskId]);
  return res.rows[0];
}

export async function getTasksForDate(studyPlanId: string, date: Date) {
    const startOfDay = new Date(date); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(date); endOfDay.setHours(23,59,59,999);
    
    const res = await pool.query(`
        SELECT t.*, row_to_json(top) as topic
        FROM "DailyTask" t
        LEFT JOIN "Topic" top ON t."topicId" = top.id
        WHERE "studyPlanId" = $1 AND "date" >= $2 AND "date" <= $3
        ORDER BY "order" ASC
    `, [studyPlanId, startOfDay, endOfDay]);
    
    
    // Parse resources and attach topic resources
    const tasks = res.rows.map((t: any) => ({
        ...t,
        resources: t.resources ? JSON.parse(t.resources) : []
    }));
    
    for (const task of tasks) {
        if (task.topic) {
            const rRes = await pool.query('SELECT * FROM "Resource" WHERE "topicId" = $1', [task.topic.id]);
            task.topic.resources = rRes.rows;
        }
    }
    
    return tasks;
}

/* =====================
   FLASHCARD OPERATIONS
   ===================== */

export async function createFlashcard(topicId: string, front: string, back: string) {
    const res = await pool.query(`
        INSERT INTO "Flashcard" ("topicId", "front", "back")
        VALUES ($1, $2, $3)
        RETURNING *
    `, [topicId, front, back]);
    return res.rows[0];
}

export async function getFlashcardsForTopic(topicId: string) {
    const res = await pool.query('SELECT * FROM "Flashcard" WHERE "topicId" = $1 ORDER BY "createdAt" ASC', [topicId]);
    return res.rows;
}

export async function saveFlashcardResult(userId: string, flashcardId: string, isCorrect: boolean) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Save Result
        const res = await client.query(`
            INSERT INTO "FlashcardResult" ("userId", "flashcardId", "isCorrect")
            VALUES ($1, $2, $3)
            RETURNING *
        `, [userId, flashcardId, isCorrect]);
        const result = res.rows[0];

        // 2. Get Topic ID
        const fcRes = await client.query('SELECT "topicId" FROM "Flashcard" WHERE id = $1', [flashcardId]);
        const topicId = fcRes.rows[0]?.topicId;

        // 3. Update Mastery
        if (topicId) {
            const score = isCorrect ? 100 : 0;
            // Reusing updateTopicMastery logic but we need to export it or duplicate logic if it's internal
            // It is internal: async function updateTopicMastery(client...
            // I'll call it if I can make it exported or move it up.
            // Since I can't easily move it without big diff, I'll allow myself to duplicate the logic for now 
            // OR I refer to the updateTopicMastery function if it's available in scope. 
            // It is defined in the file.
            await updateTopicMastery(client, userId, topicId, score);
        }
        
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

/* =====================
   COURSE IMPORT OPERATIONS
   ===================== */

export async function importCourseFromJSON(jsonData: any) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Create Exam
        const examRes = await client.query(`
            INSERT INTO "Exam" ("name", "description")
            VALUES ($1, $2)
            ON CONFLICT ("name") DO UPDATE SET "description" = $2, "updatedAt" = NOW()
            RETURNING id
        `, [jsonData.title, jsonData.description || `Course imported via JSON`]);
        const examId = examRes.rows[0].id;
        
        // 2. Iterate Units and Topics
        let order = 0;
        if (jsonData.units && Array.isArray(jsonData.units)) {
            for (const unit of jsonData.units) {
                const unitName = unit.name;
                const weight = unit.weight || 0.1;
                
                if (unit.topics && Array.isArray(unit.topics)) {
                    for (const topicData of unit.topics) {
                        order++;
                        const topicName = typeof topicData === 'string' ? topicData : topicData.name;
                        
                        // Create Topic
                        const topicRes = await client.query(`
                            INSERT INTO "Topic" ("examId", "name", "unitName", "weight", "order")
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT ("examId", "name") DO UPDATE SET 
                                "unitName" = $3,
                                "weight" = $4,
                                "order" = $5,
                                "updatedAt" = NOW()
                            RETURNING id
                        `, [examId, topicName, unitName, weight, order]);
                        const topicId = topicRes.rows[0].id;

                        // Create Flashcards if present in JSON object format
                        if (typeof topicData === 'object' && topicData.flashcards && Array.isArray(topicData.flashcards)) {
                             for (const card of topicData.flashcards) {
                                 await client.query(`
                                     INSERT INTO "Flashcard" ("topicId", "front", "back")
                                     VALUES ($1, $2, $3)
                                 `, [topicId, card.front, card.back]);
                             }
                        }
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        return { examId, message: "Course imported successfully" };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
