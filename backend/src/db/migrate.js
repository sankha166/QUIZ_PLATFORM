const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');
    const files = ['001_initial_schema.sql', '002_notifications_profiles.sql'];
    for (const file of files) {
      const migrationFile = path.join(__dirname, 'migrations', file);
      if (require('fs').existsSync(migrationFile)) {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        await client.query(sql);
        console.log(`  ✓ ${file}`);
      }
    }
    console.log('✅ Migration completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
