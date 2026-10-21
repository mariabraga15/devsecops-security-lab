# DevSecOps Security Lab

The default branch is the **remediated version** of a local security training
application. Compare findings and fixes without publishing the application to
the internet. Earlier commits preserve the intentionally vulnerable exercises;
the pre-remediation baseline is [ac5c9f4](https://github.com/mariabraga15/devsecops-security-lab/tree/ac5c9f42e672747d094b99d43879722d760f16a2).

## Getting started

Use Node.js 22+ and Git. From the repository directory:

```sh
npm ci --ignore-scripts
npm test
npm start
```

Open http://127.0.0.1:3000. The server listens only on localhost by default.
With Docker Desktop running, you can instead use:

```sh
docker compose up --build
# Stop the lab:
docker compose down
```

Compose publishes the port only on `127.0.0.1`. Keep the lab local and use
synthetic data. The Docker image runs as a non-root user and has a health check.

## Remediations

| Original issue | Fix | Regression coverage |
| --- | --- | --- |
| Reflected XSS in `/search` | Type and length validation, then `escape-html` for HTML text output | Script/image markup and HTML metacharacters are escaped |
| Path traversal in `/download` | Exact document allowlist with a constant filesystem path | Traversal, absolute paths, double encoding and duplicate parameters are rejected |
| Open redirect in `/redirect` | Only constant `/` and `/api/topics` destinations | External URLs, protocol-relative URLs, scripts and ambiguous inputs are rejected |
| Missing rate limiting | `express-rate-limit` middleware: 60 requests per client per minute | Request bursts receive HTTP 429 and a retry interval |
| Outdated dependency tree | Express updated to a pinned current release; Lodash replaced with native sorting | npm audit, Trivy and API behavior checks |
| Synthetic token finding | Remove the nonfunctional fixture token from the working tree | Default Gitleaks rules and the training rule remain enabled |

The application also sets a restrictive script policy, prevents MIME sniffing
and framing, and removes the Express identification header. The custom Semgrep
XSS rule recognizes the actual `escapeHtml` sanitizer; the rule stays enabled.

The historical token was never a real credential. `.gitleaksignore` contains
only its two exact commit/path/rule/line fingerprints: the GitHub fixture commit
and the preserved local bootstrap commit. This is a documented training-fixture
exception, not a repair of a leaked credential. Other secrets and new token
occurrences are still detected. A real leaked secret must be revoked or rotated.

## Scanners and triggers

GitHub Actions runs on every push, pull request creation/update/reopening,
manual dispatch, and Mondays at 06:23 UTC. Jobs run independently.

| Tool | Before commit | GitHub Actions | Output |
| --- | --- | --- | --- |
| Gitleaks | Staged snapshot | Complete Git history | Redacted SARIF artifact |
| Semgrep | Staged source | Local taint-analysis rules | SARIF artifact |
| Trivy | — | Filesystem dependencies and configuration | SARIF artifact |
| CodeQL | — | JavaScript, security-extended | Code scanning alerts and SARIF artifact |
| Application tests | Manual `npm test` | Regression suite | Job log |

Install the local hook once per clone, with Docker Desktop running:

```sh
npm run hooks:install
```

The hook scans a temporary copy of the Git index, including newly staged files.
Findings and scanner errors block commits. Hooks are not installed automatically
when cloning and can be bypassed locally, so CI remains necessary.

The default pipeline does not run Dependency-Check or build/scan a container
image. It requires no NVD API key or NVD database initialization. Tests,
Gitleaks, Semgrep and Trivy have five-minute job limits; CodeQL has ten minutes.
These are limits, not guaranteed completion times. Runner queues and scanner
database downloads can still add time.

## Reading the results

Under **Actions → Security Lab**, select a run for the relevant commit. Each job
contains its log; **Summary → Artifacts** contains the reports, retained for 14
days. Gitleaks and Semgrep fail on findings. Trivy fails on HIGH/CRITICAL findings.
CodeQL can finish successfully while reporting alerts under
**Security → Code scanning**. Missing reports and download failures are scanner
errors and must not be interpreted as clean scans.

To audit the installed dependency tree locally:

```sh
npm audit
```

The regression suite verifies the remediated behavior. To study the original
vulnerabilities, inspect the baseline commit in a separate local checkout.
Do not copy its vulnerable dependencies back into the remediated branch.

Scan results describe the analyzed version and the databases available at scan
time. Passing these checks does not establish that the application is suitable
for production. Branch protection and required merge checks are separate GitHub
settings; they are not enabled by this repository's workflow.

## References

- [Gitleaks](https://github.com/gitleaks/gitleaks)
- [Semgrep CLI](https://docs.semgrep.dev/cli-reference)
- [Trivy](https://github.com/aquasecurity/trivy)
- [CodeQL Action](https://github.com/github/codeql-action)
