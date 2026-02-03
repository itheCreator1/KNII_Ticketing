/**
 * Version Consistency Check Script
 *
 * Ensures package.json version matches CLAUDE.md version to prevent documentation drift.
 * This script should be run:
 * - Before running tests (via npm pretest hook)
 * - As part of CI/CD pipeline
 * - Manually via: npm run version-check
 *
 * Exit codes:
 * - 0: Versions match
 * - 1: Version mismatch detected
 */

const fs = require('fs');
const path = require('path');

try {
  // Read package.json
  const packageJson = require('../package.json');
  const packageVersion = packageJson.version;

  // Read CLAUDE.md
  const claudeMdPath = path.join(__dirname, '../CLAUDE.md');
  const claudeMd = fs.readFileSync(claudeMdPath, 'utf-8');

  // Extract version from CLAUDE.md
  // Pattern: **Version**: 2.1.0 (description) or **Version**: v2.1.0 (description)
  const versionMatch = claudeMd.match(/\*\*Version\*\*:\s*v?(\d+\.\d+\.\d+)/);

  if (!versionMatch) {
    console.error('❌ Error: Could not find version in CLAUDE.md');
    console.error('   Expected format: **Version**: 2.1.0 (description)');
    process.exit(1);
  }

  const claudeVersion = versionMatch[1];

  // Compare versions
  if (packageVersion !== claudeVersion) {
    console.error('❌ Version mismatch detected!');
    console.error(`   package.json: ${packageVersion}`);
    console.error(`   CLAUDE.md:    ${claudeVersion}`);
    console.error('');
    console.error('   To fix:');
    console.error('   1. Update CLAUDE.md version to match package.json, OR');
    console.error('   2. Bump package.json version with: npm version <major|minor|patch>');
    process.exit(1);
  }

  console.log(`✅ Version consistency check passed: ${packageVersion}`);
  process.exit(0);
} catch (error) {
  console.error('❌ Error running version consistency check:');
  console.error(`   ${error.message}`);
  process.exit(1);
}
