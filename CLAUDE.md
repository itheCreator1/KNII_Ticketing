# CLAUDE.md - Project Context for AI Assistants

## Project Overview

KNII Ticketing System - A support ticket management application with public submission and admin management.

**Stack**: Node.js 20, Express 5.x, PostgreSQL 16, EJS templates, Docker
**Production**: PM2 cluster mode
**No ORM**: Raw SQL with pg driver

---

## Architecture

```
Request Flow:
Routes → Validators → Middleware → Services → Models → Database Pool

Directory Structure:
├── config/           # Database pool, session config
├── constants/        # Enums, messages, validation strings
├── middleware/       # Auth guards, error handler, validation runner
├── migrations/       # SQL files (run in order, never modify after deploy)
├── models/           # Static class methods for DB operations
├── routes/           # Express routers
├── services/         # Business logic layer
├── utils/            # Helper functions
├── validators/       # express-validator chains
└── views/            # EJS templates
```

---

## Database Schema

```sql
users (id, username, email, password_hash, role, status, login_attempts, last_login_at, password_changed_at, deleted_at, created_at, updated_at)
  - role: 'admin' | 'super_admin'
  - status: 'active' | 'inactive' | 'deleted'

tickets (id, title, description, status, priority, reporter_name, reporter_email, reporter_phone, assigned_to → users.id, created_at, updated_at)
  - status: 'open' | 'in_progress' | 'closed'
  - priority: 'low' | 'medium' | 'high' | 'critical'

comments (id, ticket_id → tickets.id, user_id → users.id, content, is_internal, created_at)

audit_logs (id, actor_id → users.id, action, target_type, target_id, details JSONB, ip_address, created_at)

session (sid, sess JSON, expire)  -- managed by connect-pg-simple
```

**Foreign Key Constraints**:
- `tickets.assigned_to` → `users.id` (SET NULL on delete)
- `comments.ticket_id` → `tickets.id` (CASCADE on delete)
- `comments.user_id` → `users.id` (CASCADE on delete)
- `audit_logs.actor_id` → `users.id` (no cascade)

---

## Authentication & Authorization

**Session-based auth** using express-session + connect-pg-simple.

**Middleware chain** (defined in middleware/auth.js):
```javascript
requireAuth      // Checks req.session.user exists, verifies user still active
requireAdmin     // Checks role is 'admin' or 'super_admin'
requireSuperAdmin // Checks role is 'super_admin' only
```

**Route protection**:
- `/admin/*` routes use `requireAuth`
- Ticket update routes add `requireAdmin`
- `/admin/users/*` routes add `requireSuperAdmin`

**Security features**:
- Account locks after 5 failed login attempts (login_attempts field)
- Passwords hashed with bcryptjs (cost 10)
- Session cookie: httpOnly, secure in production, sameSite strict
- CSRF protection on all state-changing requests (POST/PUT/DELETE)
- Rate limiting on login endpoint (10 attempts per 15 minutes per IP)

**CSRF Protection**: Using csrf-csrf (double-submit cookie pattern)
- All POST/PUT/DELETE requests require CSRF token
- Token generated per-request via `res.locals.csrfToken`
- Must be included in forms as hidden field: `<input type="hidden" name="_csrf" value="<%= csrfToken %>">`
- Automatically validated by doubleCsrfProtection middleware
- Cookie name: `__Host-psifi.x-csrf-token`
- Ignored methods: GET, HEAD, OPTIONS

---

## Critical Patterns

### 1. Database Queries
Always use parameterized queries. Never concatenate strings.
```javascript
// CORRECT
const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

// WRONG - SQL injection vulnerability
const result = await pool.query(`SELECT * FROM users WHERE id = ${id}`);
```

### 2. Flash Messages
Use constants and helpers:
```javascript
const { FLASH_KEYS } = require('../constants/messages');
const { successRedirect, errorRedirect } = require('../utils/responseHelpers');

// Usage
successRedirect(req, res, 'User created', '/admin/users');
errorRedirect(req, res, 'Failed to create user', '/admin/users/new');
```

### 3. Validators
Validators are arrays of express-validator middleware. Always pair with validateRequest:
```javascript
const { validateUserCreate } = require('../validators/userValidators');
const { validateRequest } = require('../middleware/validation');

router.post('/', validateUserCreate, validateRequest, async (req, res) => {
  // req.body is now validated
});
```

