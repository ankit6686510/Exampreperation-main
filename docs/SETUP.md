# Setup and Installation Guide

This guide will help you set up the  Exam Study Planner application on your local machine for development or production use.

## 📋 Prerequisites

### System Requirements

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **MongoDB**: Version 5.0 or higher (local or cloud)
- **Git**: For version control

### Recommended Tools

- **VS Code**: For development with extensions:
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Importer
  - Prettier - Code formatter
  - ESLint
  - Thunder Client (for API testing)
- **MongoDB Compass**: For database visualization
- **Postman**: For API testing (alternative to Thunder Client)

## 🛠️ Installation

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/ankit6686510/exam-prep.git
cd -exam-planner

# Or if you forked it
git clone https://github.com/your-username/-exam-planner.git
cd -exam-planner
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run install-client

# Alternative: Install all at once
npm run install-all
```

### Step 3: Database Setup

#### Option A: Local MongoDB

1. **Install MongoDB Community Edition**
   
   **macOS (using Homebrew):**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```

   **Windows:**
   - Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Follow the installation wizard
   - Start MongoDB service

   **Linux (Ubuntu):**
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   ```

2. **Verify MongoDB Installation**
   ```bash
   # Connect to MongoDB shell
   mongosh
   
   # Should connect without errors
   # Type 'exit' to quit
   ```

#### Option B: MongoDB Atlas (Cloud)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account

2. **Create Cluster**
   - Choose "Build a Database"
   - Select "Free" tier
   - Choose your preferred region
   - Click "Create Cluster"

3. **Setup Database Access**
   - Go to "Database Access"
   - Add a new database user
   - Choose "Password" authentication
   - Save username and password for later

4. **Setup Network Access**
   - Go to "Network Access"
   - Add IP Address
   - For development, you can use `0.0.0.0/0` (allow from anywhere)
   - For production, specify your server's IP

5. **Get Connection String**
   - Go to "Clusters"
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

### Step 4: Environment Configuration

1. **Copy Environment Template**
   ```bash
   cp .env.sample .env
   ```

2. **Edit Environment Variables**
   ```bash
   # Open .env file in your editor
   nano .env
   # or
   code .env
   ```

3. **Configure Variables**

   **Required Variables:**
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Database (choose one)
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/-exam-planner

   # MongoDB Atlas
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/-exam-planner

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
   JWT_EXPIRE=30d

   # CORS
   CORS_ORIGIN=http://localhost:5173
   ```

   **Optional Variables:**
   ```env
   # Email Configuration (for notifications)
   EMAIL_FROM=your-app@example.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # File Upload (Cloudinary)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

### Step 5: Start the Application

#### Development Mode

```bash
# Start both frontend and backend with hot reload
npm run dev
```

This will start:
- Backend server: http://localhost:5000
- Frontend development server: http://localhost:5173

#### Start Services Separately

```bash
# Terminal 1: Start backend only
npm run server

# Terminal 2: Start frontend only
npm run client
```

### Step 6: Verify Installation

1. **Check Backend**
   ```bash
   # Test health endpoint
   curl http://localhost:5000/api/health
   
   # Should return:
   # {"success":true,"message":" Exam Planner API is running",...}
   ```

2. **Check Frontend**
   - Open browser and navigate to http://localhost:5173
   - You should see the login page

3. **Test Registration**
   - Click "Register" 
   - Create a test account
   - Login should redirect to dashboard

## 🔧 Additional Configuration

### Email Setup (Optional)

For email notifications and password reset functionality:

#### Gmail Configuration
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in `SMTP_PASS`

#### Other Email Providers
```env
# Outlook/Hotmail
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587

# Yahoo
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587

# Custom SMTP
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

### File Upload Setup (Optional)

For profile pictures and file uploads:

1. **Create Cloudinary Account**
   - Go to [Cloudinary](https://cloudinary.com)
   - Sign up for free account

2. **Get Credentials**
   - Go to Dashboard
   - Copy Cloud Name, API Key, and API Secret

3. **Configure Environment**
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=your-secret-key
   ```

### Database Seeding (Optional)

Populate the database with sample data:

```bash
# Seed UPSC templates and resources
node scripts/seedUpscTemplates.js

# Seed comprehensive data
node scripts/seedComprehensiveUpscTemplates.js
```

## 🏗️ Production Setup

### Environment Configuration

```env
NODE_ENV=production
PORT=5000

# Use production MongoDB URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/-exam-planner-prod

# Strong JWT secret (generate new one)
JWT_SECRET=your-production-jwt-secret-64-characters-minimum

# Production domain
CORS_ORIGIN=https://your-domain.com

# Production email settings
EMAIL_FROM=noreply@your-domain.com
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-production-email
SMTP_PASS=your-production-password
```

### Build for Production

```bash
# Install all dependencies
npm run install-all

# Build frontend
npm run build

# Start production server
npm start
```

### Process Manager (PM2)

For production deployment with process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "-exam-planner"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Nginx Configuration

Example Nginx configuration for reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static files
    location / {
        root /path/to/your/app/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐳 Docker Setup (Alternative)

### Docker Configuration

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/-exam-planner
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - mongo

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Run with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🧪 Testing Setup

### Backend Testing

```bash
# Install test dependencies (if not already installed)
npm install --save-dev jest supertest

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Frontend Testing

```bash
cd client

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔍 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solutions:**
- Ensure MongoDB is running: `brew services start mongodb-community` (macOS)
- Check MongoDB URI in `.env` file
- For Atlas: verify network access and credentials

#### 2. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

#### 3. Module Not Found

**Error:** `Cannot find module 'some-package'`

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For client
cd client
rm -rf node_modules package-lock.json
npm install
```

#### 4. JWT Secret Error

**Error:** `JWT Secret must be provided`

**Solution:**
- Ensure `JWT_SECRET` is set in `.env` file
- Secret should be at least 32 characters long

#### 5. CORS Error

**Error:** `Access to fetch at 'http://localhost:5000' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution:**
- Verify `CORS_ORIGIN` in `.env` matches frontend URL
- For development, use `http://localhost:5173`

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**
   ```bash
   # Backend logs
   npm run server

   # Frontend logs
   npm run client
   ```

2. **Verify Environment**
   ```bash
   # Check Node.js version
   node --version

   # Check npm version
   npm --version

   # Check MongoDB connection
   mongosh "your-mongodb-uri"
   ```

3. **Community Support**
   - Open an issue on [GitHub](https://github.com/your-username/-exam-planner/issues)
   - Check existing issues for solutions
   - Join our [Discord community](https://discord.gg/your-server)

## 🎉 Success!

If everything is working correctly, you should be able to:

1. ✅ Access the frontend at http://localhost:5173
2. ✅ Register a new user account
3. ✅ Login successfully
4. ✅ Navigate through the dashboard
5. ✅ Create books, goals, and other data
6. ✅ API health check returns success

You're now ready to start using or contributing to the  Exam Study Planner!

## 📚 Next Steps

- Read the [API Documentation](API.md) for backend development
- Check the [Contributing Guidelines](CONTRIBUTING.md) if you want to contribute
- Explore the [User Guide](USER_GUIDE.md) to understand all features
- Join our community for support and updates

---

Happy coding! 🚀
