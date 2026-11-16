// Copies app/ to dist/ and stamps the current git sha into the page (plan R6).
import { execSync } from 'node:child_process';
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const sha = execSync('git rev-parse HEAD').toString().trim();
if (execSync('git status --porcelain -- app').toString().trim()) {
  console.warn('warning: app/ has uncommitted changes, so the stamped sha does not match what is built');
}
rmSync('dist', { recursive: true, force: true });
cpSync('app', 'dist', { recursive: true });
const page = 'dist/index.html';
writeFileSync(page, readFileSync(page, 'utf8').replaceAll('__BUILD_SHA__', sha));
console.log(`dist/ built at ${sha}`);
