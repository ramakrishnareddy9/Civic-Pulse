---
title: "Security: Run dependency audit and fix vulnerabilities"
labels: security, maintenance
assignees:
  - ''
---

## Summary

Address the npm audit findings and update vulnerable dependencies; run Snyk or similar scan for the codebase.

## Acceptance Criteria

- `npm audit` run and moderate/critical issues are remediated where possible.
- Upgrade plan documented for packages requiring breaking changes (e.g., Recharts -> v3).
- CI includes occasional dependency scan step.

## Tasks

- Run `npm audit` locally and attempt `npm audit fix`.
- Update packages with breaking changes in a separate branch and test UI for regressions.
- Consider adding `dependabot` or `renovate` config to keep deps up-to-date.
