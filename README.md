# DevSecOps Security Lab

An **intentionally vulnerable website** for learning how to build a security
pipeline. Run it locally with synthetic data. This public repository hosts the
source code, not a public instance of the application.

## Getting started

You need Node.js 22+ and Git. From the repository directory:

```sh
npm ci --ignore-scripts
npm test
npm start
```

Open http://127.0.0.1:3000. By default, the server listens only on localhost.
Alternatively, with Docker Desktop running:

```sh
docker compose up --build
# Stop the lab:
docker compose down
```

Compose publishes the port only on `127.0.0.1`. Keep this binding to avoid
exposing the lab to the internet. Use synthetic data and nonfunctional tokens.

## Scanners and triggers

GitHub Actions does not receive an event for a commit that stays on your computer.
The local hook covers the pre-commit stage. The workflow covers **every push to
any branch**, **pull request** creation and updates, manual runs, and a weekly
scan on Mondays at 06:23 UTC.

| Tool | Before commit | Push / PR | Purpose |
| --- | --- | --- | --- |
| Gitleaks | Staged file snapshot | Complete Git history | Secrets and the synthetic token |
| Semgrep | Staged source, local rules | Application source, local rules | XSS, path traversal, open redirect |
| Trivy | — | Filesystem | npm dependencies and configuration |
| CodeQL | — | JavaScript, security-extended | Semantic analysis; alerts in Security |

Install the hook once per clone, with Docker running:

```sh
npm run hooks:install
```

The hook scans a temporary copy of the **Git index**. Newly staged files are
included; unstaged changes cannot hide findings. Both scanners run, and findings
or scanner errors block the commit. Hooks are not installed automatically when
cloning and can be bypassed locally, so CI scanning remains necessary.

## Reading the results

The initial state is expected to produce findings. Gitleaks, Semgrep, and Trivy
return a failure status when they find issues. Trivy filters for HIGH and CRITICAL
findings. Jobs run independently, so one failure does not prevent the other
scans. Reports are retained as Actions artifacts for 14 days, including when
scanners report vulnerabilities. Investigate missing reports and download
failures as infrastructure errors rather than vulnerability findings.

CodeQL publishes alerts under **Security → Code scanning**. Its job can pass even
when vulnerabilities are found. Branch protection and merge blocking are not
configured. These require separate rules under Settings → Rules → Rulesets and,
if desired, a code scanning threshold. Keep an exercise branch and submit fixes
through pull requests.

The default pipeline runs application tests, Gitleaks, Semgrep, Trivy filesystem,
and CodeQL. It does not run OWASP Dependency-Check or build and scan a Docker
image. No NVD API key or NVD database initialization is required. Gitleaks,
Semgrep, Trivy, and tests have five-minute job limits; CodeQL has ten minutes.
These are maximum durations, not guaranteed completion times. Runner queues and
scanner database downloads can still add time.

## Exercises

| Exercise | Location | Suggested remediation |
| --- | --- | --- |
| Reflected XSS (CWE-79) | `GET /search?q=...` | Contextual HTML escaping or an autoescaped template |
| Path traversal (CWE-22) | `GET /download?file=...` | Document allowlist and canonical path validation |
| Open redirect (CWE-601) | `GET /redirect?next=...` | Approved local destinations |
| Secret detection | `security/fixtures/demo-secret.txt` | Remove the synthetic token and discuss Git history |
| Outdated dependencies | Express 4.17.1, lodash 4.17.20 | Update versions and lockfile, then rescan |

The `LAB_ONLY_…` token does not work with any service. The local Gitleaks rule
detects it intentionally and extends the default rules. It is not a real secret.
Removing it from the working tree does not remove it from the history scanned
in CI. In a later exercise, you can add an explicit exception strictly for the
synthetic fixture, justified in a PR. Keep the default rules and history scanning
enabled. For a real secret, revoke or rotate it first.

Tests marked `baseline` characterize the initial vulnerable behavior. When fixing
an issue, replace these expectations with tests that require escaping or
rejection. Otherwise, the baseline tests will fail precisely because the
vulnerability has been removed.

## Pipeline security

The workflow uses `pull_request`, minimal permissions, and Actions pinned to
commit SHAs. It does not start a public website, publish images, use
`pull_request_target`, or include real tokens. Scanner containers are pinned to
versions; the Node base image tracks 22-alpine and can change over time.
Gitleaks reports are redacted. Semgrep uses local rules without an account or
token. Dependabot tracks Actions; updating vulnerable application dependencies
is a manual exercise.

## References

- [Gitleaks CLI and configuration](https://github.com/gitleaks/gitleaks)
- [Semgrep CLI](https://docs.semgrep.dev/cli-reference)
- [Trivy](https://github.com/aquasecurity/trivy)
- [CodeQL Action](https://github.com/github/codeql-action)
