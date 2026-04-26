# Acceptance Criteria — Isolation Multi-Tenant Sécurisée (Playbook)

## Definition of Done (DoD)

This document defines the acceptance criteria for the secure playbook multi-tenant isolation feature. **All items must be verified before Phase QA sign-off.**

---

## Category 1: RLS Policy Deployment

### AC-001: RLS Enabled on `playbook_processes`

**Requirement**: Row Level Security is enabled on the `playbook_processes` table with complete CRUD policies.

**Acceptance Criteria**:
- [ ] `ALTER TABLE playbook_processes ENABLE ROW LEVEL SECURITY;` executed
- [ ] SELECT policy: `(profiles.client_id = playbook_processes.client_id)`
- [ ] INSERT policy: `(auth.uid() = profiles.user_id AND profiles.client_id = NEW.client_id)`
- [ ] UPDATE policy: `(auth.uid() = profiles.user_id AND profiles.client_id = playbook_processes.client_id)`
- [ ] DELETE policy: `(auth.uid() = profiles.user_id AND profiles.client_id = playbook_processes.client_id)`
- [ ] Policy tested in Supabase Playground: Admin can INSERT/SELECT/UPDATE/DELETE only for their `client_id`
- [ ] Unauthorized user cannot SELECT rows from other `client_id`

**Verification Method**: Supabase Playground SQL test

---

### AC-002: RLS Enabled on `playbook_steps` (Cascading)

**Requirement**: Row Level Security on `playbook_steps` cascades via FK relationship to `playbook_processes.client_id`.

**Acceptance Criteria**:
- [ ] `ALTER TABLE playbook_steps ENABLE ROW LEVEL SECURITY;` executed
- [ ] SELECT policy: Uses sub-query `(SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id)` matching `profiles.client_id`
- [ ] INSERT policy: Only if process belongs to user's `client_id`
- [ ] UPDATE policy: Only if process belongs to user's `client_id`
- [ ] DELETE policy: Only if process belongs to user's `client_id`
- [ ] Test: User from Client A cannot access steps from Client B's processes
- [ ] FK chain verified: `playbook_steps.process_id` → `playbook_processes.client_id`

**Verification Method**: Supabase Playground SQL test + manual FK chain validation

---

### AC-003: RLS Enabled on `playbook_owners`

**Requirement**: Row Level Security is enabled on the `playbook_owners` table with complete CRUD policies.

**Acceptance Criteria**:
- [ ] `ALTER TABLE playbook_owners ENABLE ROW LEVEL SECURITY;` executed
- [ ] SELECT policy: `(profiles.client_id = playbook_owners.client_id)`
- [ ] INSERT policy: `(auth.uid() = profiles.user_id AND profiles.client_id = NEW.client_id)`
- [ ] UPDATE policy: `(auth.uid() = profiles.user_id AND profiles.client_id = playbook_owners.client_id)`
- [ ] DELETE policy: `(auth.uid() = profiles.user_id AND profiles.client_id = playbook_owners.client_id)`
- [ ] Policy tested in Supabase Playground: User can INSERT/SELECT/UPDATE/DELETE only for their `client_id`
- [ ] `playbook_owners.client_id` column exists (confirmed in Q4 response)

**Verification Method**: Supabase Playground SQL test

---

### AC-004: All RLS Policies Pass Playground Tests

**Requirement**: Comprehensive RLS policy testing in Supabase Playground with multiple user roles.

**Acceptance Criteria**:
- [ ] Test Case 1: Admin user (role='admin', client_id='Client A')
  - [ ] Can SELECT all own processes/steps/owners from Client A
  - [ ] Cannot SELECT any data from Client B
  - [ ] Can INSERT/UPDATE/DELETE Client A data
  - [ ] Cannot INSERT/UPDATE/DELETE Client B data
  
- [ ] Test Case 2: Client user (role='client', client_id='Guadeloupe Explor')
  - [ ] Can SELECT only Guadeloupe Explor data
  - [ ] Cannot SELECT Face Soul Yoga data
  - [ ] Can INSERT/UPDATE/DELETE only Guadeloupe Explor owners (if process is theirs)
  
