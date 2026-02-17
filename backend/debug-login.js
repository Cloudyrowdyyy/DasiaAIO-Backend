import { MongoClient } from 'mongodb'
import bcryptjs from 'bcryptjs'

const MONGO_URL = 'mongodb://localhost:27017'
const DB_NAME = 'login_app'

async function debugLogin() {
  const client = new MongoClient(MONGO_URL)

  try {
    await client.connect()
    const db = client.db(DB_NAME)

    // Check if users exist
    const users = await db.collection('users').find({
      username: { $in: ['testuser', 'testadmin'] }
    }).toArray()

    console.log(`\n📋 Found ${users.length} test accounts:\n`)
    
    for (const user of users) {
      console.log(`User: ${user.username}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Verified: ${user.verified}`)
      console.log(`  Has password: ${!!user.password}`)
      console.log(`  Password hash: ${user.password ? user.password.substring(0, 30) + '...' : 'MISSING'}`)
      
      // Test password verification
      if (user.username === 'testuser') {
        const match = await bcryptjs.compare('password123', user.password)
        console.log(`  Password match (password123): ${match}`)
      }
      if (user.username === 'testadmin') {
        const match = await bcryptjs.compare('admin123', user.password)
        console.log(`  Password match (admin123): ${match}`)
      }
      console.log()
    }

    if (users.length === 0) {
      console.log('❌ No test accounts found! Run create-test-accounts.js first.')
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.close()
  }
}

debugLogin()
