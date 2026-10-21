# Remediated security training lab

The default branch contains fixes for the original training vulnerabilities.
Earlier commits intentionally contain vulnerable code and a nonfunctional synthetic token.
The token has been removed from the working tree. Only its two exact historical
fingerprints are excepted in .gitleaksignore; default secret detection remains enabled.
Use synthetic data, nonfunctional tokens, and an isolated training environment.
Run the application only on localhost; keep it off GitHub Pages, tunnels, and public cloud hosting.

For workflow issues or unintended vulnerabilities, use GitHub private reporting
if enabled. Keep secrets out of public issues.