- [ ] Test Case 3: Admin switches client (via admin switcher)
  - [ ] After switching to Client B, can SELECT only Client B data
  - [ ] Cannot SELECT previous Client A data
  - [ ] Isolation verified before and after switch
  
- [ ] Test Case 4: Boundary conditions
  - [ ] Orphaned rows (client_id = NULL) are filtered out
  - [ ] No wildcard SELECT bypasses RLS
  - [ ] Subqueries respect RLS

**Verification Method**: Recorded Supabase Playground test session with test cases above

---

## Category 2: Database Migrations & Schema

### AC-005: `client_id` Column Verification

**Requirement**: `client_id` column exists in all relevant tables with correct type and constraints.

**Acceptance Criteria**:
- [ ] `profiles.client_id` exists (UUID, NOT NULL)
  - Verified in Q1 response ✓
  
- [ ] `playbook_processes.client_id` exists (UUID, NOT NULL)
  - Verified in Q6 response ✓
  
- [ ] `playbook_owners.client_id` exists (UUID, NOT NULL or nullable with default)
  - Verified in Q4 response ✓
  
- [ ] All `client_id` columns have FK constraint to `clients.id`
- [ ] No orphaned rows (or if exists, explicitly documented as legacy data)

**Verification Method**: Schema inspection + `\d` command in PostgreSQL

---

### AC-006: Migration Script Executes Cleanly

**Requirement**: Any new or updated migrations for adding `client_id` or RLS policies execute without errors.

**Acceptance Criteria**:
- [ ] Migration file created: `migrations/YYYYMMDD_add_client_id_and_rls.sql`
- [ ] Migration includes:
  - RLS enable statements
  - Policy CREATE statements (4 per table: SELECT, INSERT, UPDATE, DELETE)
  - FK constraints (if missing)
  - Data cleanup/backfill for legacy rows
  
- [ ] Dry-run on Supabase test project succeeds
- [ ] Rollback script provided (DROP policies, disable RLS if needed)
- [ ] No data loss or truncation during migration

**Verification Method**: Supabase migration runner + test environment

---

### AC-007: Legacy Data Audit Report

**Requirement**: Document handling of existing `playbook_processes` rows without `client_id`.

**Acceptance Criteria**:
- [ ] SQL query identifies orphaned rows: `SELECT COUNT(*) FROM playbook_processes WHERE client_id IS NULL;`
- [ ] Decision made for each orphaned row:
  - [ ] Assign to a default client (migration script specifies default)
  - [ ] Mark as NULL and filter via RLS
  - [ ] Delete (if no dependent steps/owners)
  
- [ ] Audit report generated: `docs/legacy-data-audit.md`
  - Count of orphaned rows
  - Migration strategy
  - Verification steps before cleanup
  
- [ ] Phase MODEL clarification for Q15 satisfied

**Verification Method**: Audit report document + SQL query results

---

## Category 3: JavaScript Refactoring

### AC-008: No `.select('*')` Without Filtering

**Requirement**: All JavaScript queries on RLS-protected tables use explicit `.eq('client_id', userClientId)` filtering.

**Acceptance Criteria**:
- [ ] Grep search for `.select('*')` in `js/client/` and `js/admin/` directories
- [ ] Output: List of files and line numbers
- [ ] For each occurrence:
  - [ ] Refactored to include `.eq('client_id', userClientId)` OR
  - [ ] Documented as NOT applicable (e.g., system config, public data)
  
- [ ] Refactoring checklist file created: `docs/refactoring-checklist.md`
  - Files affected
  - Functions modified
  - Before/after code snippets
  - QA verification per file
  
- [ ] All occurrences of unsafe patterns removed
- [ ] No console warnings or errors during refactoring

**Verification Method**: Code audit + grep output + refactoring checklist

---

### AC-009: JavaScript Queries Respect `client_id` Filtering

**Requirement**: All CRUD operations in JavaScript explicitly filter by authenticated user's `client_id`.

**Acceptance Criteria**:
- [ ] SELECT queries: `.eq('client_id', userClientId)` applied
- [ ] INSERT queries: Include `client_id: userClientId` in new row
- [ ] UPDATE queries: Include WHERE `.eq('client_id', userClientId)` in filter
- [ ] DELETE queries: Include WHERE `.eq('client_id', userClientId)` in filter
- [ ] Code comments explain: "RLS enforces this filter at DB layer"
- [ ] Test cases verify: JavaScript layer and RLS layer both filter (defense-in-depth)

