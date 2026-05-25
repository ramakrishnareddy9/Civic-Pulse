---
title: "Add unit tests and e2e smoke test + CI workflow"
labels: testing, ci
assignees:
  - ''
---

## Summary

Add unit tests (Jest + React Testing Library) for key hooks and components, plus a Playwright e2e smoke test that verifies login, complaint submission, and officer real-time update. Add a GitHub Actions workflow to run tests and build the frontend.

## Acceptance Criteria

- Unit tests for `useAuth`, `useComplaints` (mocking API) and `ComplaintForm` exist.
- Playwright e2e test runs against local dev servers (or uses GitHub-hosted service for CI).
- GitHub Actions runs unit tests and Playwright on push to `main` and PRs.

## Tasks

- Add `jest` and `@testing-library/react` configs and sample tests.
- Add Playwright scaffold and a smoke test: open page, login (mocked), submit complaint, validate list, and simulate server push for officer.
- Create `.github/workflows/ci.yml` to run tests on PRs and pushes.

## Notes

I can scaffold tests now; Playwright may need test credentials or a mocked backend for CI. Recommend using MSW for unit/integration mocks.
