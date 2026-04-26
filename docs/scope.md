# Scope — Isolation Multi-Tenant Sécurisée (Playbook)

## What's IN Scope

### 1. RLS Policy Implementation

- **Enable RLS** on tables:
  - `playbook_processes` (filter by `client_id`)
  - `playbook_steps` (cascade via `process_id` FK)
  - `playbook_owners` (filter by `client_id`)
  
- **Create RLS policies** for CRUD operations:
  - SELECT: Only rows matching authenticated user's `client_id`
  - INSERT: Only if inserting user's `client_id` or admin switching
  - UPDATE: Only rows matching `client_id` + owner verification
  - DELETE: Only rows matching `client_id` + owner verification

- **Admin Switcher Policy**: Allow `role='admin'` users to update their own `client_id` in `profiles` table

### 2. Database Migrations

- Confirm/Add `client_id` (UUID, FK to `clients`) in:
  - `profiles` (CONFIRMED exists)
  - `playbook_processes` (CONFIRMED exists)
  - `playbook_owners` (CONFIRMED exists, if missing add NULL-able column)
  
- Add FK constraints with proper cascade behavior
- Document legacy data handling (orphaned rows without `client_id`)

### 3. Supabase Schema Audits

- Verify `client_id` column existence and type in all relevant tables
- Confirm FK chains for inheritance (`playbook_steps` → `playbook_processes.client_id`)
- Identify any existing views or stored procedures that might bypass RLS

### 4. JavaScript Refactoring

- Refactor all Supabase queries in `js/client/` and `js/admin/` modules:
  - Replace `.select('*')` + client-side filtering with `.eq('client_id', userClientId)`
  - Apply to `playbook_processes`, `playbook_steps`, `playbook_owners` queries
  - Ensure INSERT, UPDATE, DELETE queries respect `client_id` constraints
  
- Create a **refactoring checklist** of files and functions affected
- Add code comments explaining RLS inheritance and policy dependencies

### 5. Admin Switcher UI/UX

- Add **dropdown button/modal** in playbook.html (or main nav) for admins only:
  - Display list of available clients
  - Allow selecting a new active client
  - Call secure endpoint to update `profiles.client_id`
  
- Endpoint (Supabase RLS-protected):
  - POST `/api/switch-client`
  - Input: `{ client_id: UUID }`
  - Validation: Only allow `role='admin'` users
  - Update: `UPDATE profiles SET client_id = $1 WHERE user_id = auth.uid()`

### 6. Testing & Validation

- **Manual cross-tenant isolation tests**:
  - Taïna (Guadeloupe Explor) logs in → Cannot see Face Soul Yoga data
  - Admin switches to Face Soul Yoga → Can see only Face Soul Yoga data
  
- **RLS Supabase Playground tests**: Verify each policy behaves correctly
- **Refactoring audit report**: Confirm all `.select('*')` removed where appropriate

---

## What's OUT of Scope

### 1. Rate Limiting
- Not implementing API rate limiting for MVP
- RLS itself is the security boundary
- Can be added in future phases if DoS threat identified

### 2. Audit Logging
- Not implementing `audit_logs` or `client_switches` table
- Logging can be added in Phase MODEL if compliance requires it
- PostgreSQL transaction logs can capture RLS denials

### 3. Advanced Access Control
- Not implementing:
  - Granular role-based access control (RBAC) beyond `admin` / `client`
  - Time-based or context-aware permissions
  - Delegation of admin rights to clients
  
- Current binary role model (`role='admin' | 'client'`) is sufficient

### 4. New Schema Components
- Not creating a new `clients` table (assumed to exist)
- Not adding metadata columns to `clients` (name, address, logo assumed present)
- Not refactoring existing table structures beyond adding `client_id` where missing

### 5. Edge Functions / Rate Limiting
- Not implementing new Edge Functions for request validation
- Admin switcher endpoint uses native Supabase RLS (no custom function required)

### 6. API Gateway / Authentication Overhaul
- Not changing Supabase Auth configuration
- Existing email/password auth with JWT tokens is used as-is
- No OAuth provider changes

---

## Assumptions

### A1: Column Existence
- **Assumption**: `client_id` (UUID, FK to `clients.id`) exists in:
  - `profiles` table — CONFIRMED via Q1 response
  - `playbook_processes` table — CONFIRMED via Q6 response
  - `playbook_owners` table — CONFIRMED via Q4 response (if missing, nullable column added)
  
- **Action**: Phase MODEL will verify via schema audit

### A2: All Users Have `client_id`
- **Assumption**: Both admins and regular clients have a `client_id` in `profiles`
  - Admin `client_id` = "active client" (can be switched)
  - Client `client_id` = fixed, cannot be changed
  
- **Verified by**: Q2 response ✓

### A3: Inheritance Chain
- **Assumption**: `playbook_steps.process_id` → `playbook_processes.client_id`
  - Steps inherit client isolation via this FK relationship
  - RLS on `playbook_steps` uses sub-query on `playbook_processes`
  
- **To Confirm**: Phase MODEL audit (Q5)

### A4: JavaScript Uses `supabase.from()`
- **Assumption**: All Supabase queries in JavaScript use the official `supabase.from()` client library
  - No raw HTTP requests bypassing the client library
  - No direct PostgreSQL wire protocol calls
  
- **To Audit**: Phase MODEL (Q11)

### A5: No RLS Bypass via Views
- **Assumption**: No existing views or stored procedures that:
  - Bypass RLS on base tables
  - Aggregate data from multiple clients without filtering
  