**Verification Method**: Code review + inline test execution

---

### AC-010: Refactoring Completeness Audit

**Requirement**: 100% of playbook-related JavaScript modules have been audited and refactored.

**Acceptance Criteria**:
- [ ] List of all JavaScript modules using playbook tables:
  - [ ] `js/client/playbook.js` (or equivalent)
  - [ ] `js/admin/playbook-admin.js` (or equivalent)
  - [ ] Any other modules
  
- [ ] Each module refactored and verified
- [ ] Refactoring checklist signed off by developer
- [ ] QA verification per module
- [ ] No technical debt comments left ("TODO: add client_id filter")

**Verification Method**: Module inventory + refactoring checklist + code review

---

## Category 4: Admin Switcher Implementation

### AC-011: Admin Switcher UI Component Exists

**Requirement**: Dropdown button or modal for admins to switch active `client_id` is implemented in playbook.html.

**Acceptance Criteria**:
- [ ] Button/dropdown visible in playbook.html UI (e.g., top-right, next to user profile)
- [ ] Visible **only** to users with `role='admin'`
- [ ] Hidden from `role='client'` users (no JS hack can expose)
- [ ] UI displays list of available clients
- [ ] Current client is highlighted/selected
- [ ] Selecting a different client triggers switch action

**Verification Method**: Manual UI inspection + role-based visibility test

---

### AC-012: Admin Switcher Endpoint Secured

**Requirement**: Backend endpoint for switching `client_id` is protected by RLS and validates admin role.

**Acceptance Criteria**:
- [ ] Endpoint created: `POST /api/switch-client` (or equivalent)
- [ ] Input validation: `{ client_id: UUID }`
- [ ] Authentication check: `auth.uid()` must exist
- [ ] Authorization check: `role='admin'` verified via `profiles` table
- [ ] Operation: `UPDATE profiles SET client_id = $1 WHERE user_id = auth.uid()`
- [ ] RLS on `profiles` prevents non-admins from executing this update
- [ ] Response: `{ success: true, client_id: UUID, client_name: string }`
- [ ] Error handling: Return 403 if non-admin, 400 if invalid client_id

**Verification Method**: API endpoint test + RLS validation

---

### AC-013: Admin Switch Isolation Verified

**Requirement**: After switching, admin sees only the new client's data; previous client data is hidden.

**Acceptance Criteria**:
- [ ] Test: Admin logs in, active client = "Client A"
  - [ ] Playbook loads Client A data only
  
- [ ] Test: Admin switches to "Client B" via dropdown
  - [ ] Endpoint called, `profiles.client_id` updated
  - [ ] Page reloads or data refreshes
  - [ ] Playbook now displays Client B data only
  - [ ] Client A data is completely hidden
  
- [ ] Test: Admin switches back to "Client A"
  - [ ] Client A data reappears correctly
  - [ ] Client B data hidden
  
- [ ] Test: Session persistence
  - [ ] Refresh page → still on selected client
  - [ ] Close tab, reopen → load from `profiles.client_id` (persistent)

**Verification Method**: Manual functional testing + network inspection

---

## Category 5: Multi-Tenant Isolation Verification

### AC-014: Taïna Isolation (Guadeloupe Explor vs Face Soul Yoga)

**Requirement**: Critical business test: Taïna (Guadeloupe Explor client) cannot see Face Soul Yoga data.

**Acceptance Criteria**:
- [ ] Test Setup:
  - [ ] Create test users: `taïna@guadeloupe.fr` (role='client', client_id='Guadeloupe Explor')
  - [ ] Create test user: `admin@facesoulyoga.fr` (role='admin', client_id='Face Soul Yoga')
  
- [ ] Taïna's Perspective:
  - [ ] Login as Taïna
  - [ ] Navigate to playbook.html
  - [ ] Load playbook_processes: See **only** Guadeloupe Explor processes
  - [ ] Verify Face Soul Yoga processes are NOT visible
  - [ ] Verify playbook_steps filtered to Guadeloupe Explor only
  - [ ] Verify playbook_owners filtered to Guadeloupe Explor only
  
