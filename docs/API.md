# API Documentation

This document provides comprehensive API documentation for the  Exam Study Planner backend.

## 🔗 Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## 🔐 Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

Obtain a token by logging in or registering:

```http
POST /api/auth/login
POST /api/auth/register
```

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": { ... } // Only for paginated responses
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🛠️ Authentication Endpoints

### Register User

Creates a new user account.

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "examTypes": ["UPSC", "SSC"],
  "examDate": "2024-12-15",
  "targetScore": 75
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "examTypes": ["UPSC", "SSC"],
      "examDate": "2024-12-15T00:00:00.000Z",
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "User registered successfully"
}
```

### Login User

Authenticates a user and returns a JWT token.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "examTypes": ["UPSC", "SSC"],
      "lastActiveAt": "2024-01-01T12:00:00.000Z"
    }
  },
  "message": "Login successful"
}
```

### Get Current User

Returns the current authenticated user's information.

```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "examTypes": ["UPSC", "SSC"],
    "studyPreferences": {
      "dailyStudyHours": 6,
      "preferredSubjects": ["History", "Geography"],
      "breakDuration": 15
    },
    "progressStats": {
      "totalStudyHours": 150,
      "currentStreak": 7,
      "longestStreak": 15,
      "totalGoalsCompleted": 45
    }
  }
}
```

## 📚 Books Management

### Get All Books

Retrieves all books for the authenticated user.

```http
GET /api/books
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `subject` (optional): Filter by subject
- `priority` (optional): Filter by priority (High, Medium, Low)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Indian History",
      "subject": "History",
      "totalChapters": 20,
      "completedChapters": 5,
      "priority": "High",
      "notes": "Focus on medieval period",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-05T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 3,
    "totalItems": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Create Book

Creates a new book entry.

```http
POST /api/books
```

**Request Body:**
```json
{
  "title": "Indian Geography",
  "subject": "Geography",
  "totalChapters": 15,
  "priority": "Medium",
  "notes": "Important for prelims"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Indian Geography",
    "subject": "Geography",
    "totalChapters": 15,
    "completedChapters": 0,
    "priority": "Medium",
    "notes": "Important for prelims",
    "user": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Book created successfully"
}
```

### Update Book Progress

Updates the reading progress for a book.

```http
PATCH /api/books/:id/progress
```

**Request Body:**
```json
{
  "completedChapters": 8
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "completedChapters": 8,
    "progressPercentage": 53.33
  },
  "message": "Progress updated successfully"
}
```

## 🎯 Daily Goals

### Get Daily Goals

Retrieves daily goals for a specific date.

```http
GET /api/goals/daily?date=2024-01-15
```

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "date": "2024-01-15T00:00:00.000Z",
    "tasks": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "task": "Read History Chapter 3",
        "completed": false,
        "priority": "High",
        "estimatedTime": 120
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "task": "Solve Geography MCQs",
        "completed": true,
        "priority": "Medium",
        "estimatedTime": 60
      }
    ],
    "notes": "Focus on important topics",
    "totalStudyTime": 180,
    "completedTasks": 1,
    "totalTasks": 2,
    "completionRate": 50
  }
}
```

### Create/Update Daily Goal

Creates a new daily goal or updates an existing one.

```http
POST /api/goals/daily
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "tasks": [
    {
      "task": "Read Polity Chapter 5",
      "priority": "High",
      "estimatedTime": 90
    }
  ],
  "notes": "Important chapter for mains"
}
```

### Update Task Status

Updates the completion status of a specific task.

```http
PATCH /api/goals/daily/:goalId/tasks/:taskId
```

**Request Body:**
```json
{
  "completed": true
}
```

## 📅 Monthly Plans

### Get Monthly Plans

Retrieves monthly plans for a specific month and year.

```http
GET /api/goals/monthly?month=1&year=2024
```

**Query Parameters:**
- `month` (required): Month number (1-12)
- `year` (required): Year (e.g., 2024)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "month": 1,
      "year": 2024,
      "subject": "History",
      "targetType": "chapters",
      "targetAmount": 50,
      "completedAmount": 15,
      "deadline": "2024-01-31T00:00:00.000Z",
      "priority": "High",
      "status": "In Progress",
      "progressPercentage": 30,
      "description": "Complete ancient India syllabus"
    }
  ]
}
```

### Create Monthly Plan

Creates a new monthly plan.

```http
POST /api/goals/monthly
```

**Request Body:**
```json
{
  "month": 2,
  "year": 2024,
  "subject": "Geography",
  "targetType": "pages",
  "targetAmount": 200,
  "deadline": "2024-02-28",
  "priority": "Medium",
  "description": "Complete physical geography"
}
```

## 📝 Study Sessions

### Get Study Sessions

Retrieves study sessions for the authenticated user.

```http
GET /api/sessions
```

**Query Parameters:**
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `subject` (optional): Filter by subject

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "subject": "History",
      "topic": "Mughal Empire",
      "startTime": "2024-01-15T09:00:00.000Z",
      "endTime": "2024-01-15T11:00:00.000Z",
      "duration": 120,
      "notes": "Focused on Akbar's policies",
      "effectiveness": 4,
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "summary": {
    "totalSessions": 1,
    "totalDuration": 120,
    "averageEffectiveness": 4,
    "mostStudiedSubject": "History"
  }
}
```

### Create Study Session

Creates a new study session record.

```http
POST /api/sessions
```

**Request Body:**
```json
{
  "subject": "Geography",
  "topic": "Indian Rivers",
  "startTime": "2024-01-15T14:00:00.000Z",
  "endTime": "2024-01-15T15:30:00.000Z",
  "notes": "Covered major river systems",
  "effectiveness": 5
}
```

