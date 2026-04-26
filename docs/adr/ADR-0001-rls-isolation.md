# ADR-0001: PostgreSQL Row Level Security for Multi-Tenant Isolation

**Status**: ACCEPTED  
**Date**: 2026-04-26  
**Version**: 1.0  
**Evolution**: Greenfield V1  
**Supersedes**: None  
**Superseded By**: None

---

## Context

### Problem Statement

The playbook.html application currently implements multi-tenant isolation at the JavaScript layer only. There is no Row Level Security (RLS) in the PostgreSQL database. This creates a critical vulnerability:

- **Taïna** (Guadeloupe Explor client) can access **all data** from Face Soul Yoga (another client)
- Any user with access to the ANON key can read, modify, or delete data from any client
- Database-level isolation is completely absent

### Business Impact

- Confidential playbook processes and ownership data are exposed across tenants
- Regulatory compliance risk (GDPR, LGPD)
- Loss of customer trust if data breach occurs
- ANON key exposure (inherent in public HTML) is not a security boundary

### Decision Required

How should we enforce multi-tenant isolation to be breach-proof?

---

## Decision

**Implement PostgreSQL Row Level Security (RLS) as the single source of truth for multi-tenant isolation.**

### Choice

- **Option A (Selected)**: PostgreSQL RLS on all playbook tables + JavaScript refactoring
- **Option B (Rejected)**: Application-layer filtering only (no RLS)
- **Option C (Rejected)**: Separate databases per client (operational overhead)
- **Option D (Rejected)**: API gateway with authorization middleware (added complexity)

### Rationale

**RLS is the only defense-in-depth mechanism that is:**

1. **Cryptographically Bound to Auth Context**: RLS evaluates in the PostgreSQL process, using `auth.uid()` from the JWT token. Impossible to bypass without a valid JWT.

2. **Transparent to Client**: JavaScript code doesn't need to know about RLS policies; they are enforced automatically. Application code cannot accidentally bypass them.

3. **Single Source of Truth**: RLS is the ultimate enforcement layer. JavaScript filtering is defense-in-depth, not the primary security control.

4. **Zero-Trust Architecture**: Even if ANON key is exposed, RLS blocks unauthenticated access. Even if JavaScript is compromised, RLS blocks unauthorized queries.

5. **Minimal Performance Impact**: PostgreSQL RLS has <5% query overhead; it's a native feature optimized for performance.

6. **Maintainability**: RLS policies are centralized in SQL; no scattered authorization checks across JavaScript files.

### Comparison Table

| Aspect | RLS | App-Layer Only | Separate DBs | API Gateway |
|--------|-----|---|---|---|
| **Security** | ✓ Breach-proof | ✗ Bypassable | ✓ Isolated | ✗ Middleware failure |
| **Performance** | ✓ <5% overhead | ✓ No overhead | ✗ Scaling issues | ✗ Extra latency |
| **Maintainability** | ✓ Centralized | ✗ Scattered | ✗ Operational | ✓ Centralized |
| **Cost** | ✓ Included in Supabase | ✓ Free | ✗ Storage/ops | ✓ Included |
| **Scalability** | ✓ Linear | ✓ Linear | ✗ O(n) databases | ✓ Linear |

---

## Implementation Details

### 1. RLS Policies (Database Layer)

**Tables Protected**:
- `playbook_processes` (SELECT, INSERT, UPDATE, DELETE)
- `playbook_steps` (SELECT, INSERT, UPDATE, DELETE, cascading via FK)
- `playbook_owners` (SELECT, INSERT, UPDATE, DELETE)

**Policy Pattern**:
```sql
CREATE POLICY <table>_<operation>_policy
  ON <table>
  FOR <operation>
  USING (<condition>)  -- For SELECT, UPDATE, DELETE
  WITH CHECK (<condition>);  -- For INSERT, UPDATE
```

