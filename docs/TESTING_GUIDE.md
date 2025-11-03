# Testing Guide

## Overview
This guide covers the testing infrastructure for the exam preparation platform, including unit tests, integration tests, and best practices.

## Testing Stack
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **MongoDB Memory Server**: In-memory MongoDB for testing
- **Coverage**: Istanbul/NYC for code coverage

## Setup

### Installation
Dependencies are already installed. To verify:
```bash
npm list jest supertest mongodb-memory-server
```

### Configuration
Testing is configured in `jest.config.js`:
- Test environment: Node.js
- Coverage directory: `coverage/`
- Test timeout: 10 seconds
- Setup file: `tests/setup.js`

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### With Coverage Report
```bash
npm test -- --coverage
```

### Specific Test File
```bash
npm test -- tests/auth.test.js
```

### Specific Test Suite
```bash
npm test -- --testNamePattern="Auth API"
```

## Test Structure

### Directory Layout
```
tests/
├── setup.js              # Global test setup
├── auth.test.js          # Authentication tests
├── validation.test.js    # Input validation tests
├── unit/                 # Unit tests
│   ├── models/
│   ├── middleware/
│   └── utils/
└── integration/          # Integration tests
    ├── api/
    └── workflows/
```

### Test File Naming
- Unit tests: `*.test.js` or `*.spec.js`
- Integration tests: `*.integration.test.js`
- E2E tests: `*.e2e.test.js`

## Writing Tests

### Basic Test Structure
```javascript
const request = require('supertest');
const app = require('../server');
const Model = require('../models/Model');

describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Arrange
      const data = { /* test data */ };

      // Act
      const res = await request(app)
        .post('/api/endpoint')
        .send(data);

      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
```

### Authentication in Tests
```javascript
describe('Protected Routes', () => {
  let token;

  beforeEach(async () => {
    // Register and login to get token
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@1234',
        examTypes: ['UPSC'],
        examDate: '2025-06-01'
      });
    
    token = res.body.data.token;
  });

  it('should access protected route', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});
```

### Database Testing
```javascript
describe('Database Operations', () => {
  it('should create a document', async () => {
    const doc = await Model.create({
      field: 'value'
    });

    expect(doc).toHaveProperty('_id');
    expect(doc.field).toBe('value');
  });

  it('should find documents', async () => {
    await Model.create({ field: 'value1' });
    await Model.create({ field: 'value2' });

    const docs = await Model.find();
    expect(docs).toHaveLength(2);
  });
});
```

### Testing Validation
```javascript
describe('Input Validation', () => {
  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: 'Test@1234'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation failed');
  });
});
```

### Testing Error Handling
```javascript
describe('Error Handling', () => {
  it('should handle 404 errors', async () => {
    const res = await request(app)
      .get('/api/nonexistent');

    expect(res.statusCode).toBe(404);
  });

  it('should handle database errors', async () => {
    // Mock database error
    jest.spyOn(Model, 'find').mockRejectedValue(new Error('DB Error'));

    const res = await request(app)
      .get('/api/endpoint');

    expect(res.statusCode).toBe(500);
  });
});
```

## Test Coverage

### Coverage Goals
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Viewing Coverage Report
```bash
npm test -- --coverage
```

Coverage report is generated in `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/coverage-final.json` - JSON report

### Coverage by Component
```bash
# Controllers
npm test -- --coverage --collectCoverageFrom="controllers/**/*.js"

# Middleware
npm test -- --coverage --collectCoverageFrom="middleware/**/*.js"

# Models
npm test -- --coverage --collectCoverageFrom="models/**/*.js"
```

## Best Practices

### 1. Test Isolation
Each test should be independent:
```javascript
beforeEach(async () => {
  // Clean database before each test
  await Model.deleteMany({});
});
```

### 2. Descriptive Test Names
```javascript
// BAD
it('works', async () => { /* ... */ });

// GOOD
it('should return 401 when token is missing', async () => { /* ... */ });
```

