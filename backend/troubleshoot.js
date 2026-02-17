import dns from 'dns'
import { MongoClient } from 'mongodb'

const MONGODB_URI = 'mongodb://localhost:27017/login_db'

console.log('🔍 MongoDB Connection Troubleshooting\n')

// Step 1: Test DNS Resolution
console.log('Step 1: Testing DNS Resolution...')
dns.resolveSrv('_mongodb._tcp.cluster0.1eml3ch.mongodb.net', (err, records) => {
  if (err) {
    console.log('❌ DNS Resolution FAILED:', err.message)
    console.log('   This means MongoDB Atlas servers cannot be reached')
    console.log('   Possible causes:')
    console.log('   - Network/firewall blocking')
    console.log('   - Connection string hostname is incorrect')
    console.log('   - ISP blocking DNS queries\n')
  } else {
    console.log('✓ DNS Resolution SUCCESS')
    console.log('   Found', records.length, 'MongoDB servers\n')
  }

  // Step 2: Test MongoDB Connection
  console.log('Step 2: Testing MongoDB Connection...')
  testMongoConnection()
})

async function testMongoConnection() {
  try {
    console.log('Connection String:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'))
    
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000
    })

    await client.connect()
    console.log('✓ MongoDB Connection SUCCESS\n')
    
    // Step 3: Test Database Access
    console.log('Step 3: Testing Database Access...')
    const db = client.db('login_db')
    const collections = await db.listCollections().toArray()
    console.log('✓ Database Access SUCCESS')
    console.log('  Collections:', collections.length)
    
    await client.close()
    console.log('\n✅ All checks passed! MongoDB is working.\n')
    process.exit(0)
  } catch (error) {
    console.log('❌ MongoDB Connection FAILED')
    console.log('   Error:', error.message)
    console.log('   Code:', error.code)
    console.log('\n📋 Troubleshooting Steps:')
    console.log('1. Verify your MongoDB URI is correct')
    console.log('2. Check MongoDB Atlas Network Access settings')
    console.log('3. Ensure your IP is whitelisted (0.0.0.0/0 for testing)')
    console.log('4. Check your internet connection')
    console.log('5. Try using MongoDB Compass with your connection string\n')
    process.exit(1)
  }
}