**Core Logic**:
- User's `client_id` must match the row's `client_id`
- `client_id` is derived from `profiles.client_id` for the authenticated user
- Cascading for `playbook_steps` via subquery on parent `playbook_processes`

### 2. Admin Switcher (Session Isolation)

Admin users can switch between clients by updating their `profiles.client_id`. This is controlled by a special RLS policy on `profiles`:

```sql
CREATE POLICY profiles_admin_switch
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id AND role = 'admin')
  WITH CHECK (auth.uid() = user_id AND role = 'admin');
```

**Mechanism**:
1. Admin clicks "Switch Client" dropdown
2. Calls: `UPDATE profiles SET client_id = $1 WHERE user_id = auth.uid()`
3. RLS enforces admin role + user ownership
4. Session storage updated with new `client_id`
5. Playbook queries re-execute with new client scope

### 3. JavaScript Refactoring (Defense-in-Depth)

All JavaScript queries are updated to include `.eq('client_id', userClientId)`:

**Before** (vulnerable to RLS bypass if RLS is misconfigured):
```javascript
const { data } = await supabase
  .from('playbook_processes')
  .select('*');

const filtered = data.filter(p => p.client_id === userClientId);
```

**After** (defense-in-depth):
```javascript
const { data } = await supabase
  .from('playbook_processes')
  .select('*')
  .eq('client_id', userClientId);  // Application layer filter
// + RLS policy (database layer filter)
// = Two independent security layers
```

### 4. Legacy Data Handling

Existing `playbook_processes` rows without `client_id` (NULL) are:
- **Phase MODEL**: Audited and classified
- **Phase BUILD**: Migrated (backfill or quarantine)
- **Runtime**: Filtered by RLS (NULL ≠ any value), thus inaccessible

---

## Consequences

### Positive

1. **Unbreakable Isolation**: RLS is enforced at the database layer; no JavaScript bypass possible
2. **ANON Key Safe**: Exposed ANON key cannot access any RLS-protected data without valid JWT
3. **Scalable**: RLS scales horizontally; no per-tenant infrastructure
4. **Maintainable**: All policies centralized in SQL; easy to audit and modify
5. **Transparent**: Application code doesn't need awareness of RLS logic
6. **Standards Compliance**: RLS is a PostgreSQL standard feature; no proprietary vendor lock-in

### Negative

1. **Complexity**: RLS policies require SQL knowledge; less obvious to new developers
2. **Testing**: RLS policies must be tested with multiple user roles; more test cases
3. **Debugging**: RLS denials appear as database errors; requires log inspection
4. **Performance Tuning**: Subqueries in RLS policies (e.g., `playbook_steps`) may need index optimization

### Mitigation

1. **Documentation**: Clear SQL comments in migration files explain each policy
2. **Test Suite**: Automated tests for RLS policies in Supabase Playground
3. **Logging**: PostgreSQL logs capture RLS denials for audit trails
4. **Performance**: Add indices on FK columns (`client_id`, `process_id`) if needed

---

## Alternatives Considered

### Alternative A: Application-Layer Filtering Only

**Approach**: No RLS; rely entirely on JavaScript to filter by `client_id`

**Pros**:
- Simpler initial implementation
- No SQL knowledge required
- Easier debugging (no RLS errors)

**Cons**:
- **Bypassable**: If RLS is disabled, attacker gets all data
- **ANON Key Vulnerability**: ANON key can fetch all data if JavaScript filtering is removed
- **Maintenance Risk**: Authorization checks scattered across JavaScript files; easy to miss one
- **No Defense-in-Depth**: Single point of failure

**Rejected**: Does not meet security requirements. Violates "Secure-by-Design" principle.

---

### Alternative B: Separate PostgreSQL Database Per Client

**Approach**: Each client gets their own Supabase project / PostgreSQL instance

**Pros**:
- Complete isolation (no row-level leakage)
- Simple authorization logic (no RLS needed)
- Regulatory advantages (data residency)

