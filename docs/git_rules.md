# Git Workflow Rules - KNII Ticketing System

**Version:** 2.3.0
**Last Updated:** January 2026
**Target Project:** KNII Ticketing System (Node.js 20 + Express 5 + PostgreSQL 16)

---

You are Claude Code operating inside the Claude Code environment via the Claude Code extension.

You have full, unrestricted access to:
- The local Git repository
- The GitHub MCP server
- A GitHub token with full privileges (read/write/admin, PRs, issues, workflows, branches, tags)

Your primary responsibility is to ensure that this project uses Git as a first-class engineering tool, not merely as a backup mechanism.

You MUST actively manage Git strategy, hygiene, and history quality throughout the entire lifecycle of the project.

GLOBAL GIT PRINCIPLES (MANDATORY)
1. Treat the main branch (main/master) as production-grade and always deployable.
2. Never commit directly to main unless explicitly instructed.
3. Prefer small, atomic, logically scoped commits.
4. Every commit must have:
   - A clear intent
   - A concise subject line (imperative mood)
   - A meaningful body when context is non-trivial
5. Git history must tell a coherent story of the project’s evolution.

BRANCHING STRATEGY
- Use feature branches for all work:
  - feature/<short-description>
  - fix/<short-description>
  - refactor/<short-description>
  - chore/<short-description>
- Create branches proactively without being asked.
- Delete merged branches unless retention is justified.

PULL REQUEST DISCIPLINE
- All changes must go through Pull Requests unless explicitly told otherwise.
- Each PR must include:
  - A clear summary of WHAT changed
  - WHY the change was necessary
  - Any trade-offs or risks
- Use GitHub MCP to:
  - Open PRs
  - Review diffs critically
  - Suggest improvements before merge
- Squash, rebase, or merge strategically to maintain a clean history.

COMMIT STRATEGY
- Commits should reflect intent, not timestamps.
- Avoid “WIP” commits unless explicitly instructed.
- Before committing:
  - Review the diff
  - Remove noise (formatting-only changes unless justified)
- Amend or rebase commits when it improves clarity.

USING GIT AS A THINKING TOOL
- Use commits to checkpoint reasoning, experiments, and decisions.
- If exploring multiple approaches:
  - Use branches instead of commented-out code
- If an approach fails:
  - Preserve the knowledge via commit messages or PR discussion, not dead code.

AUTOMATION & TOOLING AWARENESS
- Be aware of and respect:
  - .gitignore
  - linters
  - formatters
  - CI workflows
- If missing, propose improvements via commits or PRs.

CI/CD INTEGRATION (v2.3.0)
The project uses GitHub Actions for continuous integration:
- **CI Workflow**: Runs tests, generates coverage, checks security
- **Lint Workflow**: Enforces ESLint and Prettier standards

Before Pushing:
1. Run `npm run format` to auto-format code
2. Run `npm run lint` to check linting (or `npm run lint:fix` to auto-fix)
3. Run `npm test` to ensure tests pass locally
4. Commit formatted and linted code

When CI Fails:
- View workflow logs in GitHub Actions tab
- Fix linting errors: `npm run lint:fix`
- Fix formatting: `npm run format`
- Fix test failures: `npm test` locally first
- **Never commit with --no-verify** to bypass checks

Example Workflow:
```bash
# Before committing
npm run format        # Auto-format
npm run lint          # Check linting
npm test              # Run tests

# Commit and push
git add .
git commit -m "feat: add new feature"
git push

# Watch CI results in GitHub Actions
# Fix any CI failures and push again
```

CI Status Badges:
- Check README for CI/Lint workflow status
- Green badge = all checks passing
- Red badge = investigate and fix

See: [CI/CD Guide](ci-cd.md) for detailed troubleshooting

GITHUB MCP UTILIZATION
You are expected to actively use GitHub MCP capabilities, including but not limited to:
- Repository inspection
- Commit and branch management
- Pull request creation and review
- Issue creation for technical debt, refactors, or follow-ups
- Tagging releases when milestones are reached

ANTI-PATTERNS TO AVOID
- Large, unfocused commits
- Silent breaking changes
- Unreviewed direct pushes to main
- Git history pollution
- Treating Git as an afterthought

DEFAULT BEHAVIOR
If instructions are ambiguous:
- Choose the path that results in better Git hygiene
- Ask for clarification only if necessary
- Prefer reversible, well-documented changes

Your success is measured not only by working code, but by the quality, clarity, and strategic value of the Git history you leave behind.
