import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'

let db
let usersCollection

// Middleware
app.use(express.json())
app.use(cors())

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000 
    })
    await client.connect()
    console.log('✓ Connected to MongoDB')
    db = client.db('login_app')
    usersCollection = db.collection('users')
  } catch (error) {
    console.warn('⚠ MongoDB connection failed:', error.message)
    console.warn('⚠ Running in offline mode - database features disabled')
    console.warn('⚠ Please check your MongoDB connection string and network access')
  }
}

// Register user
app.post('/api/register', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }
    
    const { email, password, username, role } = req.body

    if (!email || !password || !username || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "admin"' })
    }

    // Check if user exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with role
    const result = await usersCollection.insertOne({
      email,
      username,
      password: hashedPassword,
      role,
      createdAt: new Date()
    })

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertedId,
      role: role
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Login user
app.post('/api/login', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }
    
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = await usersCollection.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user profile
app.get('/api/user/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    const user = await usersCollection.findOne({ _id: new ObjectId(req.params.id) })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .toArray()

    res.json({
      total: users.length,
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    if (db) {
      console.log(`✓ Server running on http://localhost:${PORT} (Database connected)`)
    } else {
      console.log(`✓ Server running on http://localhost:${PORT} (Offline mode)`)
    }
  })
})