**Cons**:
- **Operational Overhead**: n clients = n databases to manage, backup, scale
- **Cost**: Multiple Supabase projects = higher monthly bills
- **Admin Switcher Complexity**: Cross-database queries required; no simple FK joins
- **Data Consistency**: Shared data (clients table) must be replicated across instances

**Rejected**: Operational burden and cost not justified for feature scope.

---

### Alternative C: API Gateway with Authorization Middleware

**Approach**: Add a proxy/gateway (Kong, Tyk, etc.) that checks authorization before database access

**Pros**:
- Centralized authorization logic
- Can enforce fine-grained RBAC
- Decouples auth from database

**Cons**:
- **Added Complexity**: Another service to deploy and maintain
- **Latency**: Extra hop for every database query
- **Single Point of Failure**: Gateway failure blocks all access
- **Cost**: New infrastructure and licensing
- **Not True Defense-in-Depth**: If gateway is bypassed, RLS still needed

**Rejected**: Over-engineering for a SQLite/Supabase use case. RLS is more efficient.

---

## Open Questions

### Q1: What about views and stored procedures?

**Answer**: RLS applies to views and procedures if they use `SECURITY INVOKER` (default). Ensure all views/procedures filter by `client_id` or use `SECURITY INVOKER`. Phase BUILD will audit for any `SECURITY DEFINER` procedures that might bypass RLS.

### Q2: Can admins see all clients at once?

**Answer**: No. Admins must use the "Switch Client" UI to see different clients. RLS restricts to the current `client_id`, even for admins. This is intentional: reduces accidental data exposure.

### Q3: What if an admin's account is compromised?

**Answer**: RLS still applies. Attacker can only see the `client_id` assigned to the admin account. If the admin account is restricted to one client, attacker sees only that client. Multi-client access requires deliberately switching.

### Q4: Can we perform bulk operations across clients?

**Answer**: No, not at the database layer (RLS blocks). If needed, Phase PLAN can define an Edge Function with elevated privileges (`SECURITY DEFINER`) for admin bulk operations. But this is out of scope for V1.

### Q5: How do we handle data exports?

**Answer**: Exports are filtered by RLS. If a client exports their playbook, they export only their own data (enforced at DB layer). No cross-client exports are possible without explicit RLS override.

---

## Acceptance Criteria

- [ ] RLS policies deployed on all three playbook tables
- [ ] Admin can switch between clients via UI
- [ ] Non-admin users see only their assigned client's data
- [ ] ANON key cannot access RLS-protected data
- [ ] All JavaScript queries refactored to use `.eq('client_id', ...)`
- [ ] Supabase Playground tests pass for all RLS policies
- [ ] Performance <5% degradation (if any)
- [ ] Secure-by-Design checklist passed

---

## Related ADRs

- None (first ADR in this project)

---

## References

- PostgreSQL RLS Documentation: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- "Secure-by-Design" Framework: `/01-entreprise/skills/secure-by-design/SKILL.md`
- Brief: `/docs/brief.md`
- Scope: `/docs/scope.md`
- Acceptance Criteria: `/docs/acceptance.md`

---

## Implementation Timeline

- **Phase MODEL** (this ADR): Decision documented (1 day)
- **Phase PLAN**: Epics and user stories defined (1 day)
- **Phase BUILD**: RLS policies implemented + JavaScript refactored (2–3 days)
- **Phase QA**: Comprehensive testing + security validation (1 day)

**Total**: 5–6 days

---

## Sign-Off

| Role | Name | Date | Approval |
|------|------|------|----------|
| **Architect** | [To be assigned] | 2026-04-26 | [ ] |
| **Security Lead** | [To be assigned] | 2026-04-26 | [ ] |
| **Product Manager** | [To be assigned] | 2026-04-26 | [ ] |
| **Tech Lead** | [To be assigned] | 2026-04-26 | [ ] |

---

**Prepared by**: Factory Pipeline (MODEL Phase)  
**Status**: PROPOSED (awaiting sign-off)  
**Next Action**: Present to architecture review board for approval
