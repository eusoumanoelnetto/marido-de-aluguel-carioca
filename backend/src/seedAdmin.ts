import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Create direct PG connection (bypasses in-memory fallback)
const isLocalDb = process.env.DATABASE_URL?.includes('localhost') ?? false;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

// Simple seed to create or upgrade an admin user.
// Usage (Render shell or local):
//   node dist/seedAdmin.js <email> <password> <name?> <phone?> <cep?>

async function main() {
  const [,, emailArg, passArg, nameArg, phoneArg, cepArg] = process.argv;
  if (!emailArg || !passArg) {
    console.error('Usage: node dist/seedAdmin.js <email> <password> [name] [phone] [cep]');
    process.exit(1);
  }
  const email = String(emailArg).toLowerCase();
  const password = String(passArg);
  const name = nameArg || 'Admin';
  const phone = phoneArg || '';
  const cep = cepArg || '';

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Upsert simplistic: try update first; if zero rows, insert
  const update = await pool.query(
    'UPDATE users SET name=$1, phone=$2, role=$3, cep=$4, password=$5 WHERE email=$6 RETURNING email',
    [name, phone, 'admin', cep, hashedPassword, email]
  );
  if (update.rowCount > 0) {
    console.log('Admin updated:', email);
    process.exit(0);
  }
  const insert = await pool.query(
    'INSERT INTO users (name, email, phone, role, cep, password) VALUES ($1,$2,$3,$4,$5,$6) RETURNING email',
    [name, email, phone, 'admin', cep, hashedPassword]
  );
  if (insert.rowCount > 0) {
    console.log('Admin created:', email);
  } else {
    console.error('Failed to create admin');
    process.exit(2);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(3); })
  .finally(async () => { try { await pool.end(); } catch {} });
