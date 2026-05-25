---
title: "Refactor frontend to use API services/hooks instead of direct fetch"
labels: enhancement, frontend
assignees:
  - ''
---

## Summary

Several frontend components should consistently use the centralized API client and `@api/*` service functions via hooks (`useComplaints`, `useAuth`, etc.) instead of direct `fetch` calls or ad-hoc HTTP logic.

## Motivation

Consistency improves error handling, interceptors (auth token refresh), and simplifies testing.

## Acceptance Criteria

- No remaining direct `fetch(...)` calls in `frontend/src/**` (except in tests).
- Components call `@api/*` helper functions and/or hooks (`useComplaints`, `useAuth`).
- API responses are handled via `handleApiError` and notifications where appropriate.
- Unit tests added for one representative page and one service.

## Tasks

- Search the codebase for `fetch(` and refactor usages to call service methods in `frontend/src/api`.
- Update any components that used raw fetch for delete/update/submit and use hook wrappers.
- Ensure `api/client.js` interceptors handle `Authorization` header and 401 -> logout flow.
- Add a small unit test verifying the refactor for `ComplaintDetail` (mock service).

## Notes

I already replaced the DELETE in `ComplaintDetail.jsx` with `useComplaints().deleteComplaint` as a starter.
