# KNII Ticketing System

**Professional Support Ticket Management Platform**

[![CI](https://github.com/itheCreator1/KNII_Ticketing/actions/workflows/ci.yml/badge.svg)](https://github.com/itheCreator1/KNII_Ticketing/actions/workflows/ci.yml)
[![Lint](https://github.com/itheCreator1/KNII_Ticketing/actions/workflows/lint.yml/badge.svg)](https://github.com/itheCreator1/KNII_Ticketing/actions/workflows/lint.yml)
![Node.js 20](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![Express 5.x](https://img.shields.io/badge/Express-5.x-000000?logo=express)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![Tests](https://img.shields.io/badge/Tests-797%2F945%20Passing-orange)
![Coverage](https://img.shields.io/badge/Coverage-84%25-orange)

**Version**: 2.3.0 | [Features](#features) | [Architecture](#architecture) | [Quick Start](#quick-start) | [Documentation](#documentation)

---

## What's New in v2.3.0 ⚡

- **CI/CD Automation**: GitHub Actions workflows for automated testing and linting
- **Test Infrastructure**: Improved test reliability (73% → 84.3% pass rate)
- **Performance**: Composite indexes provide 50-80% query improvement
- **Security**: Admin mutation rate limiting and search input sanitization

---

## Features

**Dual-Portal Architecture**: Separate client portal for departments and admin portal for support staff.

### Department Portal (`/client/*`)
- Create and manage department tickets
- View tickets from own department only
- Add public comments
- Update ticket status (waiting_on_admin, closed)
- Auto-populated department information

### Admin Portal (`/admin/*`)
- Manage all tickets (department + internal)
- Create department tickets on behalf of users
- Create internal admin-only tickets
- Add public or internal comments (visibility control)
- Assign tickets to support staff
- Complete workflow management
- User management (super_admin only)
- Department management (super_admin only)

### Core Capabilities
- **Authentication**: Session-based auth with bcrypt (cost 10)
- **Authorization**: Role-based access control (super_admin, admin, department)
- **Audit Trail**: Complete logging of administrative actions
- **Rate Limiting**: Login protection (10/15min), Admin mutations (20/min)
- **Security**: CSRF protection, SQL injection prevention, search sanitization
- **Workflow States**: open, in_progress, waiting_on_admin, waiting_on_department, closed

---

## 🏗️ Architecture

**Stack**: Node.js 20 | Express 5.x | PostgreSQL 16 | EJS | Docker | PM2

**Pattern**: Routes → Validators → Middleware → Services → Models → Database

```
Request Flow:
  HTTP Request
    → Rate Limiter (login/mutations)
    → CSRF Protection
    → Authentication (requireAuth)
    → Authorization (requireAdmin/requireSuperAdmin/requireDepartment)
    → Input Validation (express-validator)
    → Route Handler
      → Service Layer (business logic)
        → Model Layer (data access)
          → PostgreSQL Database
    ← Response (redirect/render)
```

**Directory Structure**:
```
├── config/           # Database pool, session config
├── constants/        # Enums, messages, validation rules
├── middleware/       # Auth, validation, error handling, rate limiting
├── migrations/       # 25 SQL migrations (sequential)
├── models/           # Static class methods for DB ops
├── routes/           # Express routers (public, auth, admin, client)
├── services/         # Business logic layer
├── utils/            # Helpers (logger, sanitization, password validation)
├── validators/       # express-validator chains
└── views/            # EJS templates
```

See: **[Node.js Development Rules](docs/node_js.md)** for comprehensive architecture documentation.

---

## 🛡️ Security & Compliance

**Zero Known Vulnerabilities** | **98% Code Quality Compliance**

### Security Features
- Parameterized SQL queries (all queries)
- Input validation (express-validator)
- CSRF protection (double-submit cookie)
- Rate limiting (authentication + admin mutations)
- Search input sanitization (SQL wildcard escaping)
- Password hashing (bcrypt cost 10)
- Account lockout (5 failed attempts)
- Session security (httpOnly, secure, sameSite strict)
- Audit logging (all admin actions)
- Department-based access control
- Internal ticket visibility

### Compliance
- **OWASP Top 10**: SQL Injection ✓ | XSS ✓ | CSRF ✓ | Authentication ✓
- **Session Management**: Secure cookies, automatic invalidation
- **Data Protection**: Minimal session data, no sensitive logging
- **Access Control**: Role-based (RBAC), ownership verification

See: **[Node.js Development Rules](docs/node_js.md)** for security patterns.

---

## 🧪 Testing & Quality

**Test Suite**: 797 passing / 945 total (84.3% pass rate)

### Test Breakdown
| Category | Passing | Total | Pass Rate | Status |
|----------|---------|-------|-----------|--------|
| Unit Tests | 416 | 416 | 100% | ✅ |
| Database Tests | 112 | 112 | 100% | ✅ |
| Integration/E2E | 269 | 417 | 64.5% | 🔄 |

### Coverage
- **Thresholds**: 70% minimum (branches, functions, lines, statements)
- **Enforcement**: Jest enforces thresholds on every run
- **Current**: ~70-80% across critical paths

### Test Infrastructure (v2.3.0)
- Transaction-based isolation for unit tests
- FK-aware database cleanup
- Floor seeding for department constraints
- Migration testing (all 25 migrations validated)
- Schema integrity validation

### Running Tests
```bash
npm test                  # All tests (945)
npm run test:unit         # Unit tests only (416)
npm run test:integration  # Integration + E2E + Database (529)
npm run test:coverage     # Generate coverage report
```

See: **[Testing Guidelines](docs/testing_rules.md)** for comprehensive testing documentation.

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 16+ (or use Docker)

### Development Setup

**Option 1: Docker (Recommended)**

```bash
# Clone repository
git clone https://github.com/itheCreator1/KNII_Ticketing.git
cd KNII_Ticketing

# Start services (PostgreSQL + App)
docker-compose up --build

# Application: http://localhost:3000
# PostgreSQL: localhost:5432
```

**Option 2: Local**

```bash
# Install dependencies
npm install

# Setup database
cp .env.example .env
# Edit .env with your PostgreSQL connection details

# Run migrations
node scripts/init-db.js

# Seed hospital data (optional)
npm run seed:hospital

# Start development server
npm run dev  # Runs on port 3000
```

### Default Credentials

```
Username: admin
Password: admin123
Role: super_admin
```

⚠️ **Change default password immediately in production**

### Verification

1. Access application: `http://localhost:3000`
2. Login with default credentials
3. Navigate to Admin Dashboard
4. Create test ticket
5. Run tests: `npm test`

---

## 📚 Documentation

Comprehensive documentation covering all aspects of development, deployment, and maintenance.

### Core Guides
- **[Node.js Development Rules](docs/node_js.md)** (2,470 lines) - Coding standards, architecture patterns, security best practices
- **[Debugging & Troubleshooting](docs/debug_rules.md)** (4,085 lines) - Logging infrastructure, error handling, performance debugging
- **[Testing Guidelines](docs/testing_rules.md)** (850+ lines) - Test structure, patterns, and best practices
- **[CI/CD Guide](docs/ci-cd.md)** (480+ lines) - GitHub Actions, ESLint, Prettier, troubleshooting

### Operational Guides
- **[Git Workflow](docs/git_rules.md)** - Branching strategy, commit standards, PR discipline
- **[Deployment Guide](docs/howToDeploy.md)** - Docker production, PM2 cluster mode, environment setup
- **[Customization Guide](docs/customisation_guide.md)** - Floors, departments, and configuration

### Reference
- **[Performance Baseline](docs/performance-baseline.md)** - SLA targets, benchmark results, optimization patterns
- **[CLAUDE.md](CLAUDE.md)** - Complete project context for AI assistants

---

## Development

### Commands

```bash
# Development
npm run dev              # Start dev server (nodemon)
npm start                # Start production server

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration + E2E
npm run test:coverage    # Generate coverage report
npm run test:watch       # Watch mode

# Code Quality
npm run lint             # Check code with ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Auto-format with Prettier
npm run format:check     # Check formatting

# Database
node scripts/init-db.js          # Run migrations
npm run seed:hospital            # Seed hospital data
npm run seed:sample              # Seed sample tickets
node scripts/reset-passwords.js  # Reset all passwords (dev only)

# CI/CD
# Automated via GitHub Actions on push/PR
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, format, lint, test
npm run format
npm run lint
npm test

# Commit with clear message
git add .
git commit -m "feat: add new feature

- Implemented feature X
- Added tests
- Updated documentation"

# Push and create PR
git push -u origin feature/my-feature
```

See: **[Git Workflow Rules](docs/git_rules.md)**

### CI/CD

GitHub Actions automatically:
- Runs full test suite on Node.js 18, 20, 22
- Generates test coverage reports
- Enforces ESLint and Prettier standards
- Checks for security vulnerabilities
- Comments coverage on PRs

**CI Status**: Check badges at top of README

See: **[CI/CD Guide](docs/ci-cd.md)** for troubleshooting CI failures.

---

## Deployment

### Production Deployment (Docker)

```bash
# Build production image
docker-compose -f docker-compose.prod.yml up --build -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec web node scripts/init-db.js

# Verify deployment
docker-compose -f docker-compose.prod.yml logs -f web
```

### Environment Variables

Required environment variables (`.env`):

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
DB_PORT=5432

# Security
SESSION_SECRET=your-secret-min-32-chars  # REQUIRED: Min 32 characters
NODE_ENV=production  # production|development|test

# Application
PORT=3000
LOG_LEVEL=info  # error|warn|info|debug

# Docker (optional)
DOCKER_COMMAND=docker-compose
RESTART_POLICY=cluster
```

### Migration Checklist

Before deploying v2.3.0:

- [ ] Run all 25 migrations (000-025)
- [ ] Verify composite indexes created (Migration 025)
- [ ] Update SESSION_SECRET (min 32 chars)
- [ ] Set NODE_ENV=production
- [ ] Configure LOG_LEVEL appropriately
- [ ] Test rate limiters work (login + admin mutations)
- [ ] Verify CI/CD workflows pass
- [ ] Run `npm test` in staging
- [ ] Check performance with new indexes
- [ ] Backup database before migration

See: **[Deployment Guide](docs/howToDeploy.md)** for comprehensive deployment instructions.

---

## Database Schema

**25 Migrations** (000-025) | **7 Tables** | **FK Constraints** | **Composite Indexes**

### Key Tables
- `floors` (8 predefined) - Building floor locations (v2.2.0+)
- `departments` (customizable) - Department management with floor FK (v2.2.0+)
- `users` (RBAC) - Authentication with department FK
- `tickets` (workflow) - Support tickets with department FK
- `comments` (visibility) - Public/internal comments
- `audit_logs` (compliance) - Admin action tracking
- `session` (connect-pg-simple) - Session storage

### Recent Migrations
- **Migration 022** (v2.3.0): Create floors table (database-driven)
- **Migration 023** (v2.3.0): Convert floor to FK constraint
- **Migration 024** (v2.3.0): Remove hardcoded floors (fully dynamic)
- **Migration 025** (v2.3.0): Add composite indexes for performance

See: **[CLAUDE.md](CLAUDE.md)** for complete schema documentation.

---

## Contributing

### Code Standards
- Follow **[Node.js Development Rules](docs/node_js.md)** (98% compliance required)
- Write tests for all new features (maintain 70%+ coverage)
- Run `npm run format && npm run lint && npm test` before committing
- Follow git workflow in **[Git Rules](docs/git_rules.md)**
- Ensure CI/CD passes (GitHub Actions)

### Pull Request Process
1. Create feature branch (`feature/`, `fix/`, `refactor/`, `chore/`)
2. Implement changes with tests
3. Update documentation
4. Ensure all tests pass
5. Run linting and formatting
6. Create PR with clear description
7. Wait for CI/CD to pass
8. Request code review

### Reporting Issues
- Use GitHub Issues
- Include reproduction steps
- Specify Node.js/PostgreSQL versions
- Attach relevant logs
- Tag appropriately (bug, enhancement, documentation)

---

## License

This project is proprietary and confidential.

**Copyright** © 2026 KNII Team. All rights reserved.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/itheCreator1/KNII_Ticketing/issues)
- **Documentation**: See [Documentation](#documentation) section
- **CI/CD**: [Actions Tab](https://github.com/itheCreator1/KNII_Ticketing/actions)

---

## Changelog

<details>
<summary><strong>v2.3.0</strong> (Current - January 2026)</summary>

### Test Infrastructure Improvements ✅
- Floor seeding in test setup (fixes FK violations)
- Database cleanup order fix (DELETE not TRUNCATE)
- Schema helper SQL fixes
- Global pool cleanup (prevents Jest hanging)
- Pass rate: 73% → 84.3% (+107 tests fixed)

### Performance Optimizations ⚡
- **Migration 025**: Composite indexes
  - `tickets(status, priority)` - 50-80% dashboard improvement
  - `session(expire)` - faster session cleanup

### Security Enhancements 🛡️
- Admin mutation rate limiter (20 req/min)
- Search input sanitization (SQL wildcard escaping)
- Defense-in-depth for ILIKE queries

### CI/CD Implementation 🔄
- GitHub Actions CI workflow (tests, coverage, security)
- GitHub Actions Lint workflow (ESLint, Prettier)
- Multi-version Node.js testing (18, 20, 22)
- Automated code quality enforcement

### Code Quality Tools 📐
- ESLint configuration (eslint:recommended)
- Prettier configuration (consistent formatting)
- Pre-commit linting and formatting

### Database Migrations
- **Migration 022**: Create floors table
- **Migration 023**: Convert floor to FK constraint
- **Migration 024**: Remove hardcoded floors (fully dynamic)
- **Migration 025**: Add composite indexes

</details>

<details>
<summary><strong>v2.2.0</strong> (Previous - January 2026)</summary>

### Department Floor Locations 🏢
- Added floor column to departments (8 predefined floors)
- CHECK constraint validation
- Floor display in department management
- Floor selection in ticket forms
- Migration 020: add_department_floor

### Admin-Created Department Tickets Visible ✅
- Fixed visibility issue: Department users can now see admin-created tickets
- Session data: Added department field
- Query change: Filter by reporter_department (not reporter_id)
- Security: Department-based access control implemented

</details>

<details>
<summary><strong>v2.1.0</strong> (Previous - January 2026)</summary>

### Department Accounts Feature 🏢
- Dual-portal architecture (client + admin)
- Department user role with client portal
- Department-based ticket ownership
- Public/internal comment visibility
- Admin creation of department tickets

</details>

---

**Built with ❤️ by the KNII Team** | **Version 2.3.0** | **Node.js 20 + Express 5 + PostgreSQL 16**
