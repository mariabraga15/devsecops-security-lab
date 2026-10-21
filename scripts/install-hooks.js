'use strict';
const { execFileSync } = require('node:child_process');
execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
console.log('Hook pre-commit instalat. Necesită Docker Desktop pornit.');
