import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const COLLECTIONS = ['users', 'ideas', 'tokenLedger', 'connectionRequests', 'conversations', 'messages', 'savedIdeas']

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected' })
})

app.post('/api/sync/:collection', async (req, res) => {
  const { collection } = req.params
  if (!COLLECTIONS.includes(collection)) return res.status(400).json({ ok: false, error: 'Unknown collection' })
  try {
    const col = mongoose.connection.collection(collection)
    const { op, docs = [], id } = req.body
    if (op === 'upsert' && docs.length) {
      await col.bulkWrite(
        docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }))
      )
    } else if (op === 'remove' && id) {
      await col.deleteOne({ _id: id })
    }
    res.json({ ok: true })
  } catch (e) {
    console.error('sync error:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT, () => console.log(`Server on http://localhost:${process.env.PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
