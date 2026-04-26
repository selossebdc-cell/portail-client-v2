# User Story — US-002 Enable RLS on playbook_steps

**Epic**: Epic 1 — RLS Foundation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 5

---

## User Story

As a **Database Administrator**, I want to **enable Row Level Security on the playbook_steps table** so that **steps are automatically scoped to their parent process's client**.

---

## Acceptance Criteria

### AC-1: Verify `client_id` Column (Inherited)

**Given** the `playbook_steps` table exists  
**When** I query the table schema  
**Then** a `client_id` column exists (inherited from parent process via cascading logic)

**Acceptance**: [ ] Column exists, [ ] FK to playbook_processes verified

### AC-2: Enable RLS with Cascading Subquery

**Given** the `client_id` inheritance is configured  
**When** RLS is enabled on `playbook_steps`  
**Then** RLS status is ON and cascading policy is active

**Acceptance**: [ ] RLS enabled, [ ] Subquery policy verified

### AC-3: Verify Cascading Isolation

**Given** RLS is enabled  
**When** I query steps, they are scoped to parent process's `client_id`  
**Then** no cross-tenant step access is possible

**Acceptance**: [ ] Cascading isolation tested, [ ] No cross-tenant access

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0005 | Audit playbook_steps schema for client_id inheritance | TODO |
| TASK-0006 | Backfill playbook_steps with inherited client_id | TODO |
| TASK-0007 | Enable RLS on playbook_steps with cascading policy | TODO |

---

## Technical Notes

**System Spec Reference** (docs/specs/system.md — FR-002):
- Cascading RLS via FK chain: `playbook_steps.process_id` → `playbook_processes.client_id`
- Policy: Subquery to verify parent's `client_id` matches user's assigned client

**Domain Spec Reference** (docs/specs/domain.md):
- Entity: `Playbook Step` with parent relationship to `Playbook Process`
- FK: `playbook_steps.process_id` → `playbook_processes.id`
- Cascading invariant I-002: "Steps inherit isolation from parent process"

**API Spec Reference** (docs/specs/api.md — Part 1, Policy 3):
```sql
CREATE POLICY "Users can select steps from their processes"
  ON playbook_steps
  FOR SELECT
  USING (
    (SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id)
    = (SELECT client_id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
  );
```

---

## Definition of Done (DoD)

- [ ] `playbook_steps` schema audited
- [ ] `client_id` column exists and is properly inherited from parent process
- [ ] RLS enabled on `playbook_steps` table
- [ ] Cascading subquery policy deployed
- [ ] Tested: Steps scoped to parent process's client
- [ ] No orphaned steps (without valid parent process_id)
- [ ] Commit message: "US-002: Enable RLS on playbook_steps"

---

## References

- **System Spec**: `docs/specs/system.md` — FR-002
- **Domain Spec**: `docs/specs/domain.md` — Playbook Step entity
- **API Spec**: `docs/specs/api.md` — Policy 3
- **Rules**: `.claude/rules/rls-isolation.md` — Rule R6 (Cascading isolation)

---

**Related**: US-001, US-003 (parallel RLS enablement)  
**Epic**: Epic 1 — RLS Foundation
