#!/usr/bin/env node
// Fails CI if secrets or signing artifacts are accidentally tracked in git.
import { execSync } from 'child_process';

const FORBIDDEN_PATTERNS = [/\.env$/, /\.jks$/, /\.keystore$/, /google-services\.json$/];

const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const violations = tracked.filter((f) => FORBIDDEN_PATTERNS.some((p) => p.test(f)));

if (violations.length > 0) {
  console.error('Repo hygiene check FAILED — sensitive files are tracked:');
  violations.forEach((f) => console.error(' ', f));
  process.exit(1);
}

console.log('Repo hygiene check passed.');
