# JWT Storage Migration Guide

## Overview
We've migrated from insecure localStorage-based JWT storage to a more secure approach using httpOnly cookies for refresh tokens and sessionStorage for short-lived access tokens.

## What Changed

### Backend Changes

1. **Dual Token System**
   - **Access Token**: Short-lived (15 minutes), sent in response body
   - **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie

2. **New Endpoints**
   - `POST /api/auth/refresh` - Refresh access token using httpOnly cookie
   - `POST /api/auth/logout` - Clear refresh token cookie

3. **Cookie Configuration**
   ```javascript
   res.cookie('refreshToken', refreshToken, {
     httpOnly: true,              // Cannot be accessed by JavaScript
     secure: NODE_ENV === 'production', // HTTPS only in production
     sameSite: 'strict',          // CSRF protection
     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
   });
   ```

4. **Environment Variables**
   - `JWT_EXPIRE`: Changed from `30d` to `15m`
   - `JWT_REFRESH_SECRET`: New variable for refresh token signing

### Frontend Changes

1. **Storage Migration**
   - Changed from `localStorage` to `sessionStorage` for access tokens
   - Refresh tokens stored in httpOnly cookies (not accessible to JavaScript)

2. **Automatic Token Refresh**
   - Axios interceptor automatically refreshes expired access tokens
   - Uses refresh token from httpOnly cookie
   - Queues failed requests during refresh

3. **Logout Enhancement**
   - Clears sessionStorage
   - Calls `/api/auth/logout` to clear httpOnly cookie

## Security Improvements

### Before (Insecure)
```javascript
// ❌ Vulnerable to XSS attacks
localStorage.setItem('token', token);
const token = localStorage.getItem('token');
```

### After (Secure)
```javascript
// ✅ Access token in sessionStorage (cleared on tab close)
sessionStorage.setItem('token', accessToken);

// ✅ Refresh token in httpOnly cookie (not accessible to JavaScript)
res.cookie('refreshToken', refreshToken, { httpOnly: true });
```

## Benefits

1. **XSS Protection**: Refresh tokens cannot be stolen via XSS attacks
2. **Shorter Token Lifetime**: Access tokens expire in 15 minutes vs 30 days
3. **Session Security**: Tokens cleared when browser tab closes
4. **CSRF Protection**: SameSite cookie attribute prevents CSRF attacks
5. **Automatic Refresh**: Seamless user experience with token refresh

## Migration Steps

### For Existing Users

1. **Clear Old Tokens**
   ```javascript
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   ```

2. **Re-login Required**
   - Users will need to log in again after deployment
   - Old tokens in localStorage will be ignored

### For Developers

1. **Update Environment Variables**
   ```bash
   # Add to .env
   JWT_REFRESH_SECRET=your-different-secret-key-here
   JWT_EXPIRE=15m
   ```

2. **Install Dependencies**
   ```bash
   npm install cookie-parser
   ```

3. **Update CORS Configuration**
   - Ensure `credentials: true` is set in CORS options
   - Frontend must use `withCredentials: true` in axios

## Testing

### Test Token Refresh Flow

1. Login to get access token
2. Wait 15 minutes for token to expire
3. Make any API request
4. Verify automatic token refresh occurs
5. Verify request succeeds with new token

### Test Logout Flow

1. Login successfully
2. Click logout
3. Verify sessionStorage is cleared
4. Verify refresh token cookie is cleared
5. Verify redirect to login page

## Troubleshooting

### Issue: "Refresh token not found"
**Cause**: Cookie not being sent with request
**Solution**: 
- Verify `withCredentials: true` in axios config
- Check CORS `credentials: true` on backend
- Ensure frontend and backend are on same domain or proper CORS setup

### Issue: Token refresh loop
**Cause**: Refresh endpoint returning 401
**Solution**:
- Check `JWT_REFRESH_SECRET` is set correctly
- Verify refresh token cookie exists in browser
- Check cookie domain/path settings

### Issue: CORS errors after migration
**Cause**: Credentials not properly configured
**Solution**:
```javascript
// Backend
cors({
  origin: 'http://localhost:3000',
  credentials: true
})

// Frontend
axios.create({
  withCredentials: true
})
```

## Production Deployment Checklist

- [ ] Set `JWT_EXPIRE=15m` in production environment
- [ ] Generate strong `JWT_REFRESH_SECRET` (different from JWT_SECRET)
- [ ] Verify `NODE_ENV=production` for secure cookies
- [ ] Test HTTPS cookie transmission
- [ ] Configure proper CORS origins
- [ ] Test token refresh flow in production
- [ ] Monitor for authentication errors
- [ ] Plan user communication about re-login requirement

## Rollback Plan

If issues occur, you can temporarily revert by:

1. Change `JWT_EXPIRE` back to `30d`
2. Remove cookie-parser middleware
3. Revert frontend to use localStorage
4. Remove refresh token endpoint

However, this is **not recommended** as it reintroduces security vulnerabilities.