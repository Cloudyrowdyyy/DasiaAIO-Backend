import { MongoClient } from 'mongodb'

const MONGO_URL = 'mongodb://localhost:27017'
const DB_NAME = 'login_app'

async function checkDatabase() {
  const client = new MongoClient(MONGO_URL)

  try {
    await client.connect()
    const db = client.db(DB_NAME)

    // List all collections
    const collections = await db.listCollections().toArray()
    console.log('\n📚 Collections:')
    collections.forEach(c => console.log(`  - ${c.name}`))

    // Check users collection
    const usersCount = await db.collection('users').countDocuments()
    console.log(`\n👥 Users collection has ${usersCount} documents`)

    // List all users
    const allUsers = await db.collection('users').find({}).toArray()
    console.log('\n📋 All users:')
    allUsers.forEach(u => {
      console.log(`  - Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`)
    })

    // Check for testuser specifically
    console.log('\n🔍 Testing queries:')
    
    const byUsername = await db.collection('users').findOne({ username: 'testuser' })
    console.log(`  Query by username: ${byUsername ? 'FOUND' : 'NOT FOUND'}`)
    
    const byEmail = await db.collection('users').findOne({ email: 'testuser@example.com' })
    console.log(`  Query by email: ${byEmail ? 'FOUND' : 'NOT FOUND'}`)
    
    const byOr = await db.collection('users').findOne({
      $or: [
        { username: 'testuser' },
        { email: 'testuser@example.com' }
      ]
    })
    console.log(`  Query by $or: ${byOr ? 'FOUND' : 'NOT FOUND'}`)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.close()
  }
}

checkDatabase()
