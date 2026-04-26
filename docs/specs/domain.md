# Domain Specification — Playbook Multi-Tenant Isolation

**Version**: 1.0  
**Evolution Mode**: Greenfield V1  
**Generated**: 2026-04-26  
**Phase**: MODEL (Domain Model)  
**Status**: Ready for Architecture Review

---

## Executive Summary

This document defines the domain model and business logic for the secure playbook multi-tenant isolation feature. It translates business requirements (Scope, Acceptance Criteria) into technical domain concepts and business rules.

---

## Domain Model

### 1. Core Entities

#### Entity: Client

**Description**: A tenant in the multi-tenant system (e.g., "Guadeloupe Explor", "Face Soul Yoga").

**Properties**:
- `id` (UUID): Primary key
- `name` (string): Client name
- `created_at` (timestamp): Creation date
- `updated_at` (timestamp): Last update

**Business Rules**:
- Each client is independent; no data sharing except via admin bridge
- Admin users can switch between clients
- Regular clients are locked to one client

---

#### Entity: User (Profile)

**Description**: A user account with authentication and role information.

**Properties**:
- `user_id` (UUID): Supabase Auth user ID
- `client_id` (UUID): Assigned or active client (FK to `clients`)
- `role` (enum: 'admin' | 'client'): User role
- `created_at` (timestamp): Account creation date
- `updated_at` (timestamp): Last update

**Business Rules**:
- **Admin Role**: Can switch `client_id` to view different clients
- **Client Role**: Locked to assigned `client_id`, cannot change
- Every user must have a `client_id` (no NULL values)
- RLS policy: Only users with same `client_id` can see each other's data

---

#### Entity: Playbook Process

**Description**: A business process defined in the playbook system.

**Properties**:
- `id` (UUID): Primary key
- `client_id` (UUID): Owner client (FK to `clients`)
- `name` (string): Process name
- `description` (text, optional): Process description
- `owner_id` (UUID): User who created the process (optional FK to `profiles`)
- `status` (enum: 'draft' | 'active' | 'archived'): Process status
- `created_at` (timestamp): Creation date
- `updated_at` (timestamp): Last update

**Business Rules**:
- Every process belongs to exactly one client (immutable after creation)
- Cross-client processes are not allowed (RLS blocks them)
- Legacy rows without `client_id` are filtered out (treated as orphaned)
- Only users from the same client can view/edit processes

---

#### Entity: Playbook Step

**Description**: A step within a playbook process.

**Properties**:
- `id` (UUID): Primary key
- `process_id` (UUID): Parent process (FK to `playbook_processes`)
- `client_id` (UUID): Owner client (inherited from process via FK chain)
- `name` (string): Step name
- `description` (text, optional): Step description
- `order` (integer): Sequence within process
- `created_at` (timestamp): Creation date
- `updated_at` (timestamp): Last update

**Business Rules**:
- Steps inherit `client_id` from their parent process (cascading isolation)
- `client_id` is not directly assigned; derived from FK chain
- Steps cannot be moved to a different client (immutable process_id)
- Isolation verified via RLS subquery on parent process

---

#### Entity: Playbook Owner

**Description**: An owner or team member assigned to a playbook process.

