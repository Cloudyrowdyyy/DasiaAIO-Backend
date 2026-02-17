import { MongoClient } from 'mongodb'
import bcryptjs from 'bcryptjs'

const MONGO_URL = 'mongodb://localhost:27017'
const DB_NAME = 'login_app'

async function createUserAccount() {
  const client = new MongoClient(MONGO_URL)

  try {
    await client.connect()
    const db = client.db(DB_NAME)

    // Check if user already exists
    const existing = await db.collection('users').findOne({
      email: 'dkgagaamain@gmail.com'
    })

    if (existing) {
      console.log('User already exists!')
      return
    }

    // Hash password
    const passwordHash = await bcryptjs.hash('december262001', 10)

    // Insert user
    const result = await db.collection('users').insertOne({
      username: 'dkgagaamain',
      password: passwordHash,
      email: 'dkgagaamain@gmail.com',
      phoneNumber: '+63-000-000-0000',
      role: 'user',
      firstName: 'User',
      lastName: 'Account',
      status: 'active',
      verified: true,
      createdAt: new Date()
    })

    console.log('✓ Account created successfully!')
    console.log('  Email: dkgagaamain@gmail.com')
    console.log('  Password: december262001')
    console.log('  Username: dkgagaamain')
    console.log('  ID:', result.insertedId)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.close()
  }
}

createUserAccount()