- [ ] Admin's Perspective:
  - [ ] Login as Face Soul Yoga admin
  - [ ] Navigate to playbook.html
  - [ ] Load playbook_processes: See Face Soul Yoga processes
  - [ ] Switch to Guadeloupe Explor via dropdown
  - [ ] Load playbook_processes: Now see Guadeloupe Explor processes
  - [ ] Verify no data leakage between switches
  
- [ ] API-Level Test (Supabase Playground):
  - [ ] Logged in as Taïna: `SELECT * FROM playbook_processes;`
    - [ ] Returns only Guadeloupe Explor rows
  - [ ] Logged in as Face Soul Yoga admin: `SELECT * FROM playbook_processes;`
    - [ ] Returns Face Soul Yoga rows
    - [ ] After switch: Returns Guadeloupe Explor rows

**Verification Method**: Manual testing + Supabase Playground SQL verification

---

### AC-015: ANON Key Attack Simulation

**Requirement**: Verify that exposed ANON key cannot bypass RLS isolation.

**Acceptance Criteria**:
- [ ] Obtain ANON key from public HTML source (it's exposed by design)
- [ ] Create Supabase client with ANON key: `const client = createClient(URL, ANON_KEY)`
- [ ] Attempt to bypass RLS:
  - [ ] `SELECT * FROM playbook_processes;` → RLS blocks, returns 0 rows
  - [ ] `SELECT * FROM playbook_steps;` → RLS blocks, returns 0 rows
  - [ ] `SELECT * FROM playbook_owners;` → RLS blocks, returns 0 rows
  
- [ ] Attempt to INSERT data without `client_id`:
  - [ ] INSERT fails: `INSERT INTO playbook_processes VALUES (...);` → RLS denial
  
- [ ] Verify: **RLS is the single source of truth**; ANON key alone cannot access data

**Verification Method**: Supabase Playground with ANON key + test SQL queries

---

## Category 6: Code Quality & Documentation

### AC-016: Code Comments Explain RLS Inheritance

**Requirement**: JavaScript code includes comments explaining the RLS architecture and inheritance chain.

**Acceptance Criteria**:
- [ ] Comment pattern: "This query respects RLS: client_id is enforced at DB layer"
- [ ] For cascading queries (playbook_steps): "Inherits client_id from playbook_processes via FK"
- [ ] For admin switcher: "Admin can switch; RLS restricts to new client_id"
- [ ] For legacy data: "Orphaned rows (client_id = NULL) filtered by RLS"
- [ ] All comments are clear, concise, and helpful for future maintainers

**Verification Method**: Code inspection + grep for comment patterns

---

### AC-017: RLS Policy Documentation

**Requirement**: SQL migration file and/or architecture document explains each RLS policy.

**Acceptance Criteria**:
- [ ] Migration file includes comment for each policy:
  ```sql
  -- playbook_processes: SELECT policy
  -- Purpose: Allow user to view only processes belonging to their client
  -- Logic: auth.uid matches profiles, and client_id matches
  CREATE POLICY ... FOR SELECT ...
  ```
  
- [ ] Architecture document (e.g., `docs/rls-architecture.md`) explains:
  - Why RLS is needed (security isolation)
  - How each table is protected
  - FK inheritance chain for playbook_steps
  - Admin switcher mechanism
  - Troubleshooting tips
  
- [ ] Code is maintainable: Future developers can understand and modify policies

**Verification Method**: Document review + code comment audit

---

### AC-018: Secure-by-Design Checklist Passed

**Requirement**: Security audit confirms RLS implementation follows Secure-by-Design principles.

**Acceptance Criteria**:
- [ ] Run `/secure-by-design` skill (from `01-entreprise/skills/secure-by-design/SKILL.md`)
- [ ] Checklist items passed:
  - [ ] Authentication: JWT tokens validated (Supabase Auth handles this)
  - [ ] Authorization: RLS policies enforce access control
  - [ ] Data protection: Encryption at rest (Supabase provides this)
  - [ ] Injection prevention: Parameterized queries (Supabase JS client uses this)
  - [ ] Audit trail: Legacy data handling documented
  
- [ ] No critical security issues identified
- [ ] Signed off by security reviewer

**Verification Method**: Secure-by-Design skill execution + audit report

---

## Category 7: Phase MODEL Clarifications

### AC-019: Q11 JavaScript Query Audit Complete

**Requirement**: Phase MODEL delivers audit of all `.select('*')` usage in JavaScript.

**Acceptance Criteria**:
- [ ] Audit report generated: `docs/javascript-audit-q11.md`
- [ ] Contents:
  - [ ] All files scanned for `.select('*')` pattern
  - [ ] Line numbers and context for each occurrence
  - [ ] Classification: "Safe" (public data), "Refactored" (now uses .eq()), or "Out-of-Scope"
  - [ ] Refactoring checklist linked
  
- [ ] 100% of applicable patterns refactored
- [ ] Q11 answer integrated into JavaScript Refactoring (AC-008 through AC-010)

**Verification Method**: Audit report document + code review

---

### AC-020: Q12 Views/Procedures Audit Complete

**Requirement**: Phase MODEL audits for views or stored procedures that might bypass RLS.

**Acceptance Criteria**:
- [ ] Audit report generated: `docs/views-procedures-audit-q12.md`
- [ ] Contents:
  - [ ] All views listed with their SQL definitions
  - [ ] All stored procedures listed with their SQL definitions
  - [ ] Assessment: Does it access RLS-protected tables?
  - [ ] If yes: Does it use `SECURITY INVOKER` or `SECURITY DEFINER`?
  - [ ] If yes: Does it filter by `client_id` or bypass RLS?
  - [ ] Recommendation: Modify, leave as-is, or deprecate
  
- [ ] Any risky views/procedures are refactored or deprecated
- [ ] Q12 finding integrated into Phase BUILD

**Verification Method**: Audit report document + SQL inspection

---

### AC-021: Q15 Legacy Data Handling Complete

**Requirement**: Phase MODEL clarifies how to handle orphaned `playbook_processes` without `client_id`.

**Acceptance Criteria**:
- [ ] Audit report generated: `docs/legacy-data-q15.md`
- [ ] Contents:
  - [ ] SQL query results: Count and examples of orphaned rows
  - [ ] Business decision: Which orphaned rows can be assigned to a client?
  - [ ] Migration strategy: Backfill, delete, or quarantine?
  - [ ] Data validation: Before/after counts
  - [ ] Rollback plan: In case of data loss
  
- [ ] Migration script handles all orphaned rows according to decision
- [ ] Verified in Phase BUILD

**Verification Method**: Audit report document + migration test

---

## Sign-Off & Approval

### Phase QA Lead Sign-Off

- [ ] **Name**: _______________________
- [ ] **Title**: _______________________
- [ ] **Date**: _______________________
- [ ] **All AC items verified and passed**: YES / NO

### Security Reviewer Sign-Off

- [ ] **Name**: _______________________
- [ ] **Title**: _______________________
- [ ] **Date**: _______________________
- [ ] **RLS policies are secure**: YES / NO
- [ ] **No data leakage risks identified**: YES / NO

### Product Owner Sign-Off

- [ ] **Name**: _______________________
- [ ] **Title**: _______________________
- [ ] **Date**: _______________________
- [ ] **Business requirements met**: YES / NO
- [ ] **Taïna isolation verified**: YES / NO

---

## Release Gate Checklist

Before deploying to production, verify:

- [ ] All AC items (AC-001 through AC-021) are marked complete
- [ ] No critical security issues from `/secure-by-design` audit
- [ ] Cross-tenant isolation manual test passed (Taïna isolation)
- [ ] ANON key attack simulation passed
- [ ] Phase MODEL clarifications integrated (Q11, Q12, Q15)
- [ ] Code review approved by 2+ team members
- [ ] Documentation complete and reviewed

**Only after all gates are passed can deployment proceed.**

---

**Document Version**: 1.0  
**Created**: 2026-04-26  
**Phase**: BREAK Complete → Ready for MODEL  
**Next Phase Gate**: Gate 1 (Spec) → Gate 2 (Plan) → Gate 3 (Build) → Gate 4 (QA)
