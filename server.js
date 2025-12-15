import express from 'express'
import cors from 'cors'
import { Client } from 'pg'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()
if (!process.env.DATABASE_URL) {
  try { dotenv.config({ path: '.env.local' }) } catch {}
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())
app.use(cors())

const DATABASE_URL = process.env.DATABASE_URL || ''
const JWT_SECRET = process.env.JWT_SECRET || 'change-me'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const BREVO_SMTP_LOGIN = process.env.BREVO_SMTP_LOGIN || ''
const BREVO_SMTP_PASSWORD = process.env.BREVO_SMTP_PASSWORD || ''
const SMTP_FROM = process.env.SMTP_FROM || 'Digital Skills Training <noreply@dependifyllc.com>'

function cfg(url) {
  const u = new URL(url)
  const sslmode = u.searchParams.get('sslmode')
  const ssl = sslmode === 'require' ? { rejectUnauthorized: false } : false
  return { host: u.hostname, port: Number(u.port || 5432), user: u.username, password: u.password, database: u.pathname.replace('/', ''), ssl }
}

async function db() {
  const c = new Client(cfg(DATABASE_URL))
  await c.connect()
  return c
}

async function ensureSchema() {
  const c = await db()
  await c.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
  await c.query('CREATE TABLE IF NOT EXISTS admins (id uuid primary key default gen_random_uuid(), email text unique not null, password_hash text not null, created_at timestamptz not null default now())')
  await c.query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_superadmin boolean not null default false')
  await c.query('CREATE TABLE IF NOT EXISTS registrations (id uuid primary key default gen_random_uuid(), full_name text not null, email text not null, phone text not null, organization text, job_title text, street_address text, city text, country text, heard_about_us text, future_interests text[] default array[]::text[], verification_token text, verified boolean not null default false, verified_at timestamptz, created_at timestamptz not null default now())')
  await c.end()
}

function auth(req, res, next) {
  const h = req.headers.authorization || ''
  const t = h.startsWith('Bearer ') ? h.slice(7) : ''
  try { const p = jwt.verify(t, JWT_SECRET); req.user = p; next() } catch { res.status(401).json({ error: 'unauthorized' }) }
}

app.get('/health', (req, res) => { res.json({ ok: true }) })

