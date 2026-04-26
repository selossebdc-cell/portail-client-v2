# User Story — US-001 Enable RLS on playbook_processes

**Epic**: Epic 1 — RLS Foundation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 5

---

## User Story

As a **Database Administrator**, I want to **enable Row Level Security on the playbook_processes table** so that **each user can only see and modify processes belonging to their assigned client**.

---

## Acceptance Criteria

### AC-1: Verify `client_id` Column Exists

**Given** the `playbook_processes` table exists  
**When** I query the table schema  
**Then** a `client_id` column (UUID foreign key) is present

**Acceptance**: [ ] Schema verified, [ ] Column type correct (UUID), [ ] Not null constraint applied

### AC-2: Enable RLS on playbook_processes

**Given** the `client_id` column exists on `playbook_processes`  
**When** RLS is enabled on the table  
**Then** RLS status is ON in Supabase

**Acceptance**: [ ] RLS enabled in Supabase, [ ] Verified via Supabase console

### AC-3: Verify Schema Integrity

**Given** RLS is enabled  
**When** I run the schema audit  
**Then** no referential integrity errors exist

**Acceptance**: [ ] Foreign key relationships intact, [ ] No orphaned rows detected

### AC-4: Document Rollback Plan

**Given** RLS is enabled  
**When** I review the rollback plan  
**Then** clear steps exist to disable RLS if needed

**Acceptance**: [ ] Rollback script created, [ ] Tested on staging

---

## Tasks

This user story decomposes into the following implementation tasks:

| ID | Title | Status |
|----|-------|--------|
| TASK-0001 | Audit playbook_processes schema and verify client_id | TODO |
| TASK-0002 | Backfill legacy playbook_processes rows with client_id | TODO |
| TASK-0003 | Enable RLS on playbook_processes table | TODO |
| TASK-0004 | Verify RLS enabled and document rollback plan | TODO |

---

## Technical Notes

### Context from Specifications

**System Spec Reference** (docs/specs/system.md — FR-001):
- RLS Policy on `playbook_processes` table
- Policy Details:
  - **SELECT**: `profiles.client_id = playbook_processes.client_id`
  - **INSERT**: `auth.uid() = profiles.user_id AND profiles.client_id = NEW.client_id`
  - **UPDATE**: `auth.uid() = profiles.user_id AND profiles.client_id = playbook_processes.client_id`
  - **DELETE**: `auth.uid() = profiles.user_id AND profiles.client_id = playbook_processes.client_id`

**Domain Spec Reference** (docs/specs/domain.md):
- Entity: `Playbook Process` with attributes (id, client_id, name, description, owner_id, status, etc.)
- FK relationship: `playbook_processes.client_id` → `clients.id`
- Business Rule BR-001: "Every playbook process must belong to exactly one client"
- Invariant I-001: "client_id is immutable after creation"

**API Spec Reference** (docs/specs/api.md — Part 1, Policy 1):
```sql
-- RLS Policy 1: playbook_processes SELECT
CREATE POLICY "Users can select their own client's processes"
  ON playbook_processes
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM profiles WHERE client_id = playbook_processes.client_id LIMIT 1
    )
  );
```

### Rules & Standards

**From `.claude/rules/rls-isolation.md`**:
- Rule R1: RLS is the single source of truth (database layer enforcement)
- Rule R8: Legacy data without `client_id` is inaccessible by RLS

**Database Audit Procedure**:
1. Check if `playbook_processes.client_id` column exists
2. If not, add it: `ALTER TABLE playbook_processes ADD COLUMN client_id UUID REFERENCES clients(id)`
3. Backfill NULL values from associated records if available
4. Verify no orphaned rows (rows where client_id cannot be inferred)
5. Set NOT NULL constraint: `ALTER TABLE playbook_processes ALTER COLUMN client_id SET NOT NULL`

### Dependencies

- **Depends On**: None (first RLS task)
- **Blocks**: US-002, US-003, US-004, Epic 2

### Implementation Notes

- Schema changes must be executed in Supabase SQL editor or via migration script
- Backfill strategy: For rows with orphaned data, determine correct `client_id` from `owner_id` → `profiles.client_id` or document as legacy data
- RLS can be enabled in Supabase console: Settings → Security Policies
- Rollback: Disable RLS in console (Settings → Security Policies) or via SQL: `ALTER TABLE playbook_processes DISABLE ROW LEVEL SECURITY`

---

## Testing Strategy

### Unit Tests (Schema Audit)

- [ ] Test: Column `client_id` exists on `playbook_processes`
- [ ] Test: Column type is UUID
- [ ] Test: NOT NULL constraint is applied
- [ ] Test: Foreign key references `clients.id`

### Integration Tests (RLS Enforcement)

- [ ] Test: RLS is enabled on `playbook_processes` (Supabase Playground)
- [ ] Test: SELECT returns only user's client data (cross-tenant isolation)
- [ ] Test: INSERT without `client_id` is rejected
- [ ] Test: UPDATE cannot change `client_id`

### Manual Tests

- [ ] Step 1: Open Supabase console → SQL Editor
- [ ] Step 2: Run `SELECT * FROM playbook_processes;` with user A
- [ ] Step 3: Verify results are limited to client A only
- [ ] Step 4: Switch to user B; repeat → should see only client B data
- [ ] Step 5: Attempt INSERT with wrong `client_id` → should fail with 42501

---

## Definition of Done (DoD)

- [ ] `playbook_processes` schema audited and `client_id` column verified
- [ ] Legacy rows backfilled with correct `client_id` (or documented as inaccessible)
- [ ] RLS enabled on `playbook_processes` table
- [ ] NO NULL values in `client_id` column
- [ ] Rollback procedure documented and tested
- [ ] Schema integrity verified (no referential constraint violations)
- [ ] Tested in Supabase Playground with multiple user roles
- [ ] Code review approved
- [ ] Commit message: "US-001: Enable RLS on playbook_processes"

---

## References

- **Brief**: `docs/brief.md` — Vulnerability and business context
- **Scope**: `docs/scope.md` — RLS implementation scope
- **Acceptance**: `docs/acceptance.md` — Acceptance criteria AC-001 through AC-004
- **System Spec**: `docs/specs/system.md` — FR-001 (RLS on playbook_processes)
- **Domain Spec**: `docs/specs/domain.md` — Playbook Process entity and BR-001
- **API Spec**: `docs/specs/api.md` — Part 1, Policy 1 (SELECT policy details)
- **ADR-0001**: `docs/adr/ADR-0001-rls-isolation.md` — RLS decision and rationale
- **Rules**: `.claude/rules/rls-isolation.md` — Rules R1, R8 on RLS enforcement
- **CLAUDE.md**: `.claude/CLAUDE.md` — Project methodology

---

## Notes

- Schema audit should identify any legacy processes that cannot be assigned a `client_id` (these become inaccessible under RLS, which is acceptable per business rules)
- Backfill strategy should prioritize data quality: if a `client_id` can be reliably inferred, backfill it; if ambiguous, document the legacy row and mark for manual review
- Supabase Playground is a safe environment to test RLS before deploying to production

---

**Related User Stories**: US-002, US-003 (parallel RLS enablement on other tables)  
**Epic**: Epic 1 — RLS Foundation  
**Phase**: PLAN (Architecture & Decomposition)
