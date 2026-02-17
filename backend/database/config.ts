import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

// First create connection without database to create it if needed
async function ensureDatabaseExists(): Promise<void> {
  try {
    const adminSequelize = new Sequelize(
      'postgres',  // Default postgres database
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        logging: false,
      }
    )

    await adminSequelize.authenticate()
    console.log('✓ Connected to PostgreSQL server')

    // Create database if it doesn't exist
    await adminSequelize.query(`
      CREATE DATABASE "${process.env.DB_NAME || 'login_app'}"
    `).catch((err: any) => {
      if (err.message.includes('already exists')) {
        console.log('✓ Database already exists')
      } else {
        console.log('Note: Could not create database (may already exist)')
      }
    })

    await adminSequelize.close()
  } catch (error: any) {
    console.warn('⚠ Could not ensure database exists:', error.message)
  }
}

// Ensure database exists before creating main connection
await ensureDatabaseExists()

const sequelize = new Sequelize(
  process.env.DB_NAME || 'login_app',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
)

export default sequelize
