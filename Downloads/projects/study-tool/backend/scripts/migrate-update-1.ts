import { Pool } from 'pg';
import dotenv from 'dotenv';

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

async function migrate() {
    try {
        const client = await pool.connect();
        console.log("Connected to DB...");

        // 1. Add unitName to Topic
        try {
            await client.query(`ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "unitName" TEXT;`);
            console.log("Added unitName to Topic (if not exists)");
        } catch (e) {
            console.log("Error altering Topic:", e);
        }

        // 2. Create Flashcard Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "Flashcard" (
                "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
                "topicId" TEXT NOT NULL REFERENCES "Topic"("id") ON DELETE CASCADE,
                "front" TEXT NOT NULL,
                "back" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created Flashcard table");

        // 3. Create FlashcardResult Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "FlashcardResult" (
                "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
                "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
                "flashcardId" TEXT NOT NULL REFERENCES "Flashcard"("id") ON DELETE CASCADE,
                "isCorrect" BOOLEAN NOT NULL,
                "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created FlashcardResult table");

        client.release();
        console.log("Migration Complete!");
    } catch (e) {
        console.error("Migration Failed:", e);
    } finally {
        await pool.end();
    }
}

migrate();
