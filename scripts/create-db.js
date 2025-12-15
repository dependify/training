import { Client } from 'pg'

function parseDbUrl(dbUrl) {
  const url = new URL(dbUrl)
  const database = url.pathname.replace('/', '')
  const sslmode = url.searchParams.get('sslmode')
  const ssl = sslmode === 'require' ? { rejectUnauthorized: false } : false
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: url.username,
    password: url.password,
    database,
    ssl,
    original: dbUrl,
  }
}

async function ensureDatabase(dbUrl) {
  const cfg = parseDbUrl(dbUrl)
  try {
    const client = new Client({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: cfg.database, ssl: cfg.ssl })
    await client.connect()
    await client.end()
    return
  } catch (e) {
    if (String(e.message).includes('database') && String(e.message).includes('does not exist')) {
      const admin = new Client({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: 'postgres', ssl: cfg.ssl })
      await admin.connect()
      await admin.query(`CREATE DATABASE ${JSON.stringify(cfg.database).replace(/"/g, '')}`)
      await admin.end()
      return
    }
    throw e
  }
}

async function ensureExtensions(dbUrl) {
  const cfg = parseDbUrl(dbUrl)
  const client = new Client({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: cfg.database, ssl: cfg.ssl })
  await client.connect()
  await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
  await client.end()
}

async function main() {
  const dbUrl = process.argv[2]
  if (!dbUrl) {
    console.error('Usage: node scripts/create-db.js <postgres://...>')
    process.exit(1)
  }
  await ensureDatabase(dbUrl)
  await ensureExtensions(dbUrl)
  console.log('Database ensured and extensions set')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

