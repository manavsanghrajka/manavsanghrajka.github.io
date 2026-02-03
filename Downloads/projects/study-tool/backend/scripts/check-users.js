const { Client } = require('pg');
require('dotenv').config();

async function checkUsers() {
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
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  const res = await client.query('SELECT id, email, "createdAt" FROM "User" ORDER BY "createdAt" DESC');
  
  console.log('\n=== Existing Users ===');
  if (res.rows.length === 0) {
    console.log('No users found in database.');
    console.log('\nYou need to register a new account.');
    console.log('Visit: http://localhost:3001/register');
  } else {
    console.log(`Found ${res.rows.length} user(s):\n`);
    res.rows.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      console.log('');
    });
    console.log('Use any of these emails with their original passwords to login.');
  }
  
  await client.end();
}

checkUsers().catch(console.error);
