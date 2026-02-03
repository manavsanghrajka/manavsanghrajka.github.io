import { importCourseFromJSON } from '../lib/database-pg';
import { syllabus } from '../lib/planner/syllabi/ap-biology';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// We need to mock the pool usage or ensure database-pg uses the env vars correctly 
// when imported in script context. database-pg initializes pool on import.

async function seed() {
    console.log("Seeding AP Biology...");
    
    // Transform syllabus to match import format if needed. 
    // They are almost identical.
    // syllabus.units elements have 'unit' number property, which import ignores/allows.
    // topics are string arrays.
    
    try {
        const result = await importCourseFromJSON(syllabus);
        console.log("Seeding successful:", result);
    } catch (e) {
        console.error("Seeding failed:", e);
    }
    
    // We need to close the pool to exit
    // But database-pg pool is not exported as "closable" easily unless we access `pool`.
    // We can export pool from database-pg to close it.
    
    // Workaround: Force exit after short delay
    setTimeout(() => process.exit(0), 1000);
}

seed();