### 4. Models
Static class methods, not instantiated. Return raw rows:
```javascript
// CORRECT
const user = await User.findById(id);

// Models return result.rows[0] for single, result.rows for multiple
```

### 5. Services
Business logic lives here. Services call models, handle validation logic:
```javascript
// Services throw errors for business rule violations
async deleteUser(actorId, targetId, ipAddress) {
  if (actorId === targetId) {
    throw new Error('Cannot delete yourself');
  }
  // ...
}
```

### 6. Error Handling
- Routes wrap async code in try/catch, call next(error)
- Global error handler in middleware/errorHandler.js
- Production hides error details, development shows them

### 7. Rate Limiting
Rate limiting is implemented using express-rate-limit middleware in `middleware/rateLimiter.js`.

**loginLimiter**:
- Limits: 10 attempts per 15 minutes per IP
- Applied to: `/auth/login` endpoint
- Prevents: Brute force password attacks
- On limit exceeded: Redirects to login with flash message

**ticketSubmissionLimiter**:
- Limits: 5 submissions per hour per IP
- Applied to: `/submit-ticket` public endpoint
- Prevents: Spam and abuse of public submission form

Usage:
```javascript
const { loginLimiter } = require('../middleware/rateLimiter');
router.post('/login', loginLimiter, validateLogin, validateRequest, async (req, res) => {
  // ...
});
```

### 8. Logging
Structured logging using Winston in `utils/logger.js`.

**Usage**:
```javascript
const logger = require('../utils/logger');

logger.info('User logged in', { userId: user.id, username: user.username });
logger.error('Database error', { error: err.message, stack: err.stack });
logger.warn('Rate limit exceeded', { ip: req.ip });
```

**Log levels**: error, warn, info, debug
**Production**: Logs to files and console
**Development**: Console only with colorized output

---

## File Dependency Map

```
index.js
├── config/session.js → config/database.js
├── middleware/errorHandler.js
├── middleware/rateLimiter.js → express-rate-limit
├── utils/logger.js → winston (logging library)
├── routes/public.js → validators, services, models
├── routes/auth.js → validators, services, models, AuditLog
├── routes/admin.js → middleware/auth, validators, services, models
└── routes/users.js → middleware/auth, validators, services, models

services/userService.js → models/User, models/AuditLog, utils/passwordValidator
services/authService.js → models/User
services/ticketService.js → models/Ticket

models/* → config/database.js (pool)
```

---

## Common Tasks

### Add a new route
1. Create validator in `/validators/` if needed
2. Add route in appropriate `/routes/` file
3. Add service method in `/services/` if business logic needed
4. Add model method in `/models/` if new DB operation needed
5. Create view in `/views/` if HTML response

### Add a database column
1. Create new migration file: `migrations/007_description.sql`
2. Use `ALTER TABLE ... ADD COLUMN`
3. Update relevant model to use new column
4. Never modify existing migration files

### Add a new model method
```javascript
// In models/SomeModel.js
static async newMethod(params) {
  const result = await pool.query(
    'SELECT ... FROM ... WHERE ... = $1',
    [params]
  );
  return result.rows; // or result.rows[0] for single
}
```

### Add audit logging
```javascript
await AuditLog.create({
  actorId: req.session.user.id,
  action: 'ACTION_NAME',
  targetType: 'user|ticket|comment',
  targetId: targetId,
  details: { key: 'value' },
  ipAddress: req.ip
});
```

---

## Testing Changes Locally

```bash
# Full rebuild (clears data)
docker-compose down -v
docker-compose up --build

# Restart without data loss
docker-compose restart web

# View logs
docker-compose logs -f web

# Access database
docker-compose exec db psql -U ticketing_user -d ticketing_db

# Check if tables exist
docker-compose exec db psql -U ticketing_user -d ticketing_db -c "\dt"
```

**Default admin credentials**: admin / admin123

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| SESSION_SECRET | Yes | Min 32 chars for session encryption |
| NODE_ENV | Yes | 'development' or 'production' |
| PORT | No | Default 3000 |
| POSTGRES_USER | Docker | Database username |
| POSTGRES_PASSWORD | Docker | Database password |
| POSTGRES_DB | Docker | Database name |
| DB_PORT | Docker | Database port (default: 5432) |
| DOCKER_COMMAND | No | Docker deployment command (default: docker-compose) |
| RESTART_POLICY | No | PM2 restart policy (default: 'cluster') |

---

## Do Not

