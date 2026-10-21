'use strict';
// Scan the staged snapshot, including newly staged files, rather than just the working tree.
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'devsecops-index-'));
let failed = false;
try {
  execFileSync('git', ['checkout-index', '--all', `--prefix=${snapshot.replaceAll('\\', '/')}/`], { stdio: 'inherit' });
  const scans = [
    ['ghcr.io/gitleaks/gitleaks:v8.30.1', 'dir', '.', '--config', '.gitleaks.toml', '--redact'],
    ['semgrep/semgrep:1.182.0', 'semgrep', 'scan', '--config', 'security/semgrep.yml', '--metrics=off', '--error', 'src']
  ];
  for (const scan of scans) {
    const result = spawnSync('docker', ['run', '--rm', '-v', `${snapshot}:/repo:ro`, '-w', '/repo', ...scan], { stdio: 'inherit' });
    if (result.error || result.status !== 0) failed = true;
  }
} catch (error) {
  console.error(error.message);
  failed = true;
} finally {
  // snapshot is a freshly-created OS temporary directory owned by this invocation.
  fs.rmSync(snapshot, { recursive: true, force: true });
}
if (failed) console.error('Commit blocat: remediază finding-urile sau eroarea de scanare. Vezi README.');
process.exitCode = failed ? 1 : 0;
