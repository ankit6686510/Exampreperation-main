# Input Validation Guide

## Overview
We've implemented comprehensive input validation using `express-validator` to protect against SQL injection, XSS attacks, and data corruption.

## Validation Middleware

### Location
`middleware/validation.js`

### Features
- **Pre-built validation rules** for common fields (email, password, mongoId, etc.)
- **Route-specific validators** for auth, resources, books, daily goals, study sessions
- **Query validators** for pagination and search
- **Automatic error handling** with standardized error responses

## Password Requirements

All passwords must meet these criteria:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (@$!%*?&)

**Example valid passwords:**
- `MyP@ssw0rd`
- `Secure123!`
- `Test@2024`

**Example invalid passwords:**
- `password` (no uppercase, number, or special char)
- `PASSWORD123` (no lowercase or special char)
- `Pass@1` (too short)

## Validation Rules by Route

### Authentication Routes

#### POST /api/auth/register
```javascript
{
  "name": "John Doe",           // 2-100 chars, letters and spaces only
  "email": "john@example.com",  // Valid email format
  "password": "MyP@ssw0rd",     // Strong password (see requirements above)
  "examTypes": ["UPSC", "SSC"], // Array of strings
  "examDate": "2024-12-31"      // ISO 8601 date format
}
```

**Validation:**
- Name: 2-100 characters, letters and spaces only
- Email: Valid email format, normalized
- Password: Strong password requirements
- Exam types: Must be an array
- Exam date: Valid ISO 8601 date

#### POST /api/auth/login
```javascript
{
  "email": "john@example.com",  // Valid email
  "password": "MyP@ssw0rd"      // Required (no strength check on login)
}
```

#### PUT /api/auth/password
```javascript
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewP@ss456"   // Must meet strong password requirements
}
```

### Resource Routes

#### POST /api/resources
```javascript
{
  "title": "Study Material",        // 1-200 chars, required
  "description": "Detailed notes",  // Max 2000 chars, optional
  "url": "https://example.com",     // Valid URL, optional
  "category": "Mathematics",        // 1-50 chars, optional
  "priority": "high",               // low|medium|high, optional
  "tags": ["algebra", "calculus"],  // Array, optional
  "type": "pdf"                     // video|article|pdf|book|course|other
}
```

**Validation:**
- Title: Required, 1-200 characters
- Description: Optional, max 2000 characters
- URL: Optional, must be valid URL format
- Category: Optional, 1-50 characters
- Priority: Optional, must be 'low', 'medium', or 'high'
- Tags: Optional, must be an array
- Type: Optional, must be valid resource type

#### PUT /api/resources/:id
- Same as POST but all fields optional
- ID must be valid MongoDB ObjectId

#### GET /api/resources (with query params)
```
GET /api/resources?page=1&limit=10&q=math&category=science&priority=high
```

**Query Validation:**
- page: Positive integer, default 1
- limit: 1-100, default 10
- q: Search query, 1-100 characters
- category: 1-50 characters
- priority: low|medium|high

### Daily Goal Routes

#### POST /api/daily-goals
```javascript
{
  "title": "Complete Chapter 5",    // 1-200 chars, required
  "description": "Focus on algebra", // Max 2000 chars, optional
  "date": "2024-01-15",             // ISO 8601 date, optional
  "targetHours": 4.5,               // 0-24, optional
  "tasks": [                        // Array, optional
    {
      "title": "Read section 5.1",
      "completed": false
    }
  ]
}
```

**Validation:**
- Title: Required, 1-200 characters
- Description: Optional, max 2000 characters
- Date: Optional, valid ISO 8601 date
- Target hours: Optional, 0-24 (float)
- Tasks: Optional, must be an array

### Study Session Routes

#### POST /api/study-sessions
```javascript
{
  "title": "Morning Study",         // 1-200 chars, required
  "subject": "Mathematics",         // 1-100 chars, required
  "startTime": "2024-01-15T09:00:00Z", // ISO 8601, required
  "endTime": "2024-01-15T11:00:00Z",   // ISO 8601, optional
  "duration": 120                   // Minutes, positive integer, optional
}
```

