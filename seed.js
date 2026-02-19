// Simple Node.js seeder using pg library
const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:kXgebinlNjUyAMwhaQFUpihblOZYqrIw@dpg-cu2d64hu0jms73836gog-a.oregon-postgres.render.com/railway';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // For Render databases
  },
});

async function seed() {
  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync('seed_dashboard.sql', 'utf8');
    await client.query(sql);

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
