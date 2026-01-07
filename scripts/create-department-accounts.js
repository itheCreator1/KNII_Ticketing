require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Department accounts to create
// WARNING: These are temporary passwords - users MUST change on first login
const DEPARTMENT_ACCOUNTS = [
  {
    username: 'dept_it_support',
    email: 'it.support@knii.local',
    password: 'ChangeMe2026!IT',
    department: 'IT Support'
  },
  {
    username: 'dept_general_support',
    email: 'general.support@knii.local',
    password: 'ChangeMe2026!GS',
    department: 'General Support'
  },
  {
    username: 'dept_hr',
    email: 'hr@knii.local',
    password: 'ChangeMe2026!HR',
    department: 'Human Resources'
  },
  {
    username: 'dept_finance',
    email: 'finance@knii.local',
    password: 'ChangeMe2026!FIN',
    department: 'Finance'
  },
  {
    username: 'dept_facilities',
    email: 'facilities@knii.local',
    password: 'ChangeMe2026!FAC',
    department: 'Facilities'
  }
];

async function createDepartmentAccounts() {
  const client = await pool.connect();

  try {
    console.log('Creating department accounts...\n');

    await client.query('BEGIN');

    let created = 0;
    let skipped = 0;

    for (const account of DEPARTMENT_ACCOUNTS) {
      // Check if account already exists
      const existingUser = await client.query(
        'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
        [account.username, account.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`⏭️  SKIPPED: ${account.username} (${account.email}) - already exists`);
        skipped++;
        continue;
      }

      // Hash password
      const password_hash = await bcrypt.hash(account.password, 10);

      // Create user
      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, role, status`,
        [account.username, account.email, password_hash, 'department', 'active']
      );

      const user = result.rows[0];

      console.log(`✅ CREATED: ${user.username} (${user.email})`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Department: ${account.department}`);
      console.log(`   - Temp Password: ${account.password} (MUST CHANGE ON FIRST LOGIN)\n`);

      created++;
    }

    await client.query('COMMIT');

    console.log('\n=== Summary ===');
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${DEPARTMENT_ACCOUNTS.length}`);

    if (created > 0) {
      console.log('\n⚠️  SECURITY WARNING:');
      console.log('All accounts use temporary passwords starting with "ChangeMe2026!"');
      console.log('Users MUST change passwords on first login for security.');
    }

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Failed to create department accounts:', error.message);
    console.error('Stack:', error.stack);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

createDepartmentAccounts();
