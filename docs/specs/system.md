# System Specification — Secure Playbook Multi-Tenant Isolation

**Version**: 1.0  
**Evolution Mode**: Greenfield V1  
**Generated**: 2026-04-26  
**Phase**: MODEL (Specifications)  
**Status**: Ready for Architecture Review

---

## Executive Summary

This document specifies the functional architecture for implementing secure multi-tenant isolation in the playbook.html application. The solution enforces data isolation at the PostgreSQL Row Level Security (RLS) layer, with JavaScript queries respecting the same isolation rules at the application layer.

**Key Principle**: RLS is the single source of truth; JavaScript filtering is defense-in-depth.

---

## System Architecture

### 1. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ User Authentication (Supabase Auth)                             │
│ ↓ JWT token with auth.uid()                                     │
├─────────────────────────────────────────────────────────────────┤
│ Client Discovery (JavaScript)                                   │
│ SELECT client_id FROM profiles WHERE user_id = auth.uid()       │
│ ↓ Store in sessionStorage/localStorage                          │
├─────────────────────────────────────────────────────────────────┤
│ Query Construction (JavaScript Layer)                           │
│ SELECT * FROM playbook_processes                                │
│ .eq('client_id', userClientId)  ← Application-level filter      │
│ ↓ Supabase client sends query                                   │
├─────────────────────────────────────────────────────────────────┤
│ Database Enforcement (PostgreSQL RLS)                           │
│ Policy: (auth.uid() = profiles.user_id                          │
│          AND profiles.client_id = playbook_processes.client_id) │
│ ↓ RLS blocks unauthorized access at database layer              │
├─────────────────────────────────────────────────────────────────┤
│ Response (Filtered Data)                                        │
│ Only rows matching user's client_id returned                    │
│ ↓ Guaranteed isolation enforced by database                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Multi-Tenant Model

**Tenant Boundary**: `client_id` (UUID, foreign key to `clients` table)

**User Roles**:
- **Admin** (`role='admin'`): Can switch between clients. Sees only the active `client_id`.
- **Client** (`role='client'`): Locked to their assigned `client_id`. Cannot switch.

**Data Isolation**:
- Every user query is scoped to their current `client_id` via RLS policies.
- Cross-tenant data access is blocked at the database layer.
- Legacy rows without `client_id` are filtered out by RLS (NULL ≠ any value).

---

## Functional Requirements

### FR-001: RLS Policy on `playbook_processes`

**Description**: Enable Row Level Security on `playbook_processes` table with complete CRUD policies.

**Policy Details**:

| Policy | Trigger | Logic | Effect |
|--------|---------|-------|--------|
| **SELECT** | SELECT query | `profiles.client_id = playbook_processes.client_id` | User sees only processes from their client |
| **INSERT** | INSERT statement | `auth.uid() = profiles.user_id AND profiles.client_id = NEW.client_id` | User can only insert into their own client |
| **UPDATE** | UPDATE statement | `auth.uid() = profiles.user_id AND profiles.client_id = playbook_processes.client_id` | User can only update their own client's processes |
| **DELETE** | DELETE statement | `auth.uid() = profiles.user_id AND profiles.client_id = playbook_processes.client_id` | User can only delete their own client's processes |

**Verification**:
- [ ] Supabase Playground test: Admin queries SELECT/INSERT/UPDATE/DELETE for Client A only
- [ ] Supabase Playground test: Admin cannot access Client B data
- [ ] ANON key alone cannot access any data (RLS blocks without authentication)

---

### FR-002: RLS Policy on `playbook_steps` (Cascading Isolation)

**Description**: Enable Row Level Security on `playbook_steps` with cascading isolation via foreign key relationship.

**Architecture**:
- `playbook_steps.process_id` → `playbook_processes.id` (FK)
- `playbook_processes.client_id` → `clients.id` (FK)
- **RLS traverses the FK chain**: Steps inherit `client_id` from their parent process

**Policy Details**:

| Policy | Trigger | Logic | Effect |
|--------|---------|-------|--------|
| **SELECT** | SELECT query | `(SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id) = profiles.client_id` | User sees only steps from processes in their client |
| **INSERT** | INSERT statement | `(SELECT client_id FROM playbook_processes WHERE id = NEW.process_id) = profiles.client_id AND auth.uid() = profiles.user_id` | User can only insert steps into their own client's processes |
| **UPDATE** | UPDATE statement | `(SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id) = profiles.client_id AND auth.uid() = profiles.user_id` | User can only update steps in their own client's processes |
| **DELETE** | DELETE statement | `(SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id) = profiles.client_id AND auth.uid() = profiles.user_id` | User can only delete steps from their own client's processes |

