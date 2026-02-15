import { MongoClient } from 'mongodb'
import crypto from 'crypto'

const MONGO_URL = 'mongodb://localhost:27017'
const DB_NAME = 'guard-firearm-management'

// Simple hash function for demo purposes (use bcrypt in production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function createTestAccounts() {
  const client = new MongoClient(MONGO_URL)

  try {
    await client.connect()
    const db = client.db(DB_NAME)

    // Delete existing test accounts
    await db.collection('users').deleteMany({
      username: { $in: ['testuser', 'testadmin'] }
    })

    console.log('Creating test accounts...')

    // Insert test user account
    const userResult = await db.collection('users').insertOne({
      username: 'testuser',
      password: hashPassword('password123'),
      email: 'testuser@example.com',
      role: 'user',
      firstName: 'Test',
      lastName: 'User',
      badge: 'T001',
      status: 'active',
      createdAt: new Date()
    })

    console.log(`✓ Created test USER account:`)
    console.log(`  Username: testuser`)
    console.log(`  Password: password123`)
    console.log(`  Role: user`)
    console.log(`  ID: ${userResult.insertedId}`)

    // Insert test admin account
    const adminResult = await db.collection('users').insertOne({
      username: 'testadmin',
      password: hashPassword('admin123'),
      email: 'testadmin@example.com',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Admin',
      status: 'active',
      createdAt: new Date()
    })

    console.log(`\n✓ Created test ADMIN account:`)
    console.log(`  Username: testadmin`)
    console.log(`  Password: admin123`)
    console.log(`  Role: admin`)
    console.log(`  ID: ${adminResult.insertedId}`)

    console.log('\n✓ Test accounts created successfully!')
    console.log('\nYou can now log in with:')
    console.log('  User:  testuser / password123')
    console.log('  Admin: testadmin / admin123')

  } catch (error) {
    console.error('Error creating test accounts:', error)
  } finally {
    await client.close()
  }
}

createTestAccounts()
