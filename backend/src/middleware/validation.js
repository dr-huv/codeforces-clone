const { body, param, query } = require('express-validator');

/**
 * User registration validation
 */
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase, one uppercase letter, and one number'),

  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters')
    .trim(),

  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .trim(),

  body('country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters')
    .trim(),

  body('organization')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Organization must be less than 255 characters')
    .trim(),

  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters')
    .trim()
];

/**
 * User login validation
 */
const validateLogin = [
  body('loginIdentifier')
    .notEmpty()
    .withMessage('Email or username is required')
    .trim(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Profile update validation
 */
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters')
    .trim(),

  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .trim(),

  body('country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters')
    .trim(),

  body('organization')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Organization must be less than 255 characters')
    .trim(),

  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters')
    .trim(),

  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL')
];

/**
 * Password change validation
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase, one uppercase letter, and one number')
];

/**
 * Problem creation validation
 */
const validateProblemCreation = [
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters')
    .trim(),

  body('slug')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
    .isLength({ min: 3, max: 255 })
    .withMessage('Slug must be between 3 and 255 characters'),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim(),

  body('inputFormat')
    .optional()
    .trim(),

  body('outputFormat')
    .optional()
    .trim(),

  body('constraints')
    .optional()
    .trim(),

  body('difficulty')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),

  body('timeLimit')
    .optional()
    .isInt({ min: 100, max: 10000 })
    .withMessage('Time limit must be between 100 and 10000 milliseconds'),

  body('memoryLimit')
    .optional()
    .isInt({ min: 16, max: 512 })
    .withMessage('Memory limit must be between 16 and 512 MB'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters')
];

/**
 * Submission validation
 */
const validateSubmission = [
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ max: 100000 })
    .withMessage('Code must be less than 100,000 characters'),

  body('language')
    .isIn(['cpp', 'java', 'python', 'javascript', 'c'])
    .withMessage('Invalid programming language'),

  param('problemId')
    .isInt({ min: 1 })
    .withMessage('Problem ID must be a positive integer')
];

/**
 * Contest creation validation
 */
const validateContestCreation = [
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters')
    .trim(),

  body('description')
    .optional()
    .trim(),

  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('duration')
    .isInt({ min: 30, max: 1440 })
    .withMessage('Duration must be between 30 and 1440 minutes'),

  body('type')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Type must be less than 50 characters'),

  body('maxParticipants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max participants must be a positive integer')
];

/**
 * Query parameter validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * ID parameter validation
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateProblemCreation,
  validateSubmission,
  validateContestCreation,
  validatePagination,
  validateId
};
