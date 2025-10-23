#  Exam Study Planner

> A comprehensive full-stack study planner application designed specifically for  exam preparation including UPSC, SSC, Banking, Railways, and other competitive exams.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

## 🎯 Overview

The  Exam Study Planner is a modern, feature-rich application that helps students systematically prepare for competitive  exams. It combines intelligent study planning, progress tracking, resource management, and collaborative features in one comprehensive platform.

### 🌟 Key Features

#### 📚 Study Management
- **Book & Resource Tracker** - Manage reading materials with progress tracking
- **Daily Goals System** - Create and track daily study tasks
- **Monthly Planning** - Set and monitor monthly study targets
- **Study Sessions** - Time tracking with detailed session logs
- **Syllabus Tracker** - Complete syllabus coverage monitoring

#### 📊 Progress Analytics
- **Advanced Progress Dashboard** - Visual insights into study patterns
- **Performance Metrics** - Comprehensive statistics and trends
- **Study Streaks** - Motivation through streak tracking
- **Goal Completion Rates** - Success metrics and analysis

#### 🗞️ Current Affairs
- **Newspaper Analysis** - Structured current affairs tracking
- **UPSC Resources** - Curated exam-specific resources
- **Daily Updates** - Stay updated with relevant news

#### 👥 Collaborative Features
- **Study Groups** - Create and join study communities
- **Group Permissions** - Role-based access control
- **Shared Resources** - Collaborative resource sharing
- **Group Activities** - Track collective progress

#### 🔐 User Experience
- **Secure Authentication** - JWT-based user management
- **Profile Customization** - Personalized study preferences
- **Responsive Design** - Works seamlessly across devices
- **Dark/Light Theme** - Comfortable viewing experience

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet.js, CORS, rate limiting
- **File Upload**: Multer with Cloudinary integration
- **Email**: Nodemailer for notifications
- **Task Scheduling**: Node-cron for automated tasks

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Redux Toolkit
- **Data Fetching**: TanStack React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion

#### UI/UX
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Notifications**: Sonner for toast messages
- **Date Handling**: date-fns
- **Theme Management**: next-themes

### Project Structure

```
-exam-planner/
├── 📁 client/                     # Frontend React application
│   ├── 📁 public/                 # Static assets
│   ├── 📁 src/
│   │   ├── 📁 api/                # API service layer
│   │   ├── 📁 components/         # Reusable React components
│   │   │   └── 📁 ui/             # shadcn/ui components
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📁 lib/                # Utility functions
│   │   ├── 📁 pages/              # Route components
│   │   └── 📁 redux/              # State management
│   │       └── 📁 slices/         # Redux slices
│   ├── package.json
│   └── vite.config.ts
├── 📁 config/                     # Configuration files
├── 📁 controllers/                # API route handlers
├── 📁 middleware/                 # Express middleware
├── 📁 models/                     # Mongoose schemas
├── 📁 routes/                     # API route definitions
├── 📁 scripts/                    # Database seeding scripts
├── 📁 utils/                      # Backend utilities
├── 📁 docs/                       # Documentation
├── server.js                      # Express server entry point
├── package.json                   # Backend dependencies
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/-exam-planner.git
cd -exam-planner
```

2. **Install dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run install-client
```

3. **Environment Configuration**
```bash
# Copy environment template
cp .env.sample .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/-exam-planner

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email Configuration (Optional)
EMAIL_FROM=your-email@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password

