# Deployment Guide - Exam Study Planner

This guide covers deploying the Exam Study Planner to various platforms. The application is now deployment-friendly with environment-based configuration.

## 🚀 Quick Deployment Checklist

### Pre-deployment Setup

1. **Environment Configuration**
   ```bash
   # Copy and customize environment variables
   cp .env.sample .env
   
   # Update these variables for your deployment:
   NODE_ENV=production
   MONGODB_URI=your-atlas-connection-string
   JWT_SECRET=your-strong-secret-key
   CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com
   ```

2. **Generate Strong JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

## 🌐 Platform-Specific Deployments

### 1. Heroku Deployment

```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create your-exam-planner-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-atlas-connection-string"
heroku config:set JWT_SECRET="your-strong-secret-key"
heroku config:set CORS_ORIGIN="https://your-exam-planner-app.herokuapp.com"

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 2. Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard:
# NODE_ENV=production
# MONGODB_URI=your-atlas-connection-string
# JWT_SECRET=your-strong-secret-key
# CORS_ORIGIN=https://your-app.railway.app
```

### 3. Render Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set environment variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your Atlas connection string
   - `JWT_SECRET`: Your strong secret key
   - `CORS_ORIGIN`: `https://your-app.onrender.com`

### 4. Frontend-Only Deployment (Netlify/Vercel)

If deploying frontend separately:

```bash
# Build the frontend
cd client
npm run build

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist

# Or deploy to Vercel
npm install -g vercel
vercel --prod
```

**Backend Environment Variables for separate deployment:**
```
CORS_ORIGIN=https://your-frontend.netlify.app,https://your-frontend.vercel.app
```

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (auto-set by platforms) | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT tokens | `64-character-hex-string` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `https://app.com,https://www.app.com` |

## 🗄️ Database Setup (MongoDB Atlas)

1. Create MongoDB Atlas cluster
2. Create database user with read/write permissions
3. Whitelist deployment server IPs:
   - Heroku: Add `0.0.0.0/0` (or specific IPs)
   - Railway/Render: Add their IP ranges
   - For production: Add specific IP addresses

## 🔒 Security Considerations

### Production Environment Variables
```bash
# Generate strong JWT secret
NODE_ENV=production
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Use specific origins instead of wildcards
CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com

# Use SSL connection for MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/examplanner?retryWrites=true&w=majority&ssl=true
```

### Security Headers
The app already includes:
- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- CORS with specific origins
- JWT authentication

## 🚦 Health Check

Your deployed app will have a health check endpoint:
```
GET https://your-app.com/api/health
```

Response:
```json
{
  "success": true,
  "message": "Exam Planner API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` includes your frontend URL
   - Check for trailing slashes in URLs

2. **Database Connection**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in Atlas
   - Ensure database user has correct permissions

3. **JWT Errors**
   - Verify `JWT_SECRET` is set and consistent
   - Check token expiration settings

4. **Build Errors**
   - Ensure all dependencies are in `package.json`
   - Check Node.js version compatibility

### Environment-Specific Testing

```bash
# Test with production-like settings locally
NODE_ENV=production npm start

# Test CORS settings
curl -H "Origin: https://yourapp.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-api.com/api/auth/login
```

## 📊 Monitoring

Consider adding monitoring services:
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: New Relic, DataDog
- **Logs**: LogDNA, Papertrail
- **Errors**: Sentry, Bugsnag

---

This deployment configuration ensures your Exam Study Planner works seamlessly across different environments and platforms.
