# Task — TASK-0001 Audit playbook_processes Schema and Verify client_id

**User Story**: US-001 — Enable RLS on playbook_processes  
**Epic**: Epic 1 — RLS Foundation  
**Status**: TODO  
**Complexity**: LOW  
**Estimated Hours**: 1

---

## Overview

Audit the `playbook_processes` table schema to verify the `client_id` column exists and is correctly configured as a foreign key to the `clients` table. This foundational task ensures the database is ready for RLS enablement.

**Purpose**: Establish baseline schema state before enabling RLS.

---

## Acceptance Criteria

### AC-1: Column `client_id` Exists

**Given** the `playbook_processes` table is queried  
**When** schema is inspected  
**Then** column `client_id` exists with type UUID

**Verification**:
- [ ] Column name is `client_id`
- [ ] Column type is UUID
- [ ] Nullability: Check current state (may be NULL initially)

### AC-2: Foreign Key Relationship

**Given** `client_id` column exists  
**When** schema constraints are inspected  
**Then** FK reference to `clients.id` is verified (or note if missing)

**Verification**:
- [ ] FK constraint exists (or documented as missing)
- [ ] Points to `clients.id` (if exists)
- [ ] No orphaned references

### AC-3: No Duplicate Rows (Audit)

**Given** all rows in `playbook_processes` are examined  
**When** duplicate processes are checked  
**Then** no logical duplicates with NULL client_id and same process_id

**Verification**:
- [ ] Query executed: `SELECT COUNT(*) FROM playbook_processes WHERE client_id IS NULL`
- [ ] Result documented (NULL count)

### AC-4: Schema Audit Report

**Given** all checks complete  
**When** audit report is generated  
**Then** document current schema state with any issues

**Verification**:
- [ ] SCHEMA-AUDIT.md created in docs/planning/v1/
- [ ] Lists findings: column existence, FK status, NULL count

---

## Task Definition

### What to Do

1. **Connect to Supabase** via SQL Editor (or via local database if available)
2. **Inspect `playbook_processes` table schema** using SQL:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'playbook_processes'
   ORDER BY ordinal_position;
   ```

3. **Verify FK constraints** (if using Supabase, check via UI or SQL):
   ```sql
   SELECT constraint_name, table_name, column_name
   FROM information_schema.key_column_usage
   WHERE table_name = 'playbook_processes';
   ```

4. **Count NULL client_id rows**:
   ```sql
   SELECT COUNT(*) AS null_client_id_count
   FROM playbook_processes
   WHERE client_id IS NULL;
   ```

5. **Document findings** in SCHEMA-AUDIT.md

### Files to Create/Modify

| File | Action | Status |
|------|--------|--------|
| `docs/planning/v1/SCHEMA-AUDIT.md` | Create | TODO |

### Code Context (Existing Codebase)

**From `app.html` (current implementation)**:
The application currently loads playbook data without client isolation:
```javascript
// Line ~250 in app.html
async function loadPlaybook() {
  const { data: processes, error } = await supabase
    .from('playbook_processes')
    .select('*');  // ← No client_id filtering!
  // ...
}
```

This query currently returns ALL processes from ALL clients. Post-RLS, queries must include `.eq('client_id', userClientId)` filtering.

---

## Specification Context

### System Requirements

**From docs/specs/system.md — FR-001**:
- RLS Policy on `playbook_processes` table
- Policy enforces: `profiles.client_id = playbook_processes.client_id`
- Prerequisite: `client_id` column must exist and be NOT NULL (after backfill)

**From docs/specs/domain.md**:
- Entity: `Playbook Process`
- Attributes include: `id` (PK), `client_id` (FK to clients), `name`, `description`, `owner_id`, `status`, etc.
- Constraint: `client_id` is immutable after creation (Rule R4)

### Rules & Standards

**From .claude/rules/rls-isolation.md**:
- Rule R1: RLS is single source of truth (database layer)
- Rule R8: Legacy data without `client_id` is inaccessible by RLS
- Schema audit ensures no surprises when RLS is enabled

---

## Testing Strategy

### Unit Tests (Schema Validation)

```sql
-- Test 1: client_id column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'playbook_processes' AND column_name = 'client_id';
-- Expected: Returns 1 row with column_name = 'client_id'

