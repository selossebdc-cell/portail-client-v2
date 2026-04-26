# User Story — US-011 Refactor Create Process Pattern

**Epic**: Epic 3 — Frontend Refactoring  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 3

---

## User Story

As a **Frontend Developer**, I want to **refactor createProcess pattern** so that **new processes are created with client_id in payload**.

---

## Acceptance Criteria

### AC-1: INSERT includes client_id

**Given** new process is created  
**When** INSERT executes  
**Then** client_id is included in payload (from sessionStorage)

### AC-2: Pattern matches specification

**Given** pattern is implemented  
**When** code is reviewed  
**Then** matches Pattern C from `.claude/rules/rls-isolation.md`

### AC-3: RLS accepts the INSERT

**Given** pattern is correct  
**When** INSERT executes  
**Then** RLS policy accepts (no 42501 error)

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0024 | Implement createProcess pattern | TODO |

---

## Definition of Done (DoD)

- [ ] Pattern includes client_id in INSERT
- [ ] Follows specification exactly
- [ ] RLS accepts without errors
- [ ] Commit message: "US-011: Refactor createProcess pattern"

---

**Epic**: Epic 3 — Frontend Refactoring
