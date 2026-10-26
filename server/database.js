import mongoose from 'mongoose'
import dns from 'node:dns'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['innovator', 'investor'], required: true },
  createdAt: { type: Date, default: Date.now }
})

export const User = mongoose.model('User', userSchema)

const ideaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  pitch: { type: String, required: true, trim: true, maxlength: 300 },
  createdAt: { type: Date, default: Date.now }
})

export const Idea = mongoose.model('Idea', ideaSchema)

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set in the .env file.')

  const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(',').map(server => server.trim()).filter(Boolean)
  if (dnsServers?.length) dns.setServers(dnsServers)

  console.log('Connecting to MongoDB...')

  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected successfully.')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}
