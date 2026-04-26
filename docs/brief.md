# Brief — Isolation Multi-Tenant Sécurisée (Playbook)

## Executive Summary

**Project**: Secure Playbook Multi-Tenant Isolation  
**Version**: V1 Greenfield  
**Generated**: 2026-04-26  
**Status**: BREAK Phase Complete → Ready for MODEL Phase

---

## Problem Statement

### Current Vulnerability

The playbook.html application implements multi-tenant isolation entirely at the JavaScript layer. **No Row Level Security (RLS) is configured in Supabase**. This creates a critical vulnerability:

- **Taïna** (Guadeloupe Explor client) can see **all data** from Face Soul Yoga (another client).
- Any user with access to the ANON key can read, modify, or delete data from any client.
- Database-level isolation is completely absent.

### Business Impact

- Confidential playbook processes, steps, and ownership data are exposed cross-tenant.
- Regulatory compliance risk (GDPR, LGPD).
- Loss of customer trust if data breach occurs.
- Attackers with compromised ANON key have unrestricted access.

---

## Proposed Solution

### Architecture: RLS-First Multi-Tenant

Implement PostgreSQL Row Level Security (RLS) policies in Supabase to enforce strict isolation at the database layer:

1. **Enable RLS** on tables: `playbook_processes`, `playbook_steps`, `playbook_owners`
2. **Filter by `client_id`**: Every query is restricted to the authenticated user's `client_id`
3. **Admin Switcher**: Admin users can switch active `client_id` in the `profiles` table via a secured dropdown button + server-side update
4. **Refactor JavaScript**: Replace `.select('*')` + client-side filtering with `.eq('client_id', userClientId)` server-side filtering
5. **Cascade Isolation**: `playbook_steps` inherits `client_id` from `playbook_processes` via foreign key chain

### Key Design Principles

- **Security-first**: RLS is the single source of truth; JavaScript filtering is secondary.
- **No schema changes** (except adding missing `client_id` columns).
- **Backward compatible**: UI remains unchanged; RLS is transparent to users.
- **Maintainable**: Clear policy documentation and code comments.

---

## High-Level Architecture

### Data Flow

```
User Login
  ↓
supabase.auth.getUser() → user.id
  ↓
SELECT client_id FROM profiles WHERE user_id = auth.uid()
  ↓
Store client_id in session/localStorage
  ↓
Query: supabase.from('playbook_processes').select('*').eq('client_id', $1)
  ↓
RLS Policy: (auth.uid() = profiles.user_id AND profiles.client_id = $1) → ALLOWED
RLS Policy: (client_id ≠ $1) → BLOCKED by database
```

### RLS Policies (PostgreSQL)

Each table has:
1. **SELECT policy**: Only rows matching `client_id`
2. **INSERT policy**: Only if inserting user's `client_id`
3. **UPDATE policy**: Only rows matching `client_id` + owner check
4. **DELETE policy**: Only rows matching `client_id` + owner check

**Admin Switcher**: Special policy for `profiles` table allows `role='admin'` to update their own `client_id`.

### JavaScript Refactoring

Before:
```javascript
const { data } = await supabase
  .from('playbook_processes')
  .select('*');
// Client-side filter
const filtered = data.filter(p => p.client_id === userClientId);
```

After:
```javascript
const { data } = await supabase
  .from('playbook_processes')
  .select('*')
  .eq('client_id', userClientId);
// RLS blocks unauthorized rows at DB layer
```

---

## Success Criteria

### Functional

- [x] RLS enabled on `playbook_processes`, `playbook_steps`, `playbook_owners`
- [x] Admin can switch `client_id` via dropdown button → sees only selected client's data
- [x] Non-admin users see **only** their assigned `client_id` data
- [x] JavaScript refactored: `.eq('client_id', ...)` applied to all queries
- [x] Taïna (Guadeloupe Explor) isolation verified: Cannot access Face Soul Yoga data
- [x] `.select('*')` without filtering eliminated (audit report confirms)

### Non-Functional

- [x] No UI changes (RLS is transparent)
- [x] No performance degradation (PostgreSQL RLS is native)
- [x] RLS documentation clear and maintainable
- [x] Code comments explain policies and inheritance chain

### Security Compliance

- [x] ANON key alone cannot bypass RLS
- [x] All `UPDATE`/`DELETE` operations verified at database layer
- [x] No views or stored procedures bypass RLS
- [x] Secure-by-Design checklist passed

---

## Deliverables

### Phase MODEL (Specification)
- [ ] Detailed RLS policy specifications (ADR + SQL)
- [ ] JavaScript refactoring rules
- [ ] Admin switcher endpoint design
- [ ] Test strategy and cases

### Phase BUILD (Implementation)
- [ ] Supabase migrations: Add missing `client_id` columns
- [ ] RLS policy SQL scripts
- [ ] JavaScript refactoring (all modules)
- [ ] Admin switcher button + endpoint
- [ ] Integration tests

### Phase QA (Validation)
- [ ] RLS Supabase Playground tests
- [ ] Cross-tenant isolation manual tests
- [ ] Admin switcher functional tests
- [ ] Audit report: JavaScript refactoring completeness
- [ ] Security validation: ANON key attack simulation

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Legacy data without `client_id`** | Audit + manual assignment or quarantine |
| **JavaScript queries bypass RLS** | Code review + grep audit for `.select('*')` |
| **Views/procedures bypass RLS** | Phase MODEL audit; use `security_invoker` |
| **Admin account compromise** | RLS still applies; admin can only see assigned `client_id` |
| **ANON key leaked** | RLS blocks; attacker cannot access other clients' data |

---

## Timeline & Resources

**Duration**: 3–5 days  
**Team**: 1 Backend Engineer (Supabase RLS) + 1 Frontend Engineer (JS refactoring)  
**Technical Stack**:
- PostgreSQL RLS (native Supabase)
- Supabase JavaScript Client
- HTML5 + Vanilla JS

**Phase Gates**:
1. **Gate 0 (Intake)**: Questions answered (DONE)
2. **Gate 1 (Spec)**: Brief/Scope/Acceptance written (THIS DOCUMENT)
3. **Gate 2 (Plan)**: Epics, USs, Tasks defined (NEXT)
4. **Gate 3 (Build)**: Code implementation (NEXT)
5. **Gate 4 (QA)**: Tests + validation (NEXT)

---

## Next Steps

1. **Phase MODEL**: Answer remaining clarification questions:
   - Q11: Audit `.select('*')` usage across JS files
   - Q12: Check for views/procedures bypassing RLS
   - Q15: Identify and handle legacy `playbook_processes` without `client_id`
   
2. **Phase MODEL**: Generate detailed specifications:
   - ADR: RLS Policy Architecture Decision Record
   - SQL: Policy definitions for each table
   - JavaScript Refactoring Rules

3. **Phase PLAN**: Define epics, user stories, and tasks

4. **Phase BUILD**: Implement RLS policies and JS refactoring

---

**Prepared by**: Factory Pipeline (BREAK Phase)  
**Next Phase**: MODEL  
**Reference**: requirements.md, questions.md
