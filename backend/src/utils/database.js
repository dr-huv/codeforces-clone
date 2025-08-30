const { Pool } = require('pg');
const mongoose = require('mongoose');
const redis = require('ioredis');
const logger = require('./logger');

// PostgreSQL connection pool
let pgPool = null;

// MongoDB connection
let mongoConnection = null;

// Redis connection
let redisClient = null;

/**
 * Initialize PostgreSQL connection
 */
async function initPostgreSQL() {
  try {
    pgPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('✅ PostgreSQL connected successfully');

    // Create tables if they don't exist
    await createTables();

  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
}

/**
 * Initialize MongoDB connection
 */
async function initMongoDB() {
  try {
    mongoConnection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Initialize Redis connection
 */
async function initRedis() {
  try {
    if (process.env.REDIS_URL) {
      redisClient = new redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });

      redisClient.on('connect', () => {
        logger.info('✅ Redis connected successfully');
      });

      redisClient.on('error', (error) => {
        logger.error('❌ Redis connection error:', error);
      });
    } else {
      logger.warn('⚠️ Redis URL not provided, skipping Redis initialization');
    }
  } catch (error) {
    logger.error('❌ Redis initialization failed:', error);
    throw error;
  }
}

/**
 * Create database tables
 */
async function createTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      rating INTEGER DEFAULT 1200,
      rank_title VARCHAR(50) DEFAULT 'Newbie',
      avatar_url VARCHAR(255),
      country VARCHAR(100),
      organization VARCHAR(255),
      bio TEXT,
      total_problems_solved INTEGER DEFAULT 0,
      contests_participated INTEGER DEFAULT 0,
      max_rating INTEGER DEFAULT 1200,
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createProblemsTable = `
    CREATE TABLE IF NOT EXISTS problems (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT NOT NULL,
      input_format TEXT,
      output_format TEXT,
      constraints TEXT,
      difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
      time_limit INTEGER DEFAULT 2000, -- milliseconds
      memory_limit INTEGER DEFAULT 128, -- MB
      tags TEXT[], -- Array of tags
      created_by INTEGER REFERENCES users(id),
      total_submissions INTEGER DEFAULT 0,
      accepted_submissions INTEGER DEFAULT 0,
      is_public BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createTestCasesTable = `
    CREATE TABLE IF NOT EXISTS test_cases (
      id SERIAL PRIMARY KEY,
      problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
      input_data TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      is_sample BOOLEAN DEFAULT FALSE,
      points INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createContestsTable = `
    CREATE TABLE IF NOT EXISTS contests (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      duration INTEGER NOT NULL, -- minutes
      type VARCHAR(50) DEFAULT 'Regular',
      is_public BOOLEAN DEFAULT TRUE,
      max_participants INTEGER,
      registration_start TIMESTAMP,
      registration_end TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createContestProblemsTable = `
    CREATE TABLE IF NOT EXISTS contest_problems (
      id SERIAL PRIMARY KEY,
      contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
      problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
      points INTEGER DEFAULT 500,
      position INTEGER NOT NULL,
      UNIQUE(contest_id, problem_id),
      UNIQUE(contest_id, position)
    );
  `;

  const createContestParticipantsTable = `
    CREATE TABLE IF NOT EXISTS contest_participants (
      id SERIAL PRIMARY KEY,
      contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER DEFAULT 0,
      penalty INTEGER DEFAULT 0, -- minutes
      rank INTEGER,
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(contest_id, user_id)
    );
  `;

  const createSubmissionsTable = `
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      problem_id INTEGER REFERENCES problems(id),
      contest_id INTEGER REFERENCES contests(id), -- NULL for practice submissions
      language VARCHAR(50) NOT NULL,
      code TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      verdict VARCHAR(100),
      execution_time INTEGER, -- milliseconds
      memory_used INTEGER, -- KB
      score INTEGER DEFAULT 0,
      test_cases_passed INTEGER DEFAULT 0,
      total_test_cases INTEGER DEFAULT 0,
      error_message TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      judged_at TIMESTAMP
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
    CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
    CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems USING GIN(tags);
    CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_contest_id ON submissions(contest_id);
    CREATE INDEX IF NOT EXISTS idx_contest_participants_contest_id ON contest_participants(contest_id);
    CREATE INDEX IF NOT EXISTS idx_contest_participants_score ON contest_participants(score DESC);
  `;

  try {
    await pgPool.query(createUsersTable);
    await pgPool.query(createProblemsTable);
    await pgPool.query(createTestCasesTable);
    await pgPool.query(createContestsTable);
    await pgPool.query(createContestProblemsTable);
    await pgPool.query(createContestParticipantsTable);
    await pgPool.query(createSubmissionsTable);
    await pgPool.query(createIndexes);

    logger.info('✅ Database tables created successfully');
  } catch (error) {
    logger.error('❌ Failed to create database tables:', error);
    throw error;
  }
}

/**
 * Main database connection function
 */
async function connectDB() {
  try {
    await initPostgreSQL();
    await initMongoDB();
    await initRedis();
    logger.info('🎉 All databases connected successfully');
  } catch (error) {
    logger.error('💥 Database connection failed:', error);
    throw error;
  }
}

/**
 * Get PostgreSQL pool
 */
function getPostgreSQLPool() {
  if (!pgPool) {
    throw new Error('PostgreSQL not initialized');
  }
  return pgPool;
}

/**
 * Get MongoDB connection
 */
function getMongoDBConnection() {
  if (!mongoConnection) {
    throw new Error('MongoDB not initialized');
  }
  return mongoConnection;
}

/**
 * Get Redis client
 */
function getRedisClient() {
  return redisClient; // Can be null if not configured
}

/**
 * Close all database connections
 */
async function closeConnections() {
  try {
    if (pgPool) {
      await pgPool.end();
      logger.info('PostgreSQL connection closed');
    }

    if (mongoConnection) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }

    if (redisClient) {
      redisClient.disconnect();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
}

module.exports = {
  connectDB,
  getPostgreSQLPool,
  getMongoDBConnection,
  getRedisClient,
  closeConnections
};
