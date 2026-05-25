---
title: "Authenticate WebSocket/STOMP connections and confirm server topic endpoints"
labels: backend, frontend, enhancement
assignees:
  - ''
---

## Summary

Ensure STOMP/WebSocket connections are authenticated and that the backend exposes the expected topics (`/topic/complaints` or equivalent). Add reconnection and error handling policies.

## Motivation

Officer dashboard depends on real-time updates. Currently the client connects to `/ws` using SockJS but needs a secure, authenticated handshake and topic confirmations.

## Acceptance Criteria

- Backend validates JWTs for WebSocket connections and maps `Authorization: Bearer <token>`.
- Frontend provides token when connecting (stored in `localStorage` or via `useAuth` hook) and reconnects on failure.
- Topic `/topic/complaints` emits messages on complaint create/update/delete with a consistent payload: `{ type, complaint }`.
- Document format in backend and frontend code comments.

## Tasks

- Backend: add WebSocket handshake filter to verify JWT and populate Principal.
- Backend: publish messages to `/topic/complaints` at complaint lifecycle events.
- Frontend: ensure `connectSocket(token)` supplies token in `connectHeaders` and handles auth failures.
- Tests: manual integration test steps and automated smoke test plan.

## Notes

I scaffolded `frontend/src/services/socket.js` and added a subscription in `OfficerDashboard.jsx` as a starting point.
