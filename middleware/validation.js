const { body, param, query, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Common validation rules
const commonValidations = {
  email: body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  mongoId: param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  title: body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  description: body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  url: body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL'),
  
  date: body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  priority: body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  
  status: body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'archived'])
    .withMessage('Invalid status value'),
  
  category: body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  
  tags: body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  examTypes: body('examTypes')
    .optional()
    .isArray()
    .withMessage('Exam types must be an array'),
  
  positiveInteger: (field) => body(field)
    .optional()
    .isInt({ min: 0 })
    .withMessage(`${field} must be a positive integer`),
  
  boolean: (field) => body(field)
    .optional()
    .isBoolean()
    .withMessage(`${field} must be a boolean value`)
};

// Auth validation rules
const authValidations = {
  register: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    commonValidations.examTypes,
    body('examDate')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid exam date'),
    handleValidationErrors
  ],
  
  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password,
    handleValidationErrors
  ],
  
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address'),
    commonValidations.examTypes,
    body('examDate')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid exam date'),
    handleValidationErrors
  ]
};

// Resource validation rules
const resourceValidations = {
  create: [
    commonValidations.title,
    commonValidations.description,
    commonValidations.url,
    commonValidations.category,
    commonValidations.priority,
    commonValidations.tags,
    body('type')
      .optional()
      .isIn(['video', 'article', 'pdf', 'book', 'course', 'other'])
      .withMessage('Invalid resource type'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.mongoId,
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    commonValidations.description,
    commonValidations.url,
    commonValidations.category,
    commonValidations.priority,
    commonValidations.tags,
    handleValidationErrors
  ],
  
  delete: [
    commonValidations.mongoId,
    handleValidationErrors
  ],
  
  getById: [
    commonValidations.mongoId,
    handleValidationErrors
  ]
};

// Daily goal validation rules
const dailyGoalValidations = {
  create: [
    commonValidations.title,
    commonValidations.description,
    commonValidations.date,
    body('targetHours')
      .optional()
      .isFloat({ min: 0, max: 24 })
      .withMessage('Target hours must be between 0 and 24'),
    body('tasks')
      .optional()
      .isArray()
      .withMessage('Tasks must be an array'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.mongoId,
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    commonValidations.description,
    body('completed')
      .optional()
      .isBoolean()
      .withMessage('Completed must be a boolean'),
    body('actualHours')
      .optional()
      .isFloat({ min: 0, max: 24 })
      .withMessage('Actual hours must be between 0 and 24'),
    handleValidationErrors
  ]
};

// Study session validation rules
const studySessionValidations = {
  create: [
    commonValidations.title,
    body('subject')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Subject must be between 1 and 100 characters'),
    body('startTime')
      .isISO8601()
      .withMessage('Please provide a valid start time'),
    body('endTime')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid end time'),
    body('duration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Duration must be a positive integer'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.mongoId,
    body('endTime')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid end time'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes cannot exceed 2000 characters'),
    handleValidationErrors
  ]
};

// Book validation rules
const bookValidations = {
  create: [
    commonValidations.title,
    body('author')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Author must be between 1 and 100 characters'),
    body('totalPages')
      .isInt({ min: 1 })
      .withMessage('Total pages must be a positive integer'),
    commonValidations.category,
    commonValidations.priority,
    handleValidationErrors
  ],
  
  updateProgress: [
    commonValidations.mongoId,
    body('currentPage')
      .isInt({ min: 0 })
      .withMessage('Current page must be a non-negative integer'),
    handleValidationErrors
  ]
};

// Query validation rules
const queryValidations = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ],
  
  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    query('category')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  authValidations,
  resourceValidations,
  dailyGoalValidations,
  studySessionValidations,
  bookValidations,
  queryValidations
};