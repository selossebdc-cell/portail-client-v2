# User Story — US-015 RLS Policy Integration Tests

**Epic**: Epic 4 — Integration & Validation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 5

---

## User Story

As a **QA Engineer**, I want to **test all RLS policies end-to-end** so that **isolation is verified in real scenarios**.

---

## Acceptance Criteria

### AC-1: SELECT policy isolation verified

**Given** 2 users from different clients  
**When** each queries playbook_processes  
**Then** no cross-tenant data visible

### AC-2: INSERT policy enforces client_id

**Given** user attempts INSERT without client_id  
**When** executed  
**Then** RLS rejects (code 42501)

### AC-3: UPDATE immutability enforced

**Given** user attempts UPDATE client_id  
**When** executed  
**Then** RLS rejects

### AC-4: Admin switcher functional

**Given** admin switches client  
**When** queries execute  
**Then** data reflects new client context

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0030 | Test SELECT isolation across tenants | TODO |
| TASK-0031 | Test INSERT policy enforcement | TODO |
| TASK-0032 | Test UPDATE immutability | TODO |

---

## Definition of Done (DoD)

- [ ] All isolation tests pass
- [ ] Cross-tenant access prevented
- [ ] RLS error codes handled correctly
- [ ] Commit message: "US-015: RLS integration tests"

---

**Epic**: Epic 4 — Integration & Validation
