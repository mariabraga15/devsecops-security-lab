'use strict';
const { execFileSync } = require('node:child_process');
const { chmodSync } = require('node:fs');
const path = require('node:path');
// Web uploads do not preserve executable mode; make the hook runnable on Unix clones.
chmodSync(path.resolve(__dirname, '../.githooks/pre-commit'), 0o755);
execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
console.log('Gitleaks pre-commit hook installed. Docker Desktop must be running. Semgrep runs in CI after push.');
