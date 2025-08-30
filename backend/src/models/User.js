const { getPostgreSQLPool } = require('../utils/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.rating = userData.rating || 1200;
    this.rankTitle = userData.rank_title || 'Newbie';
    this.avatarUrl = userData.avatar_url;
    this.country = userData.country;
    this.organization = userData.organization;
    this.bio = userData.bio;
    this.totalProblemsSolved = userData.total_problems_solved || 0;
    this.contestsParticipated = userData.contests_participated || 0;
    this.maxRating = userData.max_rating || 1200;
    this.isVerified = userData.is_verified || false;
    this.isActive = userData.is_active !== false;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    const pool = getPostgreSQLPool();
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const query = `
      INSERT INTO users (username, email, password_hash, first_name, last_name, country, organization, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      userData.username,
      userData.email,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      userData.country,
      userData.organization,
      userData.bio
    ];

    try {
      const result = await pool.query(query, values);
      logger.info(`User created: ${userData.username}`);
      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const pool = getPostgreSQLPool();
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const pool = getPostgreSQLPool();
    const query = 'SELECT * FROM users WHERE username = $1 AND is_active = true';

    try {
      const result = await pool.query(query, [username]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const pool = getPostgreSQLPool();
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';

    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  static async authenticate(loginIdentifier, password) {
    const pool = getPostgreSQLPool();

    // Check if login identifier is email or username
    const isEmail = loginIdentifier.includes('@');
    const field = isEmail ? 'email' : 'username';

    const query = `SELECT * FROM users WHERE ${field} = $1 AND is_active = true`;

    try {
      const result = await pool.query(query, [loginIdentifier]);
      const userData = result.rows[0];

      if (!userData) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      if (!isValidPassword) {
        return null;
      }

      logger.info(`User authenticated: ${userData.username}`);
      return new User(userData);
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken() {
    return jwt.sign(
      { 
        id: this.id, 
        username: this.username, 
        email: this.email 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
      }
    );
  }

  /**
   * Update user profile
   */
  async update(updateData) {
    const pool = getPostgreSQLPool();
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic query based on provided fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        const dbField = this.camelToSnake(key);
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    values.push(this.id);

    try {
      const result = await pool.query(query, values);
      const updatedUser = new User(result.rows[0]);
      logger.info(`User updated: ${this.username}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user rating
   */
  async updateRating(newRating) {
    const pool = getPostgreSQLPool();

    const rankTitle = this.getRankTitle(newRating);
    const maxRating = Math.max(this.maxRating, newRating);

    const query = `
      UPDATE users 
      SET rating = $1, rank_title = $2, max_rating = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [newRating, rankTitle, maxRating, this.id]);
      const updatedUser = new User(result.rows[0]);
      logger.info(`User rating updated: ${this.username} -> ${newRating}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user rating:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(limit = 100, offset = 0) {
    const pool = getPostgreSQLPool();

    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY rating DESC) as rank,
        id, username, rating, rank_title, total_problems_solved, 
        contests_participated, country, avatar_url
      FROM users 
      WHERE is_active = true 
      ORDER BY rating DESC 
      LIMIT $1 OFFSET $2
    `;

    try {
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getStatistics() {
    const pool = getPostgreSQLPool();

    const query = `
      SELECT 
        COUNT(CASE WHEN s.status = 'Accepted' THEN 1 END) as accepted_submissions,
        COUNT(*) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.status = 'Accepted' THEN s.problem_id END) as problems_solved,
        AVG(CASE WHEN s.status = 'Accepted' THEN s.execution_time END) as avg_execution_time
      FROM submissions s
      WHERE s.user_id = $1
    `;

    try {
      const result = await pool.query(query, [this.id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting user statistics:', error);
      throw error;
    }
  }

  /**
   * Helper method to convert camelCase to snake_case
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Get rank title based on rating
   */
  getRankTitle(rating) {
    if (rating >= 3000) return 'Legendary Grandmaster';
    if (rating >= 2600) return 'International Grandmaster';
    if (rating >= 2400) return 'Grandmaster';
    if (rating >= 2300) return 'International Master';
    if (rating >= 2100) return 'Master';
    if (rating >= 1900) return 'Candidate Master';
    if (rating >= 1600) return 'Expert';
    if (rating >= 1400) return 'Specialist';
    if (rating >= 1200) return 'Pupil';
    return 'Newbie';
  }

  /**
   * Sanitize user data for API response
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      rating: this.rating,
      rankTitle: this.rankTitle,
      avatarUrl: this.avatarUrl,
      country: this.country,
      organization: this.organization,
      bio: this.bio,
      totalProblemsSolved: this.totalProblemsSolved,
      contestsParticipated: this.contestsParticipated,
      maxRating: this.maxRating,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;