**Validation:**
- Title: Required, 1-200 characters
- Subject: Required, 1-100 characters
- Start time: Required, valid ISO 8601 datetime
- End time: Optional, valid ISO 8601 datetime
- Duration: Optional, positive integer (minutes)

### Book Routes

#### POST /api/books
```javascript
{
  "title": "Advanced Mathematics",  // 1-200 chars, required
  "author": "John Smith",           // 1-100 chars, required
  "totalPages": 500,                // Positive integer, required
  "category": "Mathematics",        // 1-50 chars, optional
  "priority": "high"                // low|medium|high, optional
}
```

**Validation:**
- Title: Required, 1-200 characters
- Author: Required, 1-100 characters
- Total pages: Required, positive integer
- Category: Optional, 1-50 characters
- Priority: Optional, low|medium|high

## Error Response Format

When validation fails, the API returns:

```javascript
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }
  ]
}
```

**HTTP Status Code:** 400 Bad Request

## Common Validation Patterns

### MongoDB ObjectId Validation
```javascript
// Validates route parameters like /:id
commonValidations.mongoId
```

### Email Validation
```javascript
// Validates and normalizes email addresses
commonValidations.email
```

### Date Validation
```javascript
// Validates ISO 8601 date format
commonValidations.date
```

### Pagination Validation
```javascript
// Validates page and limit query parameters
queryValidations.pagination
```

### Search Validation
```javascript
// Validates search query parameters
queryValidations.search
```

## Adding Validation to New Routes

### Step 1: Import validation middleware
```javascript
const { resourceValidations, queryValidations } = require('../middleware/validation');
```

### Step 2: Add to route definition
```javascript
router.post('/resources', resourceValidations.create, createResource);
router.get('/resources', queryValidations.pagination, getResources);
```

### Step 3: Create custom validators if needed
```javascript
const customValidation = [
  body('customField')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Custom field must be between 1 and 100 characters'),
  handleValidationErrors
];
```

## Security Benefits

### 1. SQL Injection Prevention
- All inputs are validated and sanitized
- MongoDB ObjectIds are strictly validated
- No raw user input reaches the database

### 2. XSS Prevention
- String inputs are trimmed and length-limited
- Email addresses are normalized
- URLs are validated for proper format

### 3. Data Integrity
- Type checking ensures correct data types
- Range validation prevents invalid values
- Required fields are enforced

### 4. DoS Prevention
- String length limits prevent memory exhaustion
- Array validation prevents oversized payloads
- Pagination limits prevent excessive queries

## Testing Validation

### Valid Request Example
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "MyP@ssw0rd",
    "examTypes": ["UPSC"],
    "examDate": "2024-12-31"
  }'
```

### Invalid Request Example (triggers validation)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "J",
    "email": "invalid-email",
    "password": "weak",
    "examTypes": "not-an-array"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name must be between 2 and 100 characters"
    },
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    },
    {
      "field": "examTypes",
      "message": "Exam types must be an array"
    }
  ]
}
```

## Best Practices

1. **Always validate user input** - Never trust client-side validation alone
2. **Use appropriate validators** - Choose validators that match your data type
3. **Provide clear error messages** - Help users understand what went wrong
4. **Validate early** - Catch errors before they reach business logic
5. **Sanitize inputs** - Use trim(), normalizeEmail(), etc.
6. **Set reasonable limits** - Prevent abuse with length and range limits
7. **Test edge cases** - Verify validation works for boundary values

## Troubleshooting

### Issue: Validation passes but data is still invalid
**Solution:** Check that you're using the correct validator for your data type

### Issue: Valid data is being rejected
**Solution:** Review the validation rules and adjust limits if needed

### Issue: Error messages are unclear
**Solution:** Customize error messages using `.withMessage()`

### Issue: Validation is too strict
**Solution:** Make fields optional with `.optional()` or adjust constraints

## Future Enhancements

- [ ] Add custom validators for exam-specific data
- [ ] Implement rate limiting per validation failure
- [ ] Add request sanitization middleware
- [ ] Create validation schemas for complex nested objects
- [ ] Add validation for file uploads
- [ ] Implement field-level permissions