import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const MONGO_URL = 'mongodb://localhost:27017'
const DB_NAME = 'login_app'

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

    // Hash passwords with bcrypt
    const userPasswordHash = await bcrypt.hash('password123', 10)
    const adminPasswordHash = await bcrypt.hash('admin123', 10)

    // Insert test user account
    const userResult = await db.collection('users').insertOne({
      username: 'testuser',
      password: userPasswordHash,
      email: 'testuser@example.com',
      phoneNumber: '09161234567',
      role: 'user',
      firstName: 'Test',
      lastName: 'User',
      badge: 'T001',
      status: 'active',
      verified: true,
      createdAt: new Date()
    })

    console.log(`✓ Created test USER account:`)
    console.log(`  Username: testuser`)
    console.log(`  Password: password123`)
    console.log(`  Email: testuser@example.com`)
    console.log(`  Role: user`)
    console.log(`  ID: ${userResult.insertedId}`)

    // Insert test admin account
    const adminResult = await db.collection('users').insertOne({
      username: 'testadmin',
      password: adminPasswordHash,
      email: 'testadmin@example.com',
      phoneNumber: '09161234568',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Admin',
      status: 'active',
      verified: true,
      createdAt: new Date()
    })

    console.log(`\n✓ Created test ADMIN account:`)
    console.log(`  Username: testadmin`)
    console.log(`  Password: admin123`)
    console.log(`  Email: testadmin@example.com`)
    console.log(`  Role: admin`)
    console.log(`  ID: ${adminResult.insertedId}`)

    console.log('\n✓ Test accounts created successfully!')
    console.log('\nYou can now log in with:')
    console.log('  User:  testuser or testuser@example.com / password123')
    console.log('  Admin: testadmin or testadmin@example.com / admin123')

  } catch (error) {
    console.error('Error creating test accounts:', error)
  } finally {
    await client.close()
  }
}

createTestAccounts()
