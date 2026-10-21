# Verify the security remediations

Use this checklist to review a pull request and compare the remediated app with
the vulnerable baseline linked in the README. Run the website only on localhost.

## Local checks

From the repository directory, install the locked dependencies and run checks:

```powershell
npm ci --ignore-scripts
npm test
npm audit
```

Expected: all 13 regression tests pass. Review the audit output for the installed
versions; a clean result applies to the advisory data available at scan time.

Start the application with `npm start`, then use the website:

| Check | Input or action | Expected result |
| --- | --- | --- |
| HTML escaping | Search for `<b>training</b>` | The literal tags appear as text, without bold formatting |
| Approved document | Open `welcome.txt` | HTTP 200 and the synthetic sample document |
| Path traversal | Request `../../package.json` in the document form | HTTP 404; package contents are not returned |
| Approved redirect | Enter `/api/topics` in the destination form | Redirect to the local topics endpoint |
| External redirect | Enter `https://example.com` in the destination form | HTTP 400; the browser stays on the local site |
| Rate limiting | Review the rate-limit regression test | A request burst receives HTTP 429 with a retry interval |

The automated tests cover additional encoded paths, repeated query parameters,
script markup and server startup conflicts. Restart a running server after
changing its source so that manual checks use the current application code.

## Commit and feature-branch push checks

- Install the hook with `npm run hooks:install` and keep Docker Desktop running.
- On `git commit`, confirm the local Gitleaks scan completes. Semgrep, Trivy,
  and CodeQL do not run in this hook. Run `npm test` locally when useful.
- After pushing a feature branch, open its **Security Lab** run in **Actions**.
  Expect **Application tests**, **Gitleaks secrets**, and **Semgrep SAST** to run.
- **Trivy filesystem** and **CodeQL JavaScript** should be **skipped** in this
  feature-branch push run. They run in the full PR assessment below.

## Pull request checks

- Confirm the pull request targets `main` and contains only the intended changes.
- Open its **Checks** tab and find the **Security Lab** run triggered by
  `pull_request`. A separate run may also appear for the branch `push` event.
- Verify that **Application tests**, **Gitleaks secrets**, **Semgrep SAST**,
  **Trivy filesystem**, and **CodeQL JavaScript** complete successfully.
- Inspect logs and artifacts when a check fails. A scanner download error is
  different from a vulnerability finding.
- Review **Security → Code scanning** for the relevant branch and tool. A green
  CodeQL job confirms the analysis ran; alerts must also be reviewed.
- Review **Security → Dependabot → Vulnerabilities** for open dependency alerts.

## Synthetic-token exception

The old fixture token was nonfunctional. Its two known historical occurrences
have exact fingerprint exceptions in `.gitleaksignore`. Review these exceptions
as part of the change; keep default secret detection and the training rule enabled.
Do not treat an exception as remediation for a real secret: revoke or rotate any
real leaked credential.

## Merge and recheck

Merge only after reviewing the diff and checks. Repository rules must be configured
separately if successful checks are to be mandatory. After merging, the `push`
event on `main` runs all five CI jobs again against the merged result. Manual
workflow runs and the weekly schedule also run the full suite.
