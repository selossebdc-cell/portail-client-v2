# User Story — US-007 Implement Admin Switcher RLS Policy

**Epic**: Epic 2 — Backend Implementation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 5

---

## User Story

As a **Backend Developer**, I want to **implement the admin switcher RLS policy** so that **only admins can update their own client_id**.

---

## Acceptance Criteria

### AC-1: Admin can update their client_id

**Given** user has role='admin'  
**When** admin attempts to UPDATE profiles.client_id  
**Then** operation succeeds

### AC-2: Non-admin cannot update client_id

**Given** user has role='client'  
**When** non-admin attempts UPDATE  
**Then** operation is rejected (RLS 42501)

### AC-3: Policy verified in Supabase Playground

**Given** policy is deployed  
**When** tested with different roles  
**Then** behavior matches spec

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0018 | Implement admin switcher RLS policy | TODO |

---

## Definition of Done (DoD)

- [ ] Admin switcher policy deployed
- [ ] Admin role verified (can switch)
- [ ] Client role verified (cannot switch)
- [ ] Commit message: "US-007: Admin switcher RLS policy"

---

**Epic**: Epic 2 — Backend Implementation