-- Test 2: Column type is UUID
SELECT data_type FROM information_schema.columns
WHERE table_name = 'playbook_processes' AND column_name = 'client_id';
-- Expected: Returns 'uuid'

-- Test 3: FK constraint exists
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'playbook_processes' AND constraint_type = 'FOREIGN KEY';
-- Expected: Returns FK constraint name

-- Test 4: Count NULL client_id (baseline)
SELECT COUNT(*) FROM playbook_processes WHERE client_id IS NULL;
-- Expected: Returns count of legacy rows (will be backfilled in TASK-0002)
```

### Manual Tests

- [ ] Step 1: Open Supabase → SQL Editor
- [ ] Step 2: Run schema inspection query
- [ ] Step 3: Review results and document findings
- [ ] Step 4: Cross-check with UI (Supabase Table Editor)
- [ ] Step 5: Create audit report

---

## Definition of Done (DoD)

- [ ] Schema audit executed (all 4 SQL queries run successfully)
- [ ] `client_id` column verified to exist with UUID type
- [ ] Foreign key relationship confirmed (or documented as missing for Backfill task)
- [ ] NULL client_id count determined and documented
- [ ] SCHEMA-AUDIT.md created with findings
- [ ] No blocking issues identified (if issues exist, escalate before backfill)
- [ ] Commit message: "TASK-0001: Audit playbook_processes schema"
- [ ] Ready for TASK-0002 (Backfill)

---

## SCHEMA-AUDIT.md Template

```markdown
# Schema Audit Report — playbook_processes

**Date**: [Today's Date]
**Auditor**: [Your Name]
**Table**: playbook_processes

## Findings

### Column: client_id

| Property | Status | Value |
|----------|--------|-------|
| Exists | ✓ / ✗ | [YES/NO] |
| Type | ✓ / ✗ | [UUID / other] |
| Nullable | [YES/NO] | - |
| Default | [Value or NULL] | - |

### Foreign Keys

| Constraint | Status | Points To |
|------------|--------|-----------|
| FK to clients | ✓ / ✗ | [clients.id or MISSING] |

### Data Audit

| Metric | Count |
|--------|-------|
| Total playbook_processes rows | [N] |
| Rows with NULL client_id | [N] |
| Rows with valid client_id | [N] |

## Issues Found

[List any issues; if none, state "No issues found"]

## Next Steps

1. TASK-0002: Backfill legacy rows with client_id
2. TASK-0003: Enable RLS on playbook_processes

## Sign-Off

- [ ] Audit complete and verified
- [ ] Blockers identified and escalated
- [ ] Ready to proceed to next task
```

---

## Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| client_id column missing | LOW | HIGH | Create column in TASK-0002 (upgrade, not blocky) |
| FK constraint missing | MEDIUM | MEDIUM | Document and add in TASK-0002 |
| Large NULL client_id count | MEDIUM | MEDIUM | Plan backfill strategy in TASK-0002 |
| Data integrity issues | LOW | HIGH | Escalate to tech lead before proceeding |

---

## References

- **System Spec**: `docs/specs/system.md` — FR-001
- **Domain Spec**: `docs/specs/domain.md` — Playbook Process entity
- **API Spec**: `docs/specs/api.md` — RLS policies (Part 1)
- **Rules**: `.claude/rules/rls-isolation.md` — Rule R1, R8
- **Current Implementation**: `app.html` (~line 250)

---

## Notes

- Use Supabase SQL Editor for all queries (secure, logged)
- Document all findings in SCHEMA-AUDIT.md (becomes reference for TASK-0002)
- If column is missing entirely, you can still proceed (TASK-0002 will add it)
- Focus on baseline understanding; issues are resolved in subsequent tasks

---

**Next Task**: TASK-0002 — Backfill playbook_processes with client_id

---

**Phase**: PLAN (Architecture & Decomposition)  
**Status**: Ready for BUILD  
**Epic**: Epic 1 — RLS Foundation