# File Upload (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. **Start the application**
```bash
# Development (runs both frontend and backend)
npm run dev

# Backend only
npm run server

# Frontend only
npm run client
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "examTypes": ["UPSC", "SSC"],
  "examDate": "2024-12-15"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Study Management Endpoints

#### Books Management
```http
GET    /api/books                    # Get all books
POST   /api/books                    # Create new book
GET    /api/books/:id                # Get single book
PUT    /api/books/:id                # Update book
DELETE /api/books/:id                # Delete book
PATCH  /api/books/:id/progress       # Update reading progress
```

#### Daily Goals
```http
GET    /api/goals/daily?date=YYYY-MM-DD    # Get daily goals
POST   /api/goals/daily                    # Create daily goal
PATCH  /api/goals/daily/:id/tasks/:taskId  # Update task status
```

#### Monthly Plans
```http
GET    /api/goals/monthly?month=MM&year=YYYY  # Get monthly plans
POST   /api/goals/monthly                     # Create monthly plan
PATCH  /api/goals/monthly/:id/progress        # Update progress
```

#### Study Sessions
```http
GET    /api/sessions                 # Get study sessions
POST   /api/sessions                 # Create session
PUT    /api/sessions/:id             # Update session
DELETE /api/sessions/:id             # Delete session
```

#### Syllabus Tracking
```http
GET    /api/syllabus                 # Get syllabus items
POST   /api/syllabus                 # Create syllabus item
PUT    /api/syllabus/:id             # Update syllabus item
PATCH  /api/syllabus/:id/progress    # Update progress
```

#### UPSC Resources
```http
GET    /api/upsc-resources           # Get resources
POST   /api/upsc-resources           # Create resource
PUT    /api/upsc-resources/:id       # Update resource
DELETE /api/upsc-resources/:id       # Delete resource
```

#### Newspaper Analysis
```http
GET    /api/newspaper-analysis       # Get analyses
POST   /api/newspaper-analysis       # Create analysis
PUT    /api/newspaper-analysis/:id   # Update analysis
DELETE /api/newspaper-analysis/:id   # Delete analysis
```

#### Study Groups
```http
GET    /api/groups                   # Get study groups
POST   /api/groups                   # Create group
GET    /api/groups/:id               # Get single group
PUT    /api/groups/:id               # Update group
DELETE /api/groups/:id               # Delete group
POST   /api/groups/:id/join          # Join group
POST   /api/groups/:id/leave         # Leave group
```

### Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  profilePicture: String,
  examTypes: [String], // UPSC, SSC, Banking, etc.
  examDate: Date,
  targetScore: Number,
  studyPreferences: {
    dailyStudyHours: Number,
    preferredSubjects: [String],
    studyTimeSlots: [Object],
    breakDuration: Number
  },
  progressStats: {
    totalStudyHours: Number,
    currentStreak: Number,
    longestStreak: Number,
    totalGoalsCompleted: Number,
    totalBooksRead: Number,
    lastStudyDate: Date
  },
  notifications: Object,
  isActive: Boolean,
  lastActiveAt: Date,
  timestamps: true
}
```

### Book Model
```javascript
{
  user: ObjectId (ref: User),
  title: String,
  subject: String,
  totalChapters: Number,
  completedChapters: Number,
  notes: String,
  priority: String, // High, Medium, Low
  timestamps: true
}
```

### Daily Goal Model
```javascript
{
  user: ObjectId (ref: User),
  date: Date,
  tasks: [{
    task: String,
    completed: Boolean,
    priority: String,
    estimatedTime: Number
  }],
  notes: String,
  totalStudyTime: Number,
  timestamps: true
}
```

### Study Group Model
```javascript
{
  name: String,
  description: String,
  examType: String,
  isPrivate: Boolean,
  maxMembers: Number,
  admin: ObjectId (ref: User),
  members: [ObjectId] (ref: User),
  inviteCode: String,
  timestamps: true
}
```

## 🛠️ Development

### Running in Development Mode

```bash
# Start both frontend and backend with hot reload
npm run dev

# Backend only with nodemon
npm run server

# Frontend only with Vite
npm run client
```

### Environment Variables

Create a `.env` file based on `.env.sample`:

```env
# Required
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/-exam-planner
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:5173

# Optional
EMAIL_FROM=your-email@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Database Seeding

```bash
# Seed UPSC templates
node scripts/seedUpscTemplates.js

# Seed comprehensive templates
node scripts/seedComprehensiveUpscTemplates.js
```

### Building for Production

```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

## 🧪 Testing

### API Testing

Use tools like Postman, Thunder Client, or curl:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "examTypes": ["UPSC"],
    "examDate": "2024-12-15"
  }'
```

### Frontend Testing

```bash
cd client
npm run test  # Run frontend tests
npm run lint  # Run ESLint
```

## 🚢 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure CORS for your domain

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

### Manual Deployment

```bash
# Install dependencies and build
npm run install-all
npm run build

# Start production server
npm start
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Code Style

- Use TypeScript for frontend code
- Follow ESLint rules for code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Write descriptive commit messages

### Reporting Issues

Please use the [GitHub Issues](https://github.com/your-username/-exam-planner/issues) page to report bugs or request features.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Lucide](https://lucide.dev/) for the icon library
- [TanStack Query](https://tanstack.com/query) for server state management
- [Recharts](https://recharts.org/) for data visualization

## 📞 Support

- 📧 Email: support@examplanner.com
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-username/-exam-planner/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/-exam-planner/discussions)

---

Made with ❤️ for  exam aspirants across India
