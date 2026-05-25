---
title: "Implement Admin CRUD pages for Departments / Officers / Wards"
labels: frontend, backend, enhancement
assignees:
  - ''
---

## Summary

Create Admin interfaces for managing Departments, Officers, and Wards with list/create/edit/delete flows and connect them to backend admin endpoints.

## Motivation

Admins need a UI to manage organizational data and reassign officers/wards.

## Acceptance Criteria

- Admin pages for Departments, Officers, Wards exist under `/admin/*` routes.
- Each page supports listing, sorting, searching, create, edit, and delete operations.
- Use `@api/admin.js` service functions and confirm permissions via `ProtectedRoute` with `ADMIN` role.
- Forms validate input and show success/error toasts.

## Tasks

- Build `AdminDepartments`, `AdminOfficers`, `AdminWards` pages using shared list/detail components.
- Wire routes in `App.jsx` and add navigation in `AdminDashboard.jsx`.
- Ensure backend admin endpoints implement required operations; add integration tests.

## Notes

`AdminDashboard.jsx` scaffold added; use it as the hub for navigation to CRUD pages.
