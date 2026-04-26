# User Story — US-004 Admin Switcher Database Infrastructure

**Epic**: Epic 1 — RLS Foundation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 5

---

## User Story

As a **Database Administrator**, I want to **configure the admin switcher infrastructure** so that **admin users can securely switch between client contexts**.

---

## Acceptance Criteria

### AC-1: Verify profiles table has client_id

**Given** `profiles` table exists  
**When** I audit the schema  
**Then** `client_id` column exists as FK to clients

**Acceptance**: [ ] Column exists, [ ] FK verified

### AC-2: Create Admin Switcher RLS Policy

**Given** schema is correct  
**When** RLS policy is created for profile UPDATE  
**Then** only role='admin' users can update their own client_id

**Acceptance**: [ ] Policy created, [ ] Tested with admin role

### AC-3: Verify Role-Based Access

**Given** RLS policy is deployed  
**When** non-admin users attempt to switch client  
**Then** RLS denies the operation (code 42501)

**Acceptance**: [ ] Non-admin denied, [ ] Admin allowed

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0009 | Configure admin switcher RLS policy | TODO |

---

## Definition of Done (DoD)

- [ ] `profiles.client_id` column verified
- [ ] Admin switcher RLS policy deployed
- [ ] Role-based access verified (role='admin' only)
- [ ] Tested in Supabase Playground
- [ ] Commit message: "US-004: Admin switcher database infrastructure"

---

**Epic**: Epic 1 — RLS Foundation
