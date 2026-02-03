/**
 * Migration script to move data from JSON files to PostgreSQL
 * Run this after setting up database with init-db.js
 * 
 * Usage: node scripts/migrate-to-db.js (need to compile or run with proper loader, but we will use plain JS for simplicity or use ts-node with simpler deps)
 * Actually, let's keep it TS but remove Prisma dependency.
 * Usage: npx ts-node scripts/migrate-to-db.ts
 */

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
require('dotenv').config();

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PLANS_FILE = path.join(DATA_DIR, 'plans.json');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');

// Helper to get client
async function getClient() {
  let connectionString = process.env.DATABASE_URL;
  try {
      const match = connectionString!.match(/(postgresql:\/\/)([^:]+):([^@]+)@(.+)/);
      if (match) {
        const password = match[3];
        if (password.includes('#') && decodeURIComponent(password) === password) {
             const encoded = encodeURIComponent(password);
             connectionString = `${match[1]}${match[2]}:${encoded}@${match[4]}`;
        }
      }
  } catch(e) {}

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  return client;
}

async function migrateUsers(client: Client) {
  console.log('Migrating users...');
  
  if (!fs.existsSync(USERS_FILE)) {
    console.log('No users.json found, skipping...');
    return;
  }

  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  
  for (const user of users) {
    try {
      // Upsert user
      await client.query(`
        INSERT INTO "User" ("id", "email", "passwordHash", "createdAt")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("email") DO UPDATE 
        SET "passwordHash" = EXCLUDED."passwordHash", "createdAt" = EXCLUDED."createdAt"
      `, [user.id, user.email, user.passwordHash, new Date(user.createdAt)]);
      
      console.log(`✓ Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`✗ Error migrating user ${user.email}:`, error);
    }
  }
}

async function migrateStudyPlans(client: Client) {
  console.log('Migrating study plans...');
  
  if (!fs.existsSync(PLANS_FILE)) {
    console.log('No plans.json found, skipping...');
    return;
  }

  const plans = JSON.parse(fs.readFileSync(PLANS_FILE, 'utf-8'));
  
  // First, ensure AP Biology exam exists
  let examId;
  const examRes = await client.query(`
    INSERT INTO "Exam" ("name", "description")
    VALUES ($1, $2)
    ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description"
    RETURNING "id"
  `, ['AP Biology', 'Advanced Placement Biology Exam']);
  examId = examRes.rows[0].id;

  for (const plan of plans) {
    try {
      // Create the study plan
      const planRes = await client.query(`
        INSERT INTO "StudyPlan" ("id", "userId", "examId", "examDate", "startDate", "minutesPerDay")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT ("id") DO NOTHING
        RETURNING "id"
      `, [
        plan.id, 
        plan.userId, 
        examId, 
        new Date(plan.examDate), 
        new Date(plan.createdAt), 
        plan.minutesPerDay
      ]);
      
      const studyPlanId = planRes.rows[0]?.id || plan.id;

      // Create daily tasks
      // First delete existing tasks to avoid dupes/ordering issues if re-running
      await client.query(`DELETE FROM "DailyTask" WHERE "studyPlanId" = $1`, [studyPlanId]);

      for (const day of plan.days || []) {
        const taskDate = new Date(day.date);
        
        for (let i = 0; i < day.tasks.length; i++) {
          const task = day.tasks[i];
          
          await client.query(`
            INSERT INTO "DailyTask" ("studyPlanId", "date", "type", "durationMinutes", "order", "resources", "completed")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            studyPlanId,
            taskDate,
            task.type.toUpperCase(),
            task.durationMinutes,
            i,
            JSON.stringify(task.resources || []),
            false
          ]);
        }
      }

      console.log(`✓ Migrated study plan: ${plan.id}`);
    } catch (error) {
      console.error(`✗ Error migrating plan ${plan.id}:`, error);
    }
  }
}

async function migrateQuizResults(client: Client) {
  console.log('Migrating quiz results...');
  
  if (!fs.existsSync(RESULTS_FILE)) {
    console.log('No results.json found, skipping...');
    return;
  }

  const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
  
  for (const result of results) {
    try {
      await client.query(`
        INSERT INTO "QuizResult" ("id", "userId", "studyPlanId", "score", "questionsTotal", "questionsCorrect", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("id") DO NOTHING
      `, [
        result.id,
        result.userId,
        result.planId,
        result.score,
        result.totalQuestions || 0,
        result.questionsAnswered || 0,
        new Date(result.createdAt)
      ]);

      console.log(`✓ Migrated quiz result: ${result.id}`);
    } catch (error) {
      console.error(`✗ Error migrating result ${result.id}:`, error);
    }
  }
}

async function main() {
  let client;
  try {
    console.log('Starting migration from JSON to PostgreSQL (PG Driver)...\n');
    client = await getClient();
    
    await migrateUsers(client);
    await migrateStudyPlans(client);
    await migrateQuizResults(client);
    
    console.log('\n✓ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) await client.end();
  }
}

main();
