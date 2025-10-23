# Contributing to  Exam Study Planner

Thank you for your interest in contributing to the  Exam Study Planner! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug Reports** - Help us identify and fix issues
- **✨ Feature Requests** - Suggest new functionality
- **💻 Code Contributions** - Submit bug fixes or new features
- **📖 Documentation** - Improve or expand documentation
- **🧪 Testing** - Help improve test coverage
- **🎨 UI/UX Improvements** - Enhance user experience

### Getting Started

1. **Fork the Repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/your-username/-exam-planner.git
   cd -exam-planner
   ```

2. **Set Up Development Environment**
   ```bash
   # Install dependencies
   npm run install-all
   
   # Set up environment variables
   cp .env.sample .env
   # Edit .env with your configuration
   
   # Start development servers
   npm run dev
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

## 🏗️ Development Guidelines

### Code Style

#### Backend (Node.js/Express)
- Use ES6+ features and async/await
- Follow consistent naming conventions (camelCase for variables, PascalCase for models)
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Handle errors appropriately with try-catch blocks

```javascript
// Good
const getUserBooks = async (userId) => {
  try {
    const books = await Book.find({ user: userId });
    return books;
  } catch (error) {
    throw new Error(`Failed to fetch user books: ${error.message}`);
  }
};

// Avoid
const getBooks = (id) => {
  return Book.find({ user: id });
};
```

#### Frontend (React/TypeScript)
- Use TypeScript for all new components
- Follow React Hooks best practices
- Use meaningful component and prop names
- Implement proper error boundaries
- Use the existing design system (shadcn/ui components)

```typescript
// Good
interface BookCardProps {
  book: Book;
  onUpdateProgress: (bookId: string, progress: number) => void;
  isLoading?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  onUpdateProgress, 
  isLoading = false 
}) => {
  // Component implementation
};

// Avoid
const BookCard = (props) => {
  // Component implementation
};
```

### Project Structure

#### Adding New Features

1. **Backend API Endpoint**
   ```
   models/         - Add Mongoose schema
   controllers/    - Add business logic
   routes/         - Define API routes
   middleware/     - Add any custom middleware
   ```

2. **Frontend Component**
   ```
   components/     - Add reusable components
   pages/          - Add page components
   api/            - Add API service functions
   redux/slices/   - Add state management
   ```

### Database Guidelines

- Use Mongoose for MongoDB operations
- Define proper schema validation
- Use indexes for frequently queried fields
- Implement soft deletes where appropriate
- Follow consistent naming conventions

```javascript
// Good schema definition
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true
});
```

### API Design

- Follow RESTful conventions
- Use consistent response formats
- Implement proper error handling
- Add input validation
- Include appropriate HTTP status codes

```javascript
// Good API response format
res.status(200).json({
  success: true,
  data: books,
  message: 'Books retrieved successfully',
  pagination: {
    page: 1,
    totalPages: 5,
    totalItems: 50
  }
});
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
npm test

# Frontend tests
cd client && npm test

# Linting
npm run lint
cd client && npm run lint
```

### Writing Tests

- Write unit tests for utility functions
- Add integration tests for API endpoints
- Include component tests for React components
- Test error scenarios and edge cases

### Test Structure

```javascript
// API endpoint test example
describe('POST /api/books', () => {
  it('should create a new book for authenticated user', async () => {
    const bookData = {
      title: 'Test Book',
      subject: 'History',
      totalChapters: 10
    };

    const response = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${authToken}`)
      .send(bookData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(bookData.title);
  });
});
```

## 📝 Documentation

### Code Documentation

- Add JSDoc comments for functions and classes
- Include usage examples in complex functions
- Document API endpoints with request/response examples
- Keep documentation up to date with code changes

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add password reset functionality
fix(books): resolve progress calculation bug
docs(api): update authentication endpoint docs
```

## 🔄 Pull Request Process

### Before Submitting

1. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   ```

2. **Update Documentation**
   - Update API documentation if needed
   - Add or update code comments
   - Update README if necessary

3. **Check Your Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-feature-branch
   git rebase main
   ```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other (please describe)

## Testing
- [ ] All tests pass
- [ ] New tests added (if applicable)
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or marked as such)
- [ ] Linked to relevant issue
```

### Review Process

1. **Automated Checks** - All CI checks must pass
2. **Code Review** - At least one maintainer review required
3. **Testing** - Manual testing by reviewers if needed
4. **Approval** - Maintainer approval required for merge

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues to avoid duplicates
2. Try to reproduce the bug consistently
3. Test with the latest version

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome 90, Safari 14]
- Node.js version: [e.g., 18.15.0]
- App version: [e.g., 1.0.0]

## Screenshots
Add screenshots if applicable

## Additional Context
Any other relevant information
```

## ✨ Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Any other relevant information

## Implementation Ideas
If you have implementation suggestions
```

## 🏷️ Issue Labels

We use the following labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation related
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority:high` - High priority issue
- `priority:medium` - Medium priority issue
- `priority:low` - Low priority issue
- `frontend` - Frontend related
- `backend` - Backend related
- `api` - API related
- `ui/ux` - User interface/experience
- `performance` - Performance related
- `security` - Security related

## 🎯 Development Priorities

### High Priority
- Bug fixes affecting core functionality
- Security vulnerabilities
- Performance improvements
- Critical user experience issues

### Medium Priority
- New features with clear user value
- Code refactoring and technical debt
- Documentation improvements
- Test coverage improvements

### Low Priority
- Nice-to-have features
- Minor UI improvements
- Code style improvements

## 🛡️ Security

### Reporting Security Issues

**DO NOT** report security vulnerabilities through public GitHub issues.

Instead, please email security@examplanner.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

### Security Guidelines

- Never commit sensitive data (passwords, API keys, etc.)
- Use environment variables for configuration
- Validate all user inputs
- Implement proper authentication and authorization
- Follow OWASP security practices

## 🌟 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special mentions in documentation

## 📞 Getting Help

- **General Questions**: Open a [GitHub Discussion](https://github.com/your-username/-exam-planner/discussions)
- **Bug Reports**: Create a [GitHub Issue](https://github.com/your-username/-exam-planner/issues)
- **Feature Requests**: Create a [GitHub Issue](https://github.com/your-username/-exam-planner/issues)
- **Direct Contact**: contributors@examplanner.com

## 📜 Code of Conduct

Please note that this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.

---

Thank you for contributing to the  Exam Study Planner! Your efforts help thousands of students in their exam preparation journey. 🎓
