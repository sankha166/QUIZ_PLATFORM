const bcrypt = require('bcryptjs');
const path = require('path');
const { query, pool } = require('../../config/db');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create default admin
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    await query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, 'ADMIN', 'active')
       ON CONFLICT (email) DO NOTHING`,
      ['Admin', 'admin@quizplatform.com', adminPassword]
    );
    console.log('✅ Admin user created: admin@quizplatform.com / Admin@123');

    // Create sample categories
    const categories = [
      ['HTML', 'HyperText Markup Language fundamentals'],
      ['CSS', 'Cascading Style Sheets'],
      ['JavaScript', 'JavaScript programming language'],
      ['React', 'React.js library'],
      ['Node.js', 'Node.js runtime'],
      ['Python', 'Python programming language'],
      ['Database', 'Database concepts and SQL'],
      ['Computer Networks', 'Networking fundamentals'],
    ];

    for (const [name, description] of categories) {
      await query(
        `INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [name, description]
      );
    }
    console.log('✅ Sample categories created');

    console.log('🎉 Seeding completed!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
