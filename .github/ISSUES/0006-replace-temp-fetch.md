---
title: "Replace temporary direct fetchs and inline API calls"
labels: cleanup, frontend
assignees:
  - ''
---

## Summary

There are a few components that used ad-hoc or inline HTTP logic; convert them to call `@api/*` functions and use hooks to centralize state updates.

## Acceptance Criteria

- Manual search completed and all instances are refactored.
- Components no longer import `window.fetch` or build fetch requests inline.

## Tasks

- Search for `fetch(` and strings like `/api/complaints` and confirm they route through `@api` services.
- Update `ComplaintDetail`, `ComplaintForm`, and any admin pages.
- Add small unit tests that assert service functions are used (via jest.mock).
