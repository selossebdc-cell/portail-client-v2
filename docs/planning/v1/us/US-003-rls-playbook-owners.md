# User Story — US-003 Enable RLS on playbook_owners

**Epic**: Epic 1 — RLS Foundation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 3

---

## User Story

As a **Database Administrator**, I want to **enable Row Level Security on the playbook_owners table** so that **ownership data is isolated by client**.

---

## Acceptance Criteria

### AC-1: Verify client_id Column Exists

**Given** `playbook_owners` table exists  
**When** I audit the schema  
**Then** `client_id` column is present with FK to clients

**Acceptance**: [ ] Column verified, [ ] FK constraint confirmed

### AC-2: Enable RLS on playbook_owners

**Given** schema is correct  
**When** RLS is enabled  
**Then** RLS status is ON

**Acceptance**: [ ] RLS enabled, [ ] Verified in Supabase console

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0008 | Audit playbook_owners and enable RLS | TODO |

---

## Definition of Done (DoD)

- [ ] Schema audited and `client_id` verified
- [ ] RLS enabled on `playbook_owners` table
- [ ] Commit message: "US-003: Enable RLS on playbook_owners"

---

**Epic**: Epic 1 — RLS Foundation
