import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDatabase, User } from './database.js'

const app = express()
const PORT = process.env.PORT || 5001
const JWT_SECRET = process.env.JWT_SECRET

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: 'connected' })
})

function makeToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' })
  }
  if (!['innovator', 'investor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' })
  }

  const exists = await User.findOne({ email })
  if (exists) {
    return res.status(409).json({ code: 'EMAIL_TAKEN', error: 'An account with this email already exists.' })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hashed, role })
  const token = makeToken(user._id)

  res.status(201).json({
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }

  const token = makeToken(user._id)
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

async function start() {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in the .env file.')
  await connectDatabase()
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

start().catch(err => {
  console.error('Server startup failed:', err.message)
  process.exit(1)
})
