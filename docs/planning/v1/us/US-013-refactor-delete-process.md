# User Story — US-013 Refactor Delete Process Pattern

**Epic**: Epic 3 — Frontend Refactoring  
**Status**: TODO  
**Priority**: MEDIUM  
**Story Points**: 3

---

## User Story

As a **Frontend Developer**, I want to **refactor deleteProcess pattern** so that **DELETEs respect RLS client_id filtering**.

---

## Acceptance Criteria

### AC-1: DELETE includes client_id filter

**Given** process is deleted  
**When** DELETE executes  
**Then** .eq('client_id', userClientId) filter is applied

### AC-2: RLS accepts the DELETE

**Given** pattern is correct  
**When** DELETE executes  
**Then** RLS policy accepts

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0026 | Implement deleteProcess pattern | TODO |

---

## Definition of Done (DoD)

- [ ] Pattern includes client_id filter
- [ ] RLS accepts without errors
- [ ] Commit message: "US-013: Refactor deleteProcess pattern"

---

**Epic**: Epic 3 — Frontend Refactoring
