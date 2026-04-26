# User Story — US-012 Refactor Update Process Pattern

**Epic**: Epic 3 — Frontend Refactoring  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 3

---

## User Story

As a **Frontend Developer**, I want to **refactor updateProcess pattern** so that **UPDATEs never modify client_id**.

---

## Acceptance Criteria

### AC-1: UPDATE excludes client_id

**Given** process is updated  
**When** UPDATE executes  
**Then** client_id is NOT in the payload

### AC-2: Pattern matches specification

**Given** pattern is implemented  
**When** code is reviewed  
**Then** matches rule R4: "Never modify client_id after creation"

### AC-3: RLS accepts the UPDATE

**Given** pattern is correct  
**When** UPDATE executes  
**Then** RLS policy accepts

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0025 | Implement updateProcess pattern | TODO |

---

## Definition of Done (DoD)

- [ ] Pattern excludes client_id from UPDATE
- [ ] Immutability rule enforced
- [ ] RLS accepts without errors
- [ ] Commit message: "US-012: Refactor updateProcess pattern"

---

**Epic**: Epic 3 — Frontend Refactoring