### 3. Arrange-Act-Assert Pattern
```javascript
it('should create a book', async () => {
  // Arrange
  const bookData = { title: 'Test Book' };

  // Act
  const res = await request(app)
    .post('/api/books')
    .send(bookData);

  // Assert
  expect(res.statusCode).toBe(201);
  expect(res.body.data.title).toBe('Test Book');
});
```

### 4. Test Edge Cases
```javascript
describe('Edge Cases', () => {
  it('should handle empty array', async () => { /* ... */ });
  it('should handle null values', async () => { /* ... */ });
  it('should handle very long strings', async () => { /* ... */ });
  it('should handle special characters', async () => { /* ... */ });
});
```

### 5. Mock External Dependencies
```javascript
jest.mock('../config/redis', () => ({
  getRedisClient: jest.fn(() => null)
}));

jest.mock('@sentry/node', () => ({
  captureException: jest.fn()
}));
```

### 6. Test Async Code Properly
```javascript
// BAD - Missing await
it('should create user', () => {
  request(app).post('/api/users').send(data);
});

// GOOD - Proper async/await
it('should create user', async () => {
  await request(app).post('/api/users').send(data);
});
```

## Common Test Scenarios

### Testing CRUD Operations
```javascript
describe('CRUD Operations', () => {
  it('should create (POST)', async () => { /* ... */ });
  it('should read all (GET)', async () => { /* ... */ });
  it('should read one (GET /:id)', async () => { /* ... */ });
  it('should update (PUT /:id)', async () => { /* ... */ });
  it('should delete (DELETE /:id)', async () => { /* ... */ });
});
```

### Testing Authentication Flow
```javascript
describe('Authentication Flow', () => {
  it('should register new user', async () => { /* ... */ });
  it('should login with credentials', async () => { /* ... */ });
  it('should get current user', async () => { /* ... */ });
  it('should refresh token', async () => { /* ... */ });
  it('should logout', async () => { /* ... */ });
});
```

### Testing Middleware
```javascript
describe('Auth Middleware', () => {
  it('should allow access with valid token', async () => { /* ... */ });
  it('should deny access without token', async () => { /* ... */ });
  it('should deny access with invalid token', async () => { /* ... */ });
  it('should deny access with expired token', async () => { /* ... */ });
});
```

### Testing Rate Limiting
```javascript
describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/login').send(data);
      expect(res.statusCode).not.toBe(429);
    }
  });

  it('should block requests exceeding limit', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app).post('/api/auth/login').send(data);
    }
    
    const res = await request(app).post('/api/auth/login').send(data);
    expect(res.statusCode).toBe(429);
  });
});
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - run: npm install
    - run: npm test -- --coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should register a new user"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Console Logs in Tests
```javascript
it('should debug', async () => {
  console.log('Debug info:', data);
  const res = await request(app).get('/api/endpoint');
  console.log('Response:', res.body);
});
```

## Troubleshooting

### Issue: Tests Timeout
**Solution:**
```javascript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 30000); // 30 second timeout

// Or in jest.config.js
testTimeout: 30000
```

### Issue: Database Not Cleaning
**Solution:**
```javascript
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
```

### Issue: Port Already in Use
**Solution:**
```javascript
// Use random port in tests
const server = app.listen(0);
const port = server.address().port;
```

### Issue: Async Operations Not Completing
**Solution:**
```javascript
// Add forceExit to jest.config.js
forceExit: true

// Or properly close connections
afterAll(async () => {
  await mongoose.disconnect();
  await server.close();
});
```

## Next Steps
1. Write tests for all controllers
2. Add integration tests for complex workflows
3. Set up CI/CD pipeline with automated testing
4. Implement E2E tests with Cypress or Playwright
5. Add performance testing with Artillery or k6
6. Set up test coverage reporting with Codecov

## Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://testingjavascript.com/)