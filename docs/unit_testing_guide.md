# Unit Testing Guide - KNII Ticketing System

## Table of Contents
1. [Quick Start](#quick-start)
2. [Running Tests](#running-tests)
3. [Test Infrastructure](#test-infrastructure)
4. [Writing Your First Test](#writing-your-first-test)
5. [Test Patterns & Examples](#test-patterns--examples)
6. [Helper Utilities](#helper-utilities)
7. [Coverage Reports](#coverage-reports)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Next Steps](#next-steps)

---

## Quick Start

### Installation
The testing infrastructure is already set up! Dependencies are installed and configuration is complete.

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit
```

### Current Status
- ✅ **Jest** installed and configured
- ✅ **Test helpers** created (factories, mocks, assertions)
- ✅ **50 tests** written (User model + passwordValidator)
- ✅ **79% coverage** on User model
- ✅ **100% coverage** on passwordValidator

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- tests/unit/models/User.test.js
npm test -- tests/unit/utils/passwordValidator.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should create user"
npm test -- --testNamePattern="password"
```

### Watch Mode (Development)
```bash
npm run test:watch
```
This will automatically re-run tests when you save files.

### Generate Coverage Report
```bash
npm run test:coverage
```
Opens an HTML report at `coverage/index.html`

---

## Test Infrastructure

### Directory Structure
```
tests/
├── unit/                          # Unit tests (isolated, mocked)
│   ├── models/                    # Model tests
│   │   └── User.test.js          ✅ Complete (35 tests)
│   ├── services/                  # Service tests
│   ├── utils/                     # Utility tests
│   │   └── passwordValidator.test.js  ✅ Complete (15 tests)
│   ├── validators/                # Validator tests
│   └── middleware/                # Middleware tests
├── fixtures/                      # Static test data
│   ├── users.js                   ✅ Complete
│   ├── tickets.js                 ✅ Complete
│   └── comments.js                ✅ Complete
├── helpers/                       # Test utilities
│   ├── database.js                ✅ Transaction helpers
│   ├── factories.js               ✅ Dynamic data generators
│   ├── mocks.js                   ✅ Mock objects
│   └── assertions.js              ✅ Custom matchers
└── setup.js                       ✅ Global test configuration
```

### Configuration Files
- **`jest.config.js`** - Jest configuration with 70% coverage thresholds
- **`.env.test`** - Test environment variables
- **`tests/setup.js`** - Global setup (loaded before all tests)

---

## Writing Your First Test

### The AAA Pattern
Every test follows the **Arrange-Act-Assert** pattern:

```javascript
it('should create user with hashed password', async () => {
  // Arrange - Set up test data and mocks
  const userData = createUserData();
  const hashedPassword = 'hashed_password_123';
  bcrypt.hash.mockResolvedValue(hashedPassword);
  pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

  // Act - Execute the function being tested
  const result = await User.create(userData);

  // Assert - Verify the result
  expect(result).toBeDefined();
  expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
});
```

### Test Naming Convention
Use descriptive names: `should <expected behavior> when <condition>`

**Good examples:**
- `should return user without password_hash when user exists`
- `should reject passwords under 8 characters`
- `should increment login_attempts by 1`

**Bad examples:**
- `test user findById` (not descriptive)
- `it works` (meaningless)
- `should work correctly` (vague)

---

## Test Patterns & Examples

### Pattern 1: Testing Models (with Mocked Database)

**File:** `tests/unit/models/User.test.js`

```javascript
const User = require('../../../models/User');
const { createMockPool } = require('../../helpers/mocks');

// Mock dependencies
jest.mock('../../../config/database');
jest.mock('bcryptjs');
jest.mock('../../../utils/logger');

const pool = require('../../../config/database');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  let mockPool;

  beforeEach(() => {
    mockPool = createMockPool();
    Object.assign(pool, mockPool);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user without password_hash when user exists', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        status: 'active'
      };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      // Act
      const result = await User.findById(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, email'),
        [1]
      );
    });

    it('should return undefined when user does not exist', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await User.findById(999);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw error on database failure', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      pool.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(User.findById(1)).rejects.toThrow('Database connection failed');
    });
  });
});
```

**Key Points:**
- Mock `pool.query()` to simulate database responses
- Mock `bcrypt` for password operations
- Mock `logger` to suppress log output
- Test success, failure, and edge cases

### Pattern 2: Testing Pure Functions (No Mocking Needed)

**File:** `tests/unit/utils/passwordValidator.test.js`

```javascript
const { validatePassword } = require('../../../utils/passwordValidator');

describe('passwordValidator', () => {
  describe('validatePassword', () => {
    it('should reject passwords under 8 characters', () => {
      // Arrange
      const password = 'Short1!';

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should accept passwords meeting all requirements', () => {
      // Arrange
      const password = 'ValidPass123!';

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
```

**Key Points:**
- No mocking needed for pure functions
- Test all validation rules
- Test both valid and invalid inputs

### Pattern 3: Testing Services (Mock Models)

**Example structure for `tests/unit/services/authService.test.js`:**

```javascript
const authService = require('../../../services/authService');
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('bcryptjs');
jest.mock('../../../models/AuditLog');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should return user on successful authentication', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: 'hashed_password',
        status: 'active',
        login_attempts: 0
      };
      User.findByUsernameWithPassword.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      User.updateLastLogin.mockResolvedValue();

      // Act
      const result = await authService.authenticate('testuser', 'password123');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.password_hash).toBeUndefined(); // Should not return password
      expect(User.updateLastLogin).toHaveBeenCalledWith(1);
    });

    it('should return null when password is incorrect', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: 'hashed_password',
        status: 'active'
      };
      User.findByUsernameWithPassword.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      User.incrementLoginAttempts.mockResolvedValue();

      // Act
      const result = await authService.authenticate('testuser', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
      expect(User.incrementLoginAttempts).toHaveBeenCalledWith('testuser');
    });
  });
});
```

**Key Points:**
- Mock model methods (User.findById, User.create, etc.)
- Mock bcrypt for password comparisons
- Test business logic flows
- Verify side effects (audit logs, login attempts, etc.)

### Pattern 4: Testing Middleware (Mock req/res/next)

**Example structure for `tests/unit/middleware/auth.test.js`:**

```javascript
const { requireAuth } = require('../../../middleware/auth');
const { createMockRequest, createMockResponse, createMockNext } = require('../../helpers/mocks');
const User = require('../../../models/User');

jest.mock('../../../models/User');

describe('auth middleware', () => {
  describe('requireAuth', () => {
    it('should call next() when session user exists and is active', async () => {
      // Arrange
      const req = createMockRequest({
        session: { user: { id: 1, username: 'testuser' } }
      });
      const res = createMockResponse();
      const next = createMockNext();

      User.findById.mockResolvedValue({ id: 1, status: 'active' });

      // Act
      await requireAuth(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('should redirect to login when no session exists', async () => {
      // Arrange
      const req = createMockRequest({ session: {} });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await requireAuth(req, res, next);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
      expect(next).not.toHaveBeenCalled();
    });
  });
});
```

**Key Points:**
- Use `createMockRequest`, `createMockResponse`, `createMockNext` helpers
- Test authorization logic
- Verify redirects and error handling

---

## Helper Utilities

### Factories (Dynamic Test Data)

**Location:** `tests/helpers/factories.js`

```javascript
const { createUserData, createTicketData } = require('../../helpers/factories');

// Generate unique user data
const userData = createUserData();
// { username: 'user_123_abc', email: 'test_123@example.com', password: 'ValidPass123!', role: 'admin' }

// Override specific fields
const superAdmin = createUserData({ role: 'super_admin' });

// Generate unique ticket data
const ticketData = createTicketData({ priority: 'critical' });
```

**When to use:** When you need unique data for each test to avoid conflicts.

### Fixtures (Static Test Data)

**Location:** `tests/fixtures/users.js`, `tests/fixtures/tickets.js`

```javascript
const { validAdminUser, invalidPasswords } = require('../../fixtures/users');

// Use static reference data
const user = validAdminUser;

// Test all invalid passwords
invalidPasswords.forEach(password => {
  const result = validatePassword(password);
  expect(result.isValid).toBe(false);
});
```

**When to use:** For reference data that doesn't need to be unique (validation rules, enum values).

### Mocks (Mock Objects)

**Location:** `tests/helpers/mocks.js`

```javascript
const {
  createMockPool,
  createMockRequest,
  createMockResponse,
  createMockNext
} = require('../../helpers/mocks');

// Mock database pool
const mockPool = createMockPool();
mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });

// Mock Express req/res/next
const req = createMockRequest({ body: { username: 'test' } });
const res = createMockResponse();
const next = createMockNext();
```

### Custom Assertions

**Location:** `tests/helpers/assertions.js`

```javascript
// Custom matchers available in all tests
expect(ticket).toBeValidTicket();
expect(user).toBeValidUser();
expect(user).toBeActiveUser();
expect(ticket).toHaveValidTimestamps();
```

### Database Helpers (For Future Integration Tests)

**Location:** `tests/helpers/database.js`

```javascript
const { setupTestDatabase, teardownTestDatabase } = require('../../helpers/database');

// Transaction-based isolation
beforeEach(setupTestDatabase);  // BEGIN transaction
afterEach(teardownTestDatabase); // ROLLBACK transaction
```

---

## Coverage Reports

### Generate Coverage
```bash
npm run test:coverage
```

### View HTML Report
```bash
# Report generated at:
open coverage/index.html
```

### Current Coverage
```
User Model:            79.34% statements, 64.10% branches
passwordValidator:     100%   statements, 100%  branches
Overall Target:        70%+   (currently at ~21% due to untested files)
```

### Coverage Thresholds (jest.config.js)
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

---

## Best Practices

### 1. One Concept Per Test
**Good:**
```javascript
it('should create user with hashed password', async () => {
  const user = await User.create(userData);
  expect(user.id).toBeDefined();
  expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
});
```

**Bad:**
```javascript
it('should handle all user operations', async () => {
  const user = await User.create(userData);       // Concept 1
  const found = await User.findById(user.id);     // Concept 2
  await User.delete(user.id);                     // Concept 3
});
```

### 2. Use Descriptive Test Names
**Good:**
```javascript
it('should return null when login_attempts >= 5')
it('should reset login_attempts to 0 on successful login')
```

**Bad:**
```javascript
it('test login')
it('works correctly')
```

### 3. Follow AAA Pattern
Always structure tests as:
1. **Arrange** - Set up test data and mocks
2. **Act** - Execute the function
3. **Assert** - Verify the result

### 4. Mock External Dependencies
- Models: Mock `pool.query()`
- Services: Mock model methods
- Middleware: Mock `req`, `res`, `next`
- Always mock `logger` to reduce noise

### 5. Test Both Success and Failure
```javascript
describe('create', () => {
  it('should create user with valid data', async () => { /* ... */ });
  it('should throw error on duplicate username', async () => { /* ... */ });
  it('should throw error on duplicate email', async () => { /* ... */ });
});
```

### 6. Use Factories for Unique Data
```javascript
// Good - unique data per test
const userData = createUserData();

// Bad - hardcoded data can cause conflicts
const userData = { username: 'testuser', email: 'test@example.com' };
```

### 7. Clear Mocks Between Tests
```javascript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 8. Test Edge Cases
- Empty arrays
- Null/undefined values
- Boundary conditions
- Error scenarios

---

## Troubleshooting

### Tests Fail with "Cannot find module"
**Solution:** Ensure paths are relative from the test file:
```javascript
const User = require('../../../models/User');  // Correct
const User = require('models/User');           // Wrong
```

### Mock Not Working
**Solution:** Mock the module before requiring it:
```javascript
jest.mock('../../../config/database');  // Mock first
const pool = require('../../../config/database');  // Then require
```

### "Pool.query is not a function"
**Solution:** Assign mock to pool object:
```javascript
const mockPool = createMockPool();
Object.assign(pool, mockPool);  // Copy all mock methods
```

### Tests Pass Locally but Fail in CI
**Solution:**
- Check for hardcoded data causing conflicts
- Use factories for unique data
- Ensure `beforeEach` clears mocks

### Coverage Not Updating
**Solution:** Delete coverage directory and regenerate:
```bash
rm -rf coverage
npm run test:coverage
```

---

## Next Steps

### Continue Building Tests

Based on the plan in `/home/ahead/.claude/plans/idempotent-tickling-seal.md`, continue writing tests for:

#### Priority: HIGH (Complete These First)
1. **Models** (Remaining 3 models)
   - `tests/unit/models/Ticket.test.js` (~35-40 tests)
   - `tests/unit/models/Comment.test.js` (~25-30 tests)
   - `tests/unit/models/AuditLog.test.js` (~15-20 tests)

2. **Services** (All 3 services)
   - `tests/unit/services/authService.test.js` (~25-30 tests)
   - `tests/unit/services/userService.test.js` (~40-45 tests)
   - `tests/unit/services/ticketService.test.js` (~35-40 tests)

3. **Middleware** (Security critical)
   - `tests/unit/middleware/auth.test.js` (~15-18 tests)
   - `tests/unit/middleware/validation.test.js` (~10-12 tests)
   - `tests/unit/middleware/errorHandler.test.js` (~8-10 tests)

#### Priority: MEDIUM
4. **Utils** (Remaining utilities)
   - `tests/unit/utils/responseHelpers.test.js` (~8-10 tests)
   - `tests/unit/utils/logger.test.js` (~5-8 tests, optional)

5. **Validators** (All validators)
   - `tests/unit/validators/authValidators.test.js` (~6-8 tests)
   - `tests/unit/validators/userValidators.test.js` (~12-15 tests)
   - `tests/unit/validators/ticketValidators.test.js` (~15-18 tests)
   - `tests/unit/validators/commentValidators.test.js` (~6-8 tests)

### Test Writing Checklist

For each component:
- [ ] Create test file in appropriate directory
- [ ] Mock all external dependencies
- [ ] Follow AAA pattern
- [ ] Test success cases
- [ ] Test failure cases
- [ ] Test edge cases
- [ ] Run tests: `npm test`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Aim for 70%+ coverage on each file

### Reference Examples

Use these completed tests as templates:
- **`tests/unit/models/User.test.js`** - Complete model test (35 tests)
- **`tests/unit/utils/passwordValidator.test.js`** - Pure function test (15 tests)

### Future: Integration Tests

After unit tests are complete (70%+ coverage), add integration tests:
- Test routes with real database using `supertest`
- Use transaction rollback for isolation
- Test complete workflows (authentication, ticket lifecycle)

### Future: E2E Tests

After integration tests:
- Test complete user journeys
- Test critical paths end-to-end
- Verify security constraints

---

## Quick Reference

### Common Jest Matchers
```javascript
expect(value).toBe(expected)              // Strict equality (===)
expect(value).toEqual(expected)           // Deep equality
expect(value).toBeDefined()               // Not undefined
expect(value).toBeUndefined()             // Is undefined
expect(value).toBeNull()                  // Is null
expect(value).toBeTruthy()                // Boolean true
expect(value).toBeFalsy()                 // Boolean false
expect(array).toHaveLength(number)        // Array length
expect(array).toContain(item)             // Array includes
expect(string).toMatch(/regex/)           // String matches
expect(fn).toHaveBeenCalled()             // Mock was called
expect(fn).toHaveBeenCalledWith(arg)      // Mock called with arg
expect(fn).toThrow('error')               // Function throws
await expect(promise).rejects.toThrow()   // Async error
await expect(promise).resolves.toBe(val)  // Async success
```

### Custom Matchers (KNII-specific)
```javascript
expect(ticket).toBeValidTicket()
expect(user).toBeValidUser()
expect(user).toBeActiveUser()
expect(account).toBeLockedAccount()
expect(obj).toHaveValidTimestamps()
```

### Test Commands
```bash
npm test                        # Run all tests
npm run test:watch              # Watch mode
npm run test:coverage           # With coverage
npm test -- path/to/file        # Specific file
npm test -- --testNamePattern   # Pattern match
```

---

## Summary

You now have a complete unit testing foundation with:
- ✅ Jest configured with 70% coverage thresholds
- ✅ Test helpers (factories, mocks, assertions)
- ✅ 50 working tests as examples
- ✅ Clear patterns for models, services, utils, middleware
- ✅ Documentation and best practices

**Next:** Write tests for remaining components following the patterns in User.test.js and passwordValidator.test.js.

**Goal:** 315-375 total unit tests with 70%+ coverage across all components.

For detailed implementation plan, see: `/home/ahead/.claude/plans/idempotent-tickling-seal.md`