**Properties**:
- `id` (UUID): Primary key
- `process_id` (UUID): Assigned process (FK to `playbook_processes`)
- `client_id` (UUID): Owner client (should match process's client_id)
- `user_id` (UUID, optional): Assigned user (FK to `profiles`)
- `name` (string): Owner name (if not a user)
- `role` (string, optional): Role or responsibility
- `created_at` (timestamp): Creation date
- `updated_at` (timestamp): Last update

**Business Rules**:
- Owners belong to the same client as their process
- An owner can be a registered user (user_id) or external contact (name only)
- Multiple owners can be assigned to one process
- Ownership is per-process, per-client

---

### 2. Relationships

```
┌───────────┐
│  clients  │
│ ────────  │
│ id (PK)   │
└─────┬─────┘
      │ 1
      │ (FK: client_id)
      │
      ├─────────────────────────────┬──────────────────────┐
      │                             │                      │
      │ *                           │ *                    │ *
  ┌───────────────────┐     ┌──────────────────┐   ┌──────────────────┐
  │    profiles       │     │  playbook_       │   │  playbook_       │
  │ ───────────────── │     │  processes       │   │  owners          │
  │ user_id (FK Auth) │     │ ───────────────  │   │ ──────────────── │
  │ client_id (FK) ◄──┼────→│ id (PK)          │   │ id (PK)          │
  │ role              │     │ client_id (FK) ◄─┼──→│ client_id (FK)   │
  │ created_at        │     │ name             │   │ process_id (FK)  │
  └───────────────────┘     │ status           │   │ user_id (FK)     │
                            │ owner_id (FK)    │   │ name             │
                            │ created_at       │   │ created_at       │
                            └────────┬─────────┘   └──────────────────┘
                                     │
                                     │ 1
                                     │ (FK: process_id)
                                     │
                                     │ *
                            ┌────────▼──────────┐
                            │  playbook_steps   │
                            │ ────────────────  │
                            │ id (PK)           │
                            │ process_id (FK)   │
                            │ client_id (derived│ ← Cascading isolation
                            │        via FK)    │
                            │ name              │
                            │ order             │
                            │ created_at        │
                            └───────────────────┘
```

**FK Isolation Chain**:
```
playbook_steps.process_id 
  → playbook_processes.id
    → playbook_processes.client_id
      → clients.id
```

This chain ensures that steps inherit client isolation from their parent process.

---

## Business Rules

### BR-001: Client Isolation

- **Rule**: Users can only access data belonging to their assigned `client_id`.
- **Implementation**: RLS policies on all playbook tables
- **Exception**: Admin users can switch `client_id` to access different clients

### BR-002: Immutable Client Assignment

- **Rule**: A process's `client_id` cannot be changed after creation.
- **Implementation**: No UPDATE allowed on `client_id` column (or audit/warn if attempted)
- **Rationale**: Prevents cross-client data migration or contamination

### BR-003: Admin Switcher

- **Rule**: Only users with `role='admin'` can change their `client_id`.
- **Implementation**: 
  ```sql
  CREATE POLICY admin_switch_client ON profiles
    FOR UPDATE
    USING (auth.uid() = user_id AND role = 'admin')
    WITH CHECK (auth.uid() = user_id AND role = 'admin')
  ```
- **Non-Admin**: `role='client'` users have fixed `client_id`; no switching allowed

### BR-004: Legacy Data Treatment

- **Rule**: Rows without `client_id` (NULL) are inaccessible and filtered by RLS.
- **Implementation**: RLS SELECT policy with `client_id = profiles.client_id` naturally filters NULL rows
- **Migration Path**: 
  - Identify orphaned rows in Phase MODEL
  - Assign to a known client or quarantine (Phase BUILD)
  - No automatic backfill during RLS deployment

### BR-005: Cascading Isolation for Steps

- **Rule**: Steps inherit isolation from their parent process via FK chain.
- **Implementation**: RLS SELECT policy uses subquery:
  ```sql
  (SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id) 
    = profiles.client_id
  ```
- **Implication**: Deleting a process cascades to delete or orphan its steps

### BR-006: Ownership Verification

- **Rule**: Users can only modify processes/steps/owners that belong to their client.
- **Implementation**: UPDATE/DELETE policies check `client_id` match
- **Exception**: Admin users respect the same RLS; they cannot bypass by role alone

### BR-007: Query Transparency

- **Rule**: JavaScript queries are transparent to RLS; application layer filtering is optional but recommended.
- **Implementation**: 
  - Application adds `.eq('client_id', userClientId)` for defense-in-depth
  - RLS blocks unauthorized rows regardless of JavaScript logic
- **Principle**: Never trust application filtering; RLS is the source of truth

---

## State Transitions

### Playbook Process Lifecycle

```
┌─────────┐
│  DRAFT  │  ← Initial state
└────┬────┘
     │ (admin activates)
     │
     ▼
┌──────────┐
│  ACTIVE  │  ← Can be modified, viewed
└────┬─────┘
     │ (admin archives)
     │
     ▼
┌──────────┐
│ ARCHIVED │  ← Read-only; no modifications
└──────────┘
```

**RLS applies to all states**; status is not a bypass mechanism.

---

## Invariants

### I-001: Client ID Consistency

- **Invariant**: For any playbook process, all its owners must have the same `client_id` as the process.
- **Enforcement**: FK constraints + RLS INSERT policy on `playbook_owners`
- **Check**: `SELECT p.id FROM playbook_processes p JOIN playbook_owners o ON p.id = o.process_id WHERE p.client_id != o.client_id;`
  - Should return 0 rows

### I-002: User Client Assignment

- **Invariant**: Every user in `profiles` must have a non-NULL `client_id`.
- **Enforcement**: NOT NULL constraint on `profiles.client_id`
- **Check**: `SELECT COUNT(*) FROM profiles WHERE client_id IS NULL;`
  - Should return 0

### I-003: Admin Role Restrictions

- **Invariant**: No user with `role='admin'` can have elevated permissions beyond their current `client_id`.
- **Enforcement**: RLS policies do not bypass based on role
- **Implication**: Admin must explicitly switch `client_id` to access other clients

### I-004: Process Ownership

- **Invariant**: A process can only be owned by a user from the same client.
- **Enforcement**: RLS INSERT/UPDATE policies check `client_id` match
- **Check**: `SELECT p.id FROM playbook_processes p WHERE p.owner_id IS NOT NULL AND p.owner_id NOT IN (SELECT user_id FROM profiles WHERE client_id = p.client_id);`
  - Should return 0 rows

---

## Business Workflows

### Workflow: Client User Views Playbook

```
1. User logs in (Supabase Auth)
   ↓ JWT token + auth.uid()
   
2. Application queries: SELECT client_id FROM profiles WHERE user_id = auth.uid()
   ↓ Returns user's assigned client_id (e.g., "Guadeloupe Explor")
   
3. Store in sessionStorage: { userClientId: "..." }
   ↓
   
4. User navigates to playbook.html
   ↓
   
5. JavaScript queries: 
   SELECT * FROM playbook_processes 
   .eq('client_id', userClientId)
   ↓ Supabase client appends filter
   ↓ RLS policy verified
   ↓ Database returns only "Guadeloupe Explor" processes
   
6. Playbook renders with filtered data
   ✓ User sees only their client's data
```

### Workflow: Admin Switches Client

```
1. Admin logs in (role='admin', client_id="Client A")
   ↓
   
2. Admin clicks "Switch Client" dropdown
   ↓ Component shows available clients
   
3. Admin selects "Client B"
   ↓
   
4. JavaScript calls: POST /api/switch-client { client_id: "Client B" }
   ↓ Supabase RLS protects endpoint
   ↓ Only role='admin' can execute
   
5. Backend executes: UPDATE profiles SET client_id = "Client B" WHERE user_id = auth.uid()
   ↓ RLS applies; admin can update their own row
   
6. Response: { success: true, client_id: "Client B" }
   ↓
   
7. JavaScript refreshes playbook queries
   ↓
   
8. New queries scoped to Client B via .eq('client_id', "Client B")
   ↓ RLS returns Client B data
   
9. Playbook renders with Client B data
   ✓ Admin sees only Client B (Client A data hidden)
```

### Workflow: Unauthorized Cross-Client Access Attempt

```
1. Attacker obtains ANON key from HTML source
   ↓
   
2. Attacker constructs direct query:
   SELECT * FROM playbook_processes WHERE client_id != user's_client_id
   ↓
   
3. Query sent to Supabase with ANON key (no auth.uid())
   ↓ RLS policy evaluated:
   ├─ (auth.uid() = profiles.user_id) → FAILS (no auth.uid())
   └─ Query BLOCKED by RLS
   
4. Supabase returns: "permission denied" or empty result
   ✗ Attack fails; cross-client data inaccessible
```

---

## Data Validation Rules

### DV-001: Client ID Format

- **Type**: UUID (RFC 4122)
- **Required**: YES (NOT NULL)
- **Format**: 8-4-4-4-12 hex digits

### DV-002: User Role Values

- **Type**: Enum
- **Valid Values**: `'admin'`, `'client'`
- **Default**: `'client'`
- **Validation**: Application enforces during user creation

### DV-003: Process Status Values

- **Type**: Enum
- **Valid Values**: `'draft'`, `'active'`, `'archived'`
- **Default**: `'draft'`

### DV-004: Process Name

- **Type**: String
- **Max Length**: 255 characters
- **Required**: YES (NOT NULL)
- **Validation**: No SQL injection, validate at application layer

---

## Error Handling

### EH-001: RLS Violation

- **Scenario**: User attempts to access data outside their `client_id`
- **Database Response**: `permission denied` error
- **Application Response**: 
  - Log error (do not expose details)
  - Return 403 Forbidden to client
  - Display: "You do not have permission to access this resource"

### EH-002: Invalid Client ID Switch

- **Scenario**: Non-admin user attempts to call switch-client endpoint
- **Database Response**: UPDATE fails (RLS policy blocks)
- **Application Response**: 
  - Return 403 Forbidden
  - Display: "Only administrators can switch clients"

### EH-003: Orphaned Row Access

- **Scenario**: Query returns a row with `client_id = NULL`
- **RLS Response**: Row filtered out (no access granted)
- **Application Response**: 
  - Row is never returned to client
  - Appears as empty result set

---

## Audit and Compliance

### AC-001: Data Access Audit

- **Requirement**: Document which users accessed which clients
- **Implementation**: PostgreSQL logs capture RLS denials
- **Output**: `pg_logs` contain `permission denied` entries with user/query context
- **Frequency**: Continuous; queryable via Supabase logs interface

### AC-002: Secure-by-Design Compliance

- **Framework**: Mickaël's Secure-by-Design checklist (referenced in CLAUDE.md)
- **Items Verified**:
  - Authentication: Supabase Auth handles JWT validation
  - Authorization: RLS policies enforce access control
  - Data Protection: Encryption at rest (Supabase managed)
  - Injection Prevention: Parameterized queries (Supabase JS client)
  - Audit Trail: PostgreSQL logs + RLS denial logging

---

## Performance Considerations

### PC-001: RLS Query Performance

- **Overhead**: <5% per query (PostgreSQL RLS is optimized)
- **Scaling**: Scales horizontally with client count (no O(n) loops)
- **Optimization**: Index on `(client_id)` recommended if not already present

### PC-002: Cascading RLS Subqueries

- **Impact**: Subqueries in RLS policies (e.g., playbook_steps) may add latency
- **Mitigation**: 
  - Index on `playbook_processes.id`
  - Index on `playbook_steps.process_id`
  - Caching at application layer (optional)

### PC-003: Admin Switcher Latency

- **Expectation**: <500ms for switch operation (single UPDATE row)
- **Measurement**: Monitor in Phase QA

---

## Future Extensions (Out of Scope for V1)

1. **Granular RBAC**: Fine-grained role-based access control (beyond admin/client)
2. **Audit Logging**: Explicit `audit_logs` table for compliance (relies on PostgreSQL logs in V1)
3. **Rate Limiting**: API rate limiting per client (RLS is the boundary in V1)
4. **Delegation**: Sub-admins with delegated permissions (not supported in V1)
5. **Data Residency**: Client-specific data locality (Supabase region-based in V1)

---

## Dependencies & Prerequisites

### D-001: Database Schema

- `clients` table must exist
- `profiles` table must have `client_id` column
- `playbook_processes` table must have `client_id` column
- `playbook_owners` table must have `client_id` column
- `playbook_steps` table must exist with `process_id` FK

### D-002: Authentication

- Supabase Auth configured with JWT tokens
- `auth.uid()` available in RLS context

### D-003: JavaScript Environment

- Supabase JavaScript client library
- `.eq()` method available for filtering

---

**Document prepared by**: Factory Pipeline (MODEL Phase - Domain Analysis)  
**For review by**: Domain Experts, Architect, Product Manager  
**Status**: Ready for Implementation Planning