## 📋 Syllabus Tracking

### Get Syllabus Items

Retrieves syllabus tracking items.

```http
GET /api/syllabus
```

**Query Parameters:**
- `examType` (optional): Filter by exam type
- `subject` (optional): Filter by subject
- `completed` (optional): Filter by completion status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "examType": "UPSC",
      "subject": "History",
      "topic": "Ancient India",
      "subtopics": [
        {
          "name": "Indus Valley Civilization",
          "completed": true,
          "completedAt": "2024-01-10T00:00:00.000Z"
        },
        {
          "name": "Vedic Period",
          "completed": false
        }
      ],
      "priority": "High",
      "estimatedHours": 20,
      "actualHours": 8,
      "progressPercentage": 50
    }
  ]
}
```

### Update Syllabus Progress

Updates the progress of a syllabus item.

```http
PATCH /api/syllabus/:id/progress
```

**Request Body:**
```json
{
  "subtopicIndex": 1,
  "completed": true,
  "actualHours": 12
}
```

## 📰 Newspaper Analysis

### Get Newspaper Analyses

Retrieves newspaper analysis entries.

```http
GET /api/newspaper-analysis
```

**Query Parameters:**
- `date` (optional): Filter by date (YYYY-MM-DD)
- `category` (optional): Filter by category
- `importance` (optional): Filter by importance level

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439019",
      "date": "2024-01-15T00:00:00.000Z",
      "source": "The Hindu",
      "headline": "New Economic Policy Announced",
      "category": "Economy",
      "importance": "High",
      "summary": " announces new economic reforms...",
      "keyPoints": [
        "GDP growth target increased",
        "New tax reforms implemented"
      ],
      "examRelevance": "Important for GS Paper 3",
      "tags": ["economy", "policy", "reforms"]
    }
  ]
}
```

### Create Newspaper Analysis

Creates a new newspaper analysis entry.

```http
POST /api/newspaper-analysis
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "source": "Indian Express",
  "headline": "Climate Change Summit Results",
  "category": "Environment",
  "importance": "Medium",
  "summary": "Recent climate summit outcomes...",
  "keyPoints": [
    "Carbon emission targets set",
    "International cooperation agreed"
  ],
  "examRelevance": "Relevant for environment and ecology",
  "tags": ["environment", "climate", "international"]
}
```

## 📖 UPSC Resources

### Get UPSC Resources

Retrieves UPSC-specific study resources.

```http
GET /api/upsc-resources
```

**Query Parameters:**
- `category` (optional): Filter by category
- `subject` (optional): Filter by subject
- `resourceType` (optional): Filter by resource type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd79943901a",
      "title": "NCERT History Class 11",
      "category": "Books",
      "subject": "History",
      "resourceType": "PDF",
      "description": "Complete NCERT textbook for ancient India",
      "url": "https://example.com/ncert-history-11.pdf",
      "rating": 5,
      "difficulty": "Beginner",
      "estimatedTime": "40 hours",
      "tags": ["ncert", "history", "ancient"],
      "isBookmarked": false
    }
  ]
}
```

### Create UPSC Resource

Creates a new UPSC resource entry.

```http
POST /api/upsc-resources
```

**Request Body:**
```json
{
  "title": "Geography Optional Notes",
  "category": "Notes",
  "subject": "Geography",
  "resourceType": "PDF",
  "description": "Comprehensive notes for geography optional",
  "url": "https://example.com/geo-notes.pdf",
  "difficulty": "Advanced",
  "estimatedTime": "60 hours",
  "tags": ["geography", "optional", "notes"]
}
```

## 👥 Study Groups

### Get Study Groups

Retrieves study groups for the authenticated user.

```http
GET /api/groups
```

**Query Parameters:**
- `examType` (optional): Filter by exam type
- `isPrivate` (optional): Filter by privacy setting
- `membershipStatus` (optional): Filter by membership status (member, admin, invited)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd79943901b",
      "name": "UPSC Aspirants 2024",
      "description": "Study group for UPSC 2024 preparation",
      "examType": "UPSC",
      "isPrivate": false,
      "maxMembers": 50,
      "currentMembers": 25,
      "admin": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe"
      },
      "membershipStatus": "member",
      "inviteCode": "UPSC2024ABC",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Study Group

Creates a new study group.

```http
POST /api/groups
```

**Request Body:**
```json
{
  "name": "SSC CGL 2024 Group",
  "description": "Dedicated group for SSC CGL preparation",
  "examType": "SSC",
  "isPrivate": true,
  "maxMembers": 30
}
```

### Join Study Group

Joins a study group using invite code.

```http
POST /api/groups/:id/join
```

**Request Body:**
```json
{
  "inviteCode": "SSC2024XYZ"
}
```

## ❌ Error Codes

### HTTP Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Access denied
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation error
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

### Common Error Messages

```json
{
  "success": false,
  "message": "Email already exists"
}
```

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

```json
{
  "success": false,
  "message": "Token expired"
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## 🔄 Rate Limiting

The API implements rate limiting to prevent abuse:

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

## 📄 Pagination

Endpoints that return lists support pagination:

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔍 Filtering and Sorting

Many endpoints support filtering and sorting:

### Filtering
- Use query parameters to filter results
- Multiple filters can be combined
- Example: `GET /api/books?subject=History&priority=High`

### Sorting
- Use `sort` parameter with field name
- Add `-` prefix for descending order
- Example: `GET /api/books?sort=-createdAt`

## 📞 Support

For API support and questions:
- 📧 Email: api-support@examplanner.com
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-username/-exam-planner/issues)
- 📖 Documentation: [API Docs](https://docs.examplanner.com)

---

**Note**: This API is constantly evolving. Please check the documentation regularly for updates and new features.
