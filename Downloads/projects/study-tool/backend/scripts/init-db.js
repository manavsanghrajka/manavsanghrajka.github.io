const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const schemaPath = path.join(__dirname, 'schema.sql');

async function initDb() {
  console.log('Parameters: Reading schema from', schemaPath);
  
  // Parse DATABASE_URL manually if needed to handle encoding
  let connectionString = process.env.DATABASE_URL;
  try {
      const match = connectionString.match(/(postgresql:\/\/)([^:]+):([^@]+)@(.+)/);
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

  try {
    await client.connect();
    console.log('Connected to database.');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by statement if needed, or run as whole
    // pg driver query can handle multiple statements usually
    await client.query(schemaSql);
    
    console.log('Schema applied successfully!');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDb();