- **To Audit**: Phase MODEL (Q12)

### A6: Admin-Only Switching
- **Assumption**: Only users with `role='admin'` can switch `client_id`
  - Regular clients (`role='client'`) are locked to their assigned `client_id`
  
- **Verified by**: Q7 response ✓

### A7: All Users of Same Client Can Modify Owners
- **Assumption**: Any user (admin or client) with the same `client_id` can:
  - INSERT new `playbook_owners` records (if process belongs to their client)
  - UPDATE existing `playbook_owners` records
  - RLS will filter by `client_id` match
  
- **Verified by**: Q9 response ✓

### A8: No Legacy Data Quarantine Table
- **Assumption**: Existing `playbook_processes` rows without `client_id` are:
  - Left as NULL (orphaned)
  - Quarantined for manual audit
  - Not auto-populated during migration
  
- **To Clarify**: Phase MODEL (Q15)

---

## Audit Required (Phase MODEL)

### Q11: JavaScript Query Audit
- **Task**: Search codebase for `.select('*')` patterns
  - Which files use it?
  - Which queries should be filtered?
  - Can they be refactored safely?
  
- **Output**: Refactoring checklist with files and line numbers

### Q12: View/Procedure Audit
- **Task**: List all views and stored procedures in Supabase schema
  - Do any access `playbook_processes`, `playbook_steps`, or `playbook_owners`?
  - Do they use `SECURITY INVOKER` or `SECURITY DEFINER`?
  - Do they filter by `client_id` or bypass RLS?
  
- **Output**: Audit report with recommendations

### Q15: Legacy Data Handling
- **Task**: Identify `playbook_processes` rows without `client_id`
  - Count orphaned rows
  - Can they be assigned to a default client?
  - Should they be deleted?
  
- **Output**: Migration script + cleanup recommendations

---

## Constraints & Dependencies

### Technical Constraints
- **PostgreSQL RLS**: Feature available in PostgreSQL 9.5+
  - Supabase uses PostgreSQL 13+ (compatible)
- **Supabase JS Client**: Must support `.eq()` method for filtering
  - Current client library version supports this
- **Browser JavaScript**: No console-bypassing of RLS policies
  - RLS enforcement is at database layer only

### Organizational Constraints
- **Timeline**: 3–5 days (audit + implementation + testing)
- **No schema-breaking changes**: All migrations are additive
- **No UI redesign**: Admin switcher is minimal addition

### External Dependencies
- **Supabase Project**: dcynlifggjiqqihincbp (eu-north-1)
- **GitHub Pages Deployment**: CI/CD remains unchanged

---

## Definition of Done

### MVP Acceptance Criteria

1. **RLS Policies Deployed**
   - [ ] `playbook_processes` RLS enabled (SELECT/INSERT/UPDATE/DELETE policies)
   - [ ] `playbook_steps` RLS enabled (cascading via FK)
   - [ ] `playbook_owners` RLS enabled (SELECT/INSERT/UPDATE/DELETE policies)
   - [ ] All policies tested in Supabase Playground

2. **Database Migrations Applied**
   - [ ] `client_id` verified in `profiles`, `playbook_processes`, `playbook_owners`
   - [ ] FK constraints added (if missing)
   - [ ] Migration script runs cleanly on Supabase

3. **JavaScript Refactored**
   - [ ] All `.select('*')` on playbook tables replaced with `.eq('client_id', ...)`
   - [ ] Code audit confirms no client-side filtering of RLS-subject data
   - [ ] Refactoring checklist 100% complete

4. **Admin Switcher Implemented**
   - [ ] Button/dropdown visible in playbook.html (admin-only)
   - [ ] Endpoint updates `profiles.client_id` securely
   - [ ] RLS prevents non-admins from calling endpoint
   - [ ] Functional tests pass

5. **Multi-Tenant Isolation Verified**
   - [ ] Taïna (Guadeloupe Explor) logs in → sees only Guadeloupe Explor data
   - [ ] Face Soul Yoga data is completely hidden from Taïna
   - [ ] Admin switches to Face Soul Yoga → sees only Face Soul Yoga data
   - [ ] Switching back to Guadeloupe Explor → data reappears correctly

6. **Documentation & Security**
   - [ ] RLS policy documentation added (comments in migration file)
   - [ ] Secure-by-Design checklist passed
   - [ ] No console errors when using playbook
   - [ ] Code comments explain inheritance chain

---

## Success Metrics

| Metric | Target |
|--------|--------|
| **RLS Policies Active** | 100% (3 tables × 4 operations) |
| **JavaScript Queries Compliant** | 100% (no unsafe `.select('*')`) |
| **Cross-Tenant Isolation** | ZERO data leakage between clients |
| **Admin Switcher Uptime** | 100% (after deployment) |
| **Performance Degradation** | <5% (RLS has minimal overhead) |
| **Code Coverage** | 100% of refactored modules |

---

## Out-of-Band Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Legacy data incompleteness** | Medium | High | Phase MODEL audit (Q15) |
| **JavaScript audit reveals large refactoring** | Medium | High | Early identification (Q11) |
| **Views/procedures bypass RLS** | Low | Critical | Phase MODEL audit (Q12) |
| **Admin account compromised** | Low | Medium | RLS still applies; can only see assigned client |

---

**Prepared by**: Factory Pipeline (BREAK Phase)  
**Next Phase**: MODEL  
**Last Updated**: 2026-04-26
