import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local')
  process.exit(1)
}

const email = 'otolulope@dependifyllc.com'
const password = 'TempPass123!'

async function seedAdmin() {
  const url = new URL(DATABASE_URL)
  const sslmode = url.searchParams.get('sslmode')
  const ssl = sslmode === 'require' ? { rejectUnauthorized: false } : false

  const client = new Client({
    host: url.hostname,
    port: Number(url.port || 5432),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    ssl
  })

  try {
    await client.connect()
    console.log('Connected to database')

    // Ensure admins table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id uuid primary key default gen_random_uuid(),
        email text unique not null,
        password_hash text not null,
        is_superadmin boolean not null default false,
        created_at timestamptz not null default now()
      )
    `)

    const hash = await bcrypt.hash(password, 10)

    await client.query(`
      INSERT INTO admins (email, password_hash, is_superadmin)
      VALUES ($1, $2, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_superadmin = true
    `, [email, hash])

    console.log(`✓ Super admin created/updated: ${email}`)
    console.log(`  Password: ${password}`)
    console.log('  (Change this password after first login!)')

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

seedAdmin()
