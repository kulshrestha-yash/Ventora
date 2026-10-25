import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { connectDatabase, User, Idea } from './database.js'

const app = express()
const PORT = process.env.PORT || 5001
const JWT_SECRET = process.env.JWT_SECRET

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1
  res.status(connected ? 200 : 503).json({ ok: connected, db: connected ? 'connected' : 'disconnected' })
})

function makeToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

async function requireAuth(req, res, next) {
  let userId
  try {
    const token = req.headers.authorization?.split(' ')[1]
    userId = jwt.verify(token || '', JWT_SECRET).userId
  } catch {
    return res.status(401).json({ error: 'Please log in again.' })
  }
  const user = await User.findById(userId).select('role')
  if (!user) return res.status(401).json({ error: 'Please log in again.' })
  req.role = user.role
  req.userId = user._id
  next()
}

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body || {}
  const cleanName = typeof name === 'string' ? name.trim() : ''
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (!cleanName || !cleanEmail || typeof password !== 'string' || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || password.length < 8) {
    return res.status(400).json({ error: 'Enter a valid email and a password of at least 8 characters.' })
  }
  if (!['innovator', 'investor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' })
  }

  const exists = await User.findOne({ email: cleanEmail })
  if (exists) {
    return res.status(409).json({ code: 'EMAIL_TAKEN', error: 'An account with this email already exists.' })
  }

  const hashed = await bcrypt.hash(password, 10)
  let user
  try {
    user = await User.create({ name: cleanName, email: cleanEmail, password: hashed, role })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ code: 'EMAIL_TAKEN', error: 'An account with this email already exists.' })
    throw error
  }
  const token = makeToken(user)

  res.status(201).json({
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' })
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() })
  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }

  const token = makeToken(user)
  res.json({
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  })
})

app.get('/api/auth/me', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token.' })

  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET)
    const user = await User.findById(userId).select('-password')
    if (!user) return res.status(401).json({ error: 'User not found.' })
    res.json({ user })
  } catch {
    res.status(401).json({ error: 'Invalid token.' })
  }
})

app.post('/api/ideas', requireAuth, async (req, res) => {
  if (req.role !== 'innovator') return res.status(403).json({ error: 'Innovator account required.' })
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  const pitch = typeof req.body?.pitch === 'string' ? req.body.pitch.trim() : ''
  if (title.length < 3 || title.length > 80 || !pitch || pitch.length > 300) {
    return res.status(400).json({ error: 'Enter a title (3–80 characters) and a pitch (up to 300 characters).' })
  }
  const idea = await Idea.create({ owner: req.userId, title, pitch })
  res.status(201).json({ idea })
})

app.get('/api/ideas', requireAuth, async (req, res) => {
  const filter = req.role === 'innovator' ? { owner: req.userId } : {}
  const ideas = await Idea.find(filter).sort({ createdAt: -1 }).populate('owner', 'name').lean()
  res.json({ ideas })
})

app.use((error, _req, res, _next) => {
  console.error('Request failed:', error.message)
  const status = error instanceof SyntaxError && error.status === 400 ? 400 : 500
  res.status(status).json({ error: status === 400 ? 'Invalid JSON request.' : 'Something went wrong. Please try again.' })
})

async function start() {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in the .env file.')
  await connectDatabase()
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

start().catch(err => {
  console.error('Server startup failed:', err.message)
  process.exit(1)
})