**Verification**:
- [ ] Supabase Playground test: User A cannot query steps from User B's processes
- [ ] Supabase Playground test: FK chain verified with multiple nesting levels
- [ ] Orphaned steps (process_id = NULL) blocked by FK constraint (or filtered by RLS)

---

### FR-003: RLS Policy on `playbook_owners`

**Description**: Enable Row Level Security on `playbook_owners` table.

**Policy Details**:

| Policy | Trigger | Logic | Effect |
|--------|---------|-------|--------|
| **SELECT** | SELECT query | `profiles.client_id = playbook_owners.client_id` | User sees only owners from their client |
| **INSERT** | INSERT statement | `auth.uid() = profiles.user_id AND profiles.client_id = NEW.client_id` | User can only add owners to their client |
| **UPDATE** | UPDATE statement | `auth.uid() = profiles.user_id AND profiles.client_id = playbook_owners.client_id` | User can only update their client's owners |
| **DELETE** | DELETE statement | `auth.uid() = profiles.user_id AND profiles.client_id = playbook_owners.client_id` | User can only delete their client's owners |

**Verification**:
- [ ] Supabase Playground test: Owner records filtered by client_id
- [ ] ANON key cannot access owner records

---

### FR-004: Admin Client Switcher

**Description**: Allow admin users to switch their active `client_id` to see data from different clients.

**Mechanism**:
1. **UI Component**: Dropdown button/modal in playbook.html (admin-only)
   - Displays list of all clients
   - Shows current active client (highlighted)
   - Allows admin to select a new client
   - Hidden from non-admin users

2. **Backend Endpoint**: Secure API endpoint for switching
   - Endpoint: `POST /api/switch-client` (or via Supabase RLS-protected update)
   - Input: `{ client_id: UUID }`
   - Logic:
     ```sql
     UPDATE profiles 
     SET client_id = $1 
     WHERE user_id = auth.uid() AND role = 'admin'
     ```
   - RLS Enforcement: Only admins can execute this update

3. **JavaScript Refactoring**:
   - After switch, refresh all playbook queries
   - Queries automatically scoped to new `client_id` via RLS
   - No client-side cache invalidation needed (database enforces isolation)

**Verification**:
- [ ] Admin can switch between clients
- [ ] After switch, playbook data reflects new client
- [ ] Non-admin users cannot access the switcher (UI hidden + RLS blocks endpoint)
- [ ] Session persistence: Closing and reopening playbook respects the selected client

---

### FR-005: JavaScript Layer Refactoring

**Description**: Update all JavaScript queries to explicitly filter by `client_id`.

**Pattern Changes**:

**Before** (Vulnerable):
```javascript
const { data } = await supabase
  .from('playbook_processes')
  .select('*');
// Client-side filtering (easily bypassed)
const filtered = data.filter(p => p.client_id === userClientId);
```

**After** (Secure):
```javascript
const { data } = await supabase
  .from('playbook_processes')
  .select('*')
  .eq('client_id', userClientId);  // Server-side filtering + RLS enforcement
```

**Affected Modules**:
- `js/client/playbook.js` (or equivalent)
- `js/admin/playbook-admin.js` (or equivalent)
- Any other modules querying `playbook_processes`, `playbook_steps`, `playbook_owners`

**Scope**:
- SELECT queries: Add `.eq('client_id', userClientId)`
- INSERT queries: Include `client_id: userClientId` in payload
- UPDATE queries: Add `.eq('client_id', userClientId)` filter
- DELETE queries: Add `.eq('client_id', userClientId)` filter

**Code Comments**:
- All refactored queries include comment: "// RLS enforces client_id filtering at database layer"
- Admin switcher logic: "// Admin can switch clients; RLS restricts to new client_id"

---

### FR-006: Database Schema Verification

**Description**: Confirm `client_id` column presence and integrity in all relevant tables.

**Required Columns**:

| Table | Column | Type | Constraints | Status |
|-------|--------|------|-------------|--------|
| `profiles` | `client_id` | UUID | FK to `clients.id`, NOT NULL | ✓ Confirmed (Q1) |
| `playbook_processes` | `client_id` | UUID | FK to `clients.id`, NOT NULL | ✓ Confirmed (Q6) |
| `playbook_owners` | `client_id` | UUID | FK to `clients.id` (nullable or not) | ✓ Confirmed (Q4) |

**Verification**:
- [ ] `\d profiles` in PostgreSQL shows `client_id` column
- [ ] `\d playbook_processes` shows `client_id` column
- [ ] `\d playbook_owners` shows `client_id` column
- [ ] All FKs are properly defined and enforced

---

### FR-007: Legacy Data Handling

**Description**: Handle existing `playbook_processes` rows without `client_id`.

