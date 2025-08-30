const { getPostgreSQLPool } = require('../utils/database');
const logger = require('../utils/logger');

class Problem {
  constructor(problemData) {
    this.id = problemData.id;
    this.title = problemData.title;
    this.slug = problemData.slug;
    this.description = problemData.description;
    this.inputFormat = problemData.input_format;
    this.outputFormat = problemData.output_format;
    this.constraints = problemData.constraints;
    this.difficulty = problemData.difficulty;
    this.timeLimit = problemData.time_limit || 2000;
    this.memoryLimit = problemData.memory_limit || 128;
    this.tags = problemData.tags || [];
    this.createdBy = problemData.created_by;
    this.totalSubmissions = problemData.total_submissions || 0;
    this.acceptedSubmissions = problemData.accepted_submissions || 0;
    this.isPublic = problemData.is_public !== false;
    this.createdAt = problemData.created_at;
    this.updatedAt = problemData.updated_at;
  }

  /**
   * Create a new problem
   */
  static async create(problemData) {
    const pool = getPostgreSQLPool();

    const query = `
      INSERT INTO problems (
        title, slug, description, input_format, output_format, 
        constraints, difficulty, time_limit, memory_limit, tags, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      problemData.title,
      problemData.slug,
      problemData.description,
      problemData.inputFormat,
      problemData.outputFormat,
      problemData.constraints,
      problemData.difficulty,
      problemData.timeLimit || 2000,
      problemData.memoryLimit || 128,
      problemData.tags || [],
      problemData.createdBy
    ];

    try {
      const result = await pool.query(query, values);
      logger.info(`Problem created: ${problemData.title}`);
      return new Problem(result.rows[0]);
    } catch (error) {
      logger.error('Error creating problem:', error);
      throw error;
    }
  }

  /**
   * Find problem by ID
   */
  static async findById(id) {
    const pool = getPostgreSQLPool();
    const query = 'SELECT * FROM problems WHERE id = $1 AND is_public = true';

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] ? new Problem(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding problem by ID:', error);
      throw error;
    }
  }

  /**
   * Find problem by slug
   */
  static async findBySlug(slug) {
    const pool = getPostgreSQLPool();
    const query = 'SELECT * FROM problems WHERE slug = $1 AND is_public = true';

    try {
      const result = await pool.query(query, [slug]);
      return result.rows[0] ? new Problem(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding problem by slug:', error);
      throw error;
    }
  }

  /**
   * Get all problems with pagination and filtering
   */
  static async getAll(options = {}) {
    const pool = getPostgreSQLPool();
    const {
      limit = 20,
      offset = 0,
      difficulty,
      tags,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    let whereConditions = ['is_public = true'];
    let queryParams = [];
    let paramIndex = 1;

    // Add difficulty filter
    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      whereConditions.push(`difficulty = $${paramIndex}`);
      queryParams.push(difficulty);
      paramIndex++;
    }

    // Add tags filter
    if (tags && Array.isArray(tags) && tags.length > 0) {
      whereConditions.push(`tags && $${paramIndex}`);
      queryParams.push(tags);
      paramIndex++;
    }

    // Add search filter
    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    const orderClause = `ORDER BY ${sortBy} ${sortOrder}`;

    const query = `
      SELECT p.*, 
             ROUND((p.accepted_submissions::float / NULLIF(p.total_submissions, 0) * 100), 1) as acceptance_rate
      FROM problems p
      WHERE ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    try {
      const result = await pool.query(query, queryParams);
      const problems = result.rows.map(row => new Problem(row));

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) FROM problems WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
      const totalCount = parseInt(countResult.rows[0].count);

      return {
        problems,
        totalCount,
        hasMore: offset + limit < totalCount
      };
    } catch (error) {
      logger.error('Error getting problems:', error);
      throw error;
    }
  }

  /**
   * Get test cases for problem
   */
  async getTestCases(includeSample = false) {
    const pool = getPostgreSQLPool();

    let query = `
      SELECT id, input_data, expected_output, is_sample, points
      FROM test_cases 
      WHERE problem_id = $1
    `;

    if (includeSample) {
      query += ' AND is_sample = true';
    }

    query += ' ORDER BY id';

    try {
      const result = await pool.query(query, [this.id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting test cases:', error);
      throw error;
    }
  }

  /**
   * Add test case to problem
   */
  async addTestCase(testCaseData) {
    const pool = getPostgreSQLPool();

    const query = `
      INSERT INTO test_cases (problem_id, input_data, expected_output, is_sample, points)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      this.id,
      testCaseData.inputData,
      testCaseData.expectedOutput,
      testCaseData.isSample || false,
      testCaseData.points || 1
    ];

    try {
      const result = await pool.query(query, values);
      logger.info(`Test case added to problem: ${this.title}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding test case:', error);
      throw error;
    }
  }

  /**
   * Update problem statistics
   */
  async updateStatistics(isAccepted = false) {
    const pool = getPostgreSQLPool();

    const query = `
      UPDATE problems 
      SET 
        total_submissions = total_submissions + 1,
        accepted_submissions = accepted_submissions + $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [isAccepted ? 1 : 0, this.id]);
      return new Problem(result.rows[0]);
    } catch (error) {
      logger.error('Error updating problem statistics:', error);
      throw error;
    }
  }

  /**
   * Get user's submission status for this problem
   */
  async getUserSubmissionStatus(userId) {
    const pool = getPostgreSQLPool();

    const query = `
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted_attempts,
        MAX(CASE WHEN status = 'Accepted' THEN score ELSE 0 END) as best_score,
        MIN(CASE WHEN status = 'Accepted' THEN execution_time ELSE NULL END) as best_time
      FROM submissions 
      WHERE problem_id = $1 AND user_id = $2
    `;

    try {
      const result = await pool.query(query, [this.id, userId]);
      const stats = result.rows[0];

      return {
        totalAttempts: parseInt(stats.total_attempts),
        acceptedAttempts: parseInt(stats.accepted_attempts),
        bestScore: parseInt(stats.best_score || 0),
        bestTime: stats.best_time,
        isAccepted: stats.accepted_attempts > 0
      };
    } catch (error) {
      logger.error('Error getting user submission status:', error);
      throw error;
    }
  }

  /**
   * Get popular tags
   */
  static async getPopularTags() {
    const pool = getPostgreSQLPool();

    const query = `
      SELECT unnest(tags) as tag, COUNT(*) as count
      FROM problems 
      WHERE is_public = true
      GROUP BY tag 
      ORDER BY count DESC 
      LIMIT 20
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting popular tags:', error);
      throw error;
    }
  }

  /**
   * Calculate acceptance rate
   */
  get acceptanceRate() {
    if (this.totalSubmissions === 0) return 0;
    return Math.round((this.acceptedSubmissions / this.totalSubmissions) * 100 * 10) / 10;
  }

  /**
   * Sanitize problem data for API response
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      description: this.description,
      inputFormat: this.inputFormat,
      outputFormat: this.outputFormat,
      constraints: this.constraints,
      difficulty: this.difficulty,
      timeLimit: this.timeLimit,
      memoryLimit: this.memoryLimit,
      tags: this.tags,
      totalSubmissions: this.totalSubmissions,
      acceptedSubmissions: this.acceptedSubmissions,
      acceptanceRate: this.acceptanceRate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Problem;
