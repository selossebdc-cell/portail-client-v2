# User Story — US-005 Implement RLS SELECT Policies

**Epic**: Epic 2 — Backend Implementation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 8

---

## User Story

As a **Backend Developer**, I want to **implement all SELECT RLS policies** so that **users can only read data from their assigned client**.

---

## Acceptance Criteria

### AC-1: SELECT policy on playbook_processes

**Given** RLS is enabled  
**When** a user queries playbook_processes  
**Then** only records matching user's client_id are returned

### AC-2: SELECT policy on playbook_steps (cascading)

**Given** cascading RLS is configured  
**When** a user queries playbook_steps  
**Then** steps are scoped via parent process's client_id

### AC-3: SELECT policy on playbook_owners

**Given** RLS is enabled  
**When** a user queries playbook_owners  
**Then** only records matching user's client_id are returned

### AC-4: Cross-tenant isolation verified

**Given** all SELECT policies deployed  
**When** user A queries, then user B queries  
**Then** user A cannot access user B's data

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0010 | Implement SELECT policy on playbook_processes | TODO |
| TASK-0011 | Implement SELECT policy on playbook_steps (cascading) | TODO |
| TASK-0012 | Implement SELECT policy on playbook_owners | TODO |
| TASK-0013 | Test cross-tenant isolation | TODO |

---

## Technical Notes

**API Spec Reference** (docs/specs/api.md — Part 1):
- Policy 1: playbook_processes SELECT
- Policy 2: playbook_processes INSERT (also handles SELECT for new rows)
- Policy 3: playbook_steps SELECT (cascading subquery)
- Policy 4: playbook_owners SELECT

**Implementation in Supabase**:
1. SQL Editor: Create each policy with proper USING clause
2. Test in SQL Editor with different user roles
3. Verify via Supabase Playground

---

## Definition of Done (DoD)

- [ ] All 3 SELECT policies implemented in Supabase
- [ ] Tested with multiple users (cross-tenant isolation verified)
- [ ] Cascading policy on playbook_steps verified
- [ ] No console errors
- [ ] Commit message: "US-005: Implement RLS SELECT policies"

---

**Epic**: Epic 2 — Backend Implementation
