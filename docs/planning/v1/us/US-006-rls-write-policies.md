# User Story — US-006 Implement RLS INSERT/UPDATE/DELETE Policies

**Epic**: Epic 2 — Backend Implementation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 8

---

## User Story

As a **Backend Developer**, I want to **implement INSERT, UPDATE, and DELETE RLS policies** so that **users can only modify data belonging to their client**.

---

## Acceptance Criteria

### AC-1: INSERT policies enforce client_id

**Given** RLS is enabled  
**When** a user attempts INSERT without correct client_id  
**Then** operation is rejected (code 42501)

### AC-2: UPDATE policies protect client_id immutability

**Given** RLS is enabled  
**When** a user attempts UPDATE with different client_id  
**Then** operation is rejected; UPDATE without client_id allowed

### AC-3: DELETE policies enforce ownership

**Given** RLS is enabled  
**When** a user attempts DELETE on different client's record  
**Then** operation is rejected

### AC-4: Cascading DELETE on playbook_steps

**Given** parent process is deleted  
**When** cascading DELETE is triggered  
**Then** all child steps are deleted (FK constraint)

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0014 | Implement INSERT policies | TODO |
| TASK-0015 | Implement UPDATE policies | TODO |
| TASK-0016 | Implement DELETE policies | TODO |
| TASK-0017 | Test write operation access control | TODO |

---

## Definition of Done (DoD)

- [ ] All INSERT/UPDATE/DELETE policies implemented
- [ ] INSERT rejects missing client_id (RLS violation)
- [ ] UPDATE cannot modify client_id (immutability enforced)
- [ ] DELETE respects ownership (RLS enforces)
- [ ] Cascading DELETE verified
- [ ] Commit message: "US-006: Implement RLS INSERT/UPDATE/DELETE policies"

---

**Epic**: Epic 2 — Backend Implementation