1. **Modify existing migration files** - Create new ones instead
2. **Use string concatenation in SQL** - Always parameterized queries
3. **Skip validators on routes** - Security vulnerability
4. **Call models directly from routes** - Use services for business logic
5. **Store sensitive data in session** - Only id, username, email, role
6. **Change session cookie settings** - Breaks existing sessions
7. **Remove requireAuth from admin routes** - Security vulnerability
8. **Use synchronous bcrypt methods** - Use async versions
9. **Forget to handle errors in async routes** - Wrap in try/catch
10. **Return password_hash from User model public methods** - Security risk

---

## Constants Reference

### User Roles (constants/enums.js)
```javascript
USER_ROLE.ADMIN = 'admin'
USER_ROLE.SUPER_ADMIN = 'super_admin'
```

### User Status
```javascript
USER_STATUS.ACTIVE = 'active'
USER_STATUS.INACTIVE = 'inactive'
USER_STATUS.DELETED = 'deleted'
```

### Ticket Status
```javascript
TICKET_STATUS.OPEN = 'open'
TICKET_STATUS.IN_PROGRESS = 'in_progress'
TICKET_STATUS.CLOSED = 'closed'
```

### Ticket Priority
```javascript
TICKET_PRIORITY.LOW = 'low'
TICKET_PRIORITY.MEDIUM = 'medium'
TICKET_PRIORITY.HIGH = 'high'
TICKET_PRIORITY.CRITICAL = 'critical'
```

### Validation Messages (constants/validation.js)
```javascript
VALIDATION_MESSAGES.USERNAME_INVALID
VALIDATION_MESSAGES.EMAIL_INVALID
VALIDATION_MESSAGES.EMAIL_IN_USE
VALIDATION_MESSAGES.PASSWORD_REQUIRED
VALIDATION_MESSAGES.PASSWORD_TOO_SHORT
VALIDATION_MESSAGES.PASSWORD_COMPLEXITY
VALIDATION_MESSAGES.TITLE_REQUIRED
VALIDATION_MESSAGES.DESCRIPTION_REQUIRED
// ... and more
```

All validation error messages use these constants for consistency.

### Message Constants (constants/messages.js)
```javascript
AUTH_MESSAGES = { LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT_SUCCESS, UNAUTHORIZED, FORBIDDEN, SUPER_ADMIN_REQUIRED }
TICKET_MESSAGES = { CREATED, UPDATED, NOT_FOUND, LOAD_FAILED, etc. }
COMMENT_MESSAGES = { CREATED, DELETED, etc. }
USER_MESSAGES = { CREATED, UPDATED, DELETED, PASSWORD_RESET, STATUS_UPDATED, etc. }
```

---

## Views Structure

```
views/
├── admin/
│   ├── dashboard.ejs      # Ticket list with filters
│   ├── ticket-detail.ejs  # Single ticket view/edit
│   └── users/
│       ├── index.ejs      # User list (super_admin only)
│       ├── create.ejs     # New user form
│       └── edit.ejs       # Edit user + password reset
├── auth/
│   └── login.ejs          # Login form
├── errors/
│   ├── 404.ejs
│   └── 500.ejs
├── partials/
│   ├── header.ejs         # Nav bar with conditional user management link
│   ├── footer.ejs
│   └── flash.ejs          # Flash message display
└── public/
    ├── submit-ticket.ejs  # Public ticket form
    └── success.ejs        # Submission confirmation
```

**Template variables available globally** (set in index.js middleware):
- `success_msg` - Array of success flash messages
- `error_msg` - Array of error flash messages
- `user` - Session user object or null
- `csrfToken` - CSRF token for form submissions (required for POST/PUT/DELETE)

**CSRF token usage in forms**:
```ejs
<form method="POST" action="/some/endpoint">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- form fields -->
</form>
```

---

## Git Workflow

Follow rules in `docs/git_rules.md`:
- Never commit directly to main
- Use feature branches: `feature/`, `fix/`, `refactor/`, `chore/`
- Atomic commits with clear messages
- All changes via Pull Requests

---

## Quick Fixes for Common Issues

### Account locked
```sql
UPDATE users SET login_attempts = 0 WHERE username = 'USERNAME';
```

### User not showing in management
```sql
-- Check if soft-deleted
SELECT * FROM users WHERE status = 'deleted';
```

### Session issues
```bash
# Clear all sessions
docker-compose exec db psql -U ticketing_user -d ticketing_db -c "TRUNCATE session;"
```

### Database not initialized
```bash
docker-compose exec web node scripts/init-db.js
```