**Decision** (from Phase BREAK Scope, Q15):
- Count orphaned rows: `SELECT COUNT(*) FROM playbook_processes WHERE client_id IS NULL;`
- Classification:
  - **Assignable**: Rows that can be assigned to a known client
  - **Orphaned**: Rows with no clear client ownership
  - **Delete**: Rows that are historical/test data

**Migration Strategy**:
- Option A: Backfill known clients (if orphaned rows belong to a client)
- Option B: Quarantine in separate table (for audit/recovery)
- Option C: Delete (if test data or confirmed obsolete)

**Output**: Migration script with clear comments and rollback capability

---

## Non-Functional Requirements

### NFR-001: Security

- **RLS is the single source of truth**: Database layer enforces isolation.
- **No bypass mechanisms**: Views, stored procedures, and Edge Functions must respect RLS.
- **ANON key exposure**: RLS blocks unauthenticated access (ANON key alone cannot query RLS-protected tables).
- **Admin compromise**: Even if admin account is compromised, RLS restricts access to assigned `client_id`.

### NFR-002: Performance

- **RLS Overhead**: PostgreSQL RLS has minimal performance impact (<5% query latency).
- **No new indices required**: Existing `client_id` indices (if present) are reused.
- **Scalability**: RLS scales horizontally with database growth.

### NFR-003: Backward Compatibility

- **UI unchanged**: RLS is transparent to users; playbook.html interface remains the same.
- **API compatibility**: Supabase JavaScript client supports all required RLS operations.
- **No schema redesign**: Only adding RLS policies; no breaking schema changes.

### NFR-004: Maintainability

- **Clear code comments**: All RLS policies and refactored JavaScript include inline documentation.
- **Architecture documentation**: RLS architecture document explains inheritance chain and policies.
- **Audit trail**: Legacy data handling is documented for future audits.

---

## Integration Points

### 1. Supabase Configuration

- **Project**: dcynlifggjiqqihincbp (eu-north-1)
- **Authentication**: Supabase Auth (email/password) with JWT tokens
- **RLS**: PostgreSQL RLS policies on three tables

### 2. Deployment

- **Frontend**: GitHub Pages (playbook.html, js/, css/)
- **Backend**: Supabase (managed PostgreSQL)
- **CI/CD**: Existing GitHub Pages deployment (no changes)

### 3. Client Library

- **Supabase JavaScript Client**: Existing, with `.eq()` method for filtering

---

## Success Criteria

### Functional Success

- [ ] RLS policies deployed on all three tables
- [ ] Admin can switch between clients
- [ ] Non-admin users see only their assigned client's data
- [ ] JavaScript queries refactored to use `.eq('client_id', ...)`
- [ ] All integration tests pass

### Security Success

- [ ] ANON key cannot access RLS-protected data
- [ ] Taïna (Guadeloupe Explor) cannot see Face Soul Yoga data
- [ ] Admin can only see assigned `client_id` after switch
- [ ] No console errors or RLS violation warnings

### Non-Functional Success

- [ ] <5% performance degradation (if any)
- [ ] Zero breaking changes to UI
- [ ] Full backward compatibility maintained

---

## Architecture Decisions (To Be Formalized in ADR)

1. **RLS at Database Layer** (decided in Phase BREAK)
   - Pro: Single source of truth; impossible to bypass
   - Con: Requires PostgreSQL RLS knowledge

2. **Admin Switcher via RLS** (decided in Phase BREAK)
   - Pro: Leverages existing RLS infrastructure
   - Con: Requires special policy for admin role

3. **Cascading RLS via FK** (decided in Phase BREAK)
   - Pro: Inherits isolation automatically; no duplicate logic
   - Con: Requires FK chain to exist

---

## Dependencies

- PostgreSQL 9.5+ (RLS feature)
- Supabase (managed PostgreSQL with RLS support)
- Supabase JavaScript Client (for `.eq()` filtering)
- HTML5 + Vanilla JavaScript (no framework changes)

---

## Timeline

- **Phase MODEL**: 1 day (this document + ADR + rules generation)
- **Phase PLAN**: 1 day (epic/user story definition)
- **Phase BUILD**: 2–3 days (RLS implementation + JavaScript refactoring)
- **Phase QA**: 1 day (testing + security validation)

**Total**: 5–6 days

---

## Next Steps

1. **Phase ARCHITECT**: Generate technical API specifications and ADR-0001-rls-isolation.md
2. **Phase ARCHITECT**: Create project-config.json with RLS policy summary
3. **Phase RULES-MEMORY**: Generate Claude Code rules for maintenance and refactoring
4. **Phase PLAN**: Define epics and user stories based on this system spec
5. **Phase BUILD**: Implement RLS policies and JavaScript refactoring

---

**Document prepared by**: Factory Pipeline (MODEL Phase)  
**For review by**: Project Manager, Architect, Security Lead  
**Status**: Ready for Architecture Specification Phase