app.post('/api/register', async (req, res) => {
  try {
    const token = crypto.randomUUID()
    const c = await db()
    const r = await c.query('insert into registrations (full_name,email,phone,organization,job_title,street_address,city,country,heard_about_us,future_interests,verification_token,verified) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false) returning id', [req.body.fullName, req.body.email, req.body.phone, req.body.organization || null, req.body.jobTitle || null, req.body.streetAddress || null, req.body.city || null, req.body.country || null, req.body.heardAboutUs || null, Array.isArray(req.body.futureInterests) ? req.body.futureInterests : [], token])
    await c.end()

    const transporter = nodemailer.createTransport({ host: 'smtp-relay.brevo.com', port: 587, secure: false, auth: { user: BREVO_SMTP_LOGIN, pass: BREVO_SMTP_PASSWORD } })
    const link = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`
    let emailSent = false
    try {
      if (BREVO_SMTP_LOGIN && BREVO_SMTP_PASSWORD) {
        await transporter.sendMail({ from: SMTP_FROM, to: req.body.email, subject: 'Verify Your Email - Digital Skills Mastery Course', html: `<p>Hello ${req.body.fullName}</p><p>Please verify your email: <a href=\"${link}\">Verify</a></p>` })
        emailSent = true
      }
    } catch (e) {
      emailSent = false
    }

    res.json({ id: r.rows[0].id, emailSent, verificationLink: emailSent ? undefined : link })
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.post('/api/verify-email', async (req, res) => {
  try {
    const token = String(req.body.token || '')
    const c = await db()
    const f = await c.query('select id, verified from registrations where verification_token = $1', [token])
    if (!f.rows[0]) { await c.end(); return res.status(400).json({ error: 'invalid token' }) }
    if (f.rows[0].verified) { await c.end(); return res.json({ success: true }) }
    await c.query('update registrations set verified = true, verified_at = now(), verification_token = null where id = $1', [f.rows[0].id])
    await c.end()
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.post('/api/admin/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase()
    const password = String(req.body.password || '')
    const c = await db()
    const f = await c.query('select id, password_hash, is_superadmin from admins where email = $1', [email])
    await c.end()
    if (!f.rows[0]) return res.status(401).json({ error: 'invalid credentials' })
    const ok = await bcrypt.compare(password, f.rows[0].password_hash)
    if (!ok) return res.status(401).json({ error: 'invalid credentials' })
    const t = jwt.sign({ sub: f.rows[0].id, role: 'admin', super: !!f.rows[0].is_superadmin }, JWT_SECRET, { expiresIn: '2h' })
    res.json({ token: t, isSuperAdmin: !!f.rows[0].is_superadmin })
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.get('/api/registrations', auth, async (req, res) => {
  try {
    const c = await db()
    const r = await c.query('select * from registrations order by created_at desc')
    await c.end()
    res.json(r.rows)
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.post('/api/registrations', auth, async (req, res) => {
  try {
    const payload = req.user || {}
    if (!payload.super) return res.status(403).json({ error: 'forbidden' })
    const token = crypto.randomUUID()
    const c = await db()
    const r = await c.query('insert into registrations (full_name,email,phone,organization,job_title,street_address,city,country,heard_about_us,future_interests,verification_token,verified) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false) returning *', [req.body.full_name, req.body.email, req.body.phone, req.body.organization || null, req.body.job_title || null, req.body.street_address || null, req.body.city || null, req.body.country || null, req.body.heard_about_us || null, Array.isArray(req.body.future_interests) ? req.body.future_interests : [], token])
    await c.end()
    res.json(r.rows[0])
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.put('/api/registrations/:id', auth, async (req, res) => {
  try {
    const payload = req.user || {}
    if (!payload.super) return res.status(403).json({ error: 'forbidden' })
    const id = String(req.params.id)
    const c = await db()
    const r = await c.query('update registrations set full_name=$1, email=$2, phone=$3, organization=$4, job_title=$5, street_address=$6, city=$7, country=$8, heard_about_us=$9, future_interests=$10 where id=$11 returning *', [req.body.full_name, req.body.email, req.body.phone, req.body.organization || null, req.body.job_title || null, req.body.street_address || null, req.body.city || null, req.body.country || null, req.body.heard_about_us || null, Array.isArray(req.body.future_interests) ? req.body.future_interests : [], id])
    await c.end()
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' })
    res.json(r.rows[0])
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.delete('/api/registrations/:id', auth, async (req, res) => {
  try {
    const payload = req.user || {}
    if (!payload.super) return res.status(403).json({ error: 'forbidden' })
    const id = String(req.params.id)
    const c = await db()
    const r = await c.query('delete from registrations where id=$1', [id])
    await c.end()
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.get('/api/admins', auth, async (req, res) => {
  try {
    const payload = req.user || {}
    if (!payload.super) return res.status(403).json({ error: 'forbidden' })
    const c = await db()
    const r = await c.query('select id, email, is_superadmin, created_at from admins order by created_at desc')
    await c.end()
    res.json(r.rows)
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.put('/api/admin/:id', auth, async (req, res) => {
  try {
    const payload = req.user || {}
    if (!payload.super) return res.status(403).json({ error: 'forbidden' })
    const id = String(req.params.id)
    const email = req.body.email ? String(req.body.email).toLowerCase() : undefined
    const password = req.body.password ? String(req.body.password) : undefined
    if (!email && !password) return res.status(400).json({ error: 'no changes' })
    const c = await db()
    let updated
    if (email && password) {
      const hash = await bcrypt.hash(password, 10)
      updated = await c.query('update admins set email=$1, password_hash=$2 where id=$3 returning id, email, is_superadmin, created_at', [email, hash, id])
    } else if (email) {
      updated = await c.query('update admins set email=$1 where id=$2 returning id, email, is_superadmin, created_at', [email, id])
    } else if (password) {
      const hash = await bcrypt.hash(password, 10)
      updated = await c.query('update admins set password_hash=$1 where id=$2 returning id, email, is_superadmin, created_at', [hash, id])
    }
    await c.end()
    if (!updated.rows[0]) return res.status(404).json({ error: 'not found' })
    res.json(updated.rows[0])
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.delete('/api/admin/:id', auth, async (req, res) => {
  try {
    const payload = req.user || {}
    if (!payload.super) return res.status(403).json({ error: 'forbidden' })
    const id = String(req.params.id)
    if (payload.sub === id) return res.status(400).json({ error: 'cannot delete self' })
    const c = await db()
    await c.query('delete from admins where id=$1', [id])
    await c.end()
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.post('/api/admin/seed', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase()
    const password = String(req.body.password || '')
    if (!email || !password) return res.status(400).json({ error: 'missing email or password' })
    const hash = await bcrypt.hash(password, 10)
    const c = await db()
    const isSuper = email === 'otolulope@dependifyllc.com'
    await c.query('insert into admins (email, password_hash, is_superadmin) values ($1,$2,$3) on conflict (email) do update set password_hash = EXCLUDED.password_hash, is_superadmin = EXCLUDED.is_superadmin', [email, hash, isSuper])
    await c.end()
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.put('/api/admin/change-password', auth, async (req, res) => {
  try {
    const payload = req.user || {}
    const currentPassword = String(req.body.currentPassword || '')
    const newPassword = String(req.body.newPassword || '')
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'missing current or new password' })
    const c = await db()
    const f = await c.query('select password_hash from admins where id = $1', [payload.sub])
    if (!f.rows[0]) { await c.end(); return res.status(404).json({ error: 'admin not found' }) }
    const ok = await bcrypt.compare(currentPassword, f.rows[0].password_hash)
    if (!ok) { await c.end(); return res.status(401).json({ error: 'current password is incorrect' }) }
    const hash = await bcrypt.hash(newPassword, 10)
    await c.query('update admins set password_hash = $1 where id = $2', [hash, payload.sub])
    await c.end()
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.post('/api/admin/grant', auth, async (req, res) => {
  try {
    const payload = req.user || {}
    if (!payload.super) return res.status(403).json({ error: 'forbidden' })
    const email = String(req.body.email || '').toLowerCase()
    const password = String(req.body.password || '')
    if (!email || !password) return res.status(400).json({ error: 'missing email or password' })
    const hash = await bcrypt.hash(password, 10)
    const c = await db()
    await c.query('insert into admins (email, password_hash, is_superadmin) values ($1,$2,false) on conflict (email) do update set password_hash = EXCLUDED.password_hash', [email, hash])
    await c.end()
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

ensureSchema().then(() => {
  const port = process.env.PORT || 3000
  app.listen(port, () => {})
})